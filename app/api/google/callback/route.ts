// Étape 8 — Callback OAuth Google : échange le code, stocke le refresh token
// dans `secretsGoogle` (collection SANS règle de lecture client → refusée par
// défaut par Firestore ; seul le SDK Admin serveur y accède), puis marque le
// profil comme connecté. LECTURE SEULE (scope calendar.readonly).
import { getAdminDb } from "@/lib/firebase/admin";
import { echangerCode, urlRedirection } from "@/lib/google/calendar";

const VALIDITE_STATE_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const versReglages = (statut: "ok" | "erreur") =>
    Response.redirect(`${url.origin}/parametres?google=${statut}`, 302);

  if (!code || !state) return versReglages("erreur");

  const db = getAdminDb();
  const refState = db.collection("etatsOauth").doc(state);

  try {
    // 1. Vérifier le state (anti-CSRF), à usage unique.
    const snap = await refState.get();
    if (!snap.exists) return versReglages("erreur");
    const donnees = snap.data() as { uid: string; creeLe: { toMillis(): number } | Date };
    await refState.delete();
    const creeLe =
      donnees.creeLe instanceof Date ? donnees.creeLe.getTime() : donnees.creeLe.toMillis();
    if (Date.now() - creeLe > VALIDITE_STATE_MS) return versReglages("erreur");

    // 2. Échanger le code contre les jetons.
    const jetons = await echangerCode(code, urlRedirection(request));
    if (!jetons.refresh_token) {
      // Sans refresh token, la connexion ne survivrait pas à l'expiration :
      // on refuse et l'utilisatrice pourra retenter (prompt=consent le force).
      return versReglages("erreur");
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
    return versReglages("erreur");
  }
}
