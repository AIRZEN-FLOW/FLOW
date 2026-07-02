// Étape 8 — Démarre (GET) ou retire (DELETE) la connexion Google Agenda.
// LECTURE SEULE : scope calendar.readonly uniquement (voir lib/google/calendar.ts).
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { urlConsentement, urlRedirection } from "@/lib/google/calendar";

async function uidDepuisRequete(request: Request): Promise<string | null> {
  const enTete = request.headers.get("authorization") ?? "";
  const jeton = enTete.startsWith("Bearer ") ? enTete.slice(7) : null;
  if (!jeton) return null;
  try {
    const decode = await getAdminAuth().verifyIdToken(jeton);
    return decode.uid;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const uid = await uidDepuisRequete(request);
  if (!uid) return Response.json({ erreur: "Non authentifiée." }, { status: 401 });

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return Response.json(
      {
        erreur:
          "Google Agenda n'est pas encore configuré : ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans Render.",
      },
      { status: 501 },
    );
  }

  // Anti-CSRF : un "state" aléatoire stocké côté serveur, à usage unique.
  const state = crypto.randomUUID();
  await getAdminDb()
    .collection("etatsOauth")
    .doc(state)
    .set({ uid, creeLe: new Date() });

  return Response.json({ url: urlConsentement(urlRedirection(request), state) });
}

export async function DELETE(request: Request) {
  const uid = await uidDepuisRequete(request);
  if (!uid) return Response.json({ erreur: "Non authentifiée." }, { status: 401 });

  const db = getAdminDb();
  await db.collection("secretsGoogle").doc(uid).delete();
  await db
    .collection("utilisateurs")
    .doc(uid)
    .set({ googleCalendarConnecte: false }, { merge: true });
  return Response.json({ ok: true });
}
