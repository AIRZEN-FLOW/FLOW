// Étape 8 — Callback OAuth Google : échange le code, stocke le refresh token
// dans `secretsGoogle` (collection SANS règle de lecture client → refusée par
// défaut par Firestore ; seul le SDK Admin serveur y accède), puis marque le
// profil comme connecté. LECTURE SEULE (scope calendar.readonly).
import { getAdminDb } from "@/lib/firebase/admin";
import {
  echangerCode,
  ErreurGoogle,
  originePublique,
  urlRedirection,
} from "@/lib/google/calendar";

const VALIDITE_STATE_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  // Retour vers l'écran Réglages, avec la raison en cas d'échec (affichée en
  // clair, voir lib/google/diagnostic.ts). On utilise l'adresse PUBLIQUE de
  // l'app : derrière Render, `request.url` peut porter une adresse interne.
  const versReglages = (statut: "ok" | "erreur", raison?: string) =>
    Response.redirect(
      `${originePublique(request)}/parametres?google=${statut}${
        raison ? `&raison=${raison}` : ""
      }`,
      302,
    );

  // Google revient avec ?error=... quand l'accès est refusé (par l'utilisatrice,
  // ou parce que son adresse n'est pas autorisée sur une app en mode "Test").
  if (url.searchParams.get("error")) {
    console.error("Callback Google : accès refusé —", url.searchParams.get("error"));
    return versReglages("erreur", "refus");
  }
  if (!code || !state) return versReglages("erreur", "session");

  const db = getAdminDb();
  const refState = db.collection("etatsOauth").doc(state);

  try {
    // 1. Vérifier le state (anti-CSRF), à usage unique.
    const snap = await refState.get();
    if (!snap.exists) return versReglages("erreur", "session");
    const donnees = snap.data() as { uid: string; creeLe: { toMillis(): number } | Date };
    await refState.delete();
    const creeLe =
      donnees.creeLe instanceof Date ? donnees.creeLe.getTime() : donnees.creeLe.toMillis();
    if (Date.now() - creeLe > VALIDITE_STATE_MS) return versReglages("erreur", "session");

    // 2. Échanger le code contre les jetons.
    const jetons = await echangerCode(code, urlRedirection(request));
    if (!jetons.refresh_token) {
      // Sans refresh token, la connexion ne survivrait pas à l'expiration :
      // on refuse et l'utilisatrice pourra retenter (prompt=consent le force).
      return versReglages("erreur", "sans_jeton");
    }

    // 3. Stocker le secret côté serveur uniquement, et marquer le profil.
    await db.collection("secretsGoogle").doc(donnees.uid).set({
      googleRefreshToken: jetons.refresh_token,
      majLe: new Date(),
    });
    await db
      .collection("utilisateurs")
      .doc(donnees.uid)
      .set({ googleCalendarConnecte: true }, { merge: true });

    return versReglages("ok");
  } catch (e) {
    console.error("Erreur callback Google :", e);
    return versReglages("erreur", e instanceof ErreurGoogle ? e.code : "inconnue");
  }
}
