// Étape 8 — Renvoie les créneaux OCCUPÉS du calendrier entre deux instants.
// LECTURE SEULE (freeBusy). Le refresh token n'est lu que côté serveur.
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getOccupations, rafraichirJeton } from "@/lib/google/calendar";

export async function GET(request: Request) {
  const enTete = request.headers.get("authorization") ?? "";
  const jeton = enTete.startsWith("Bearer ") ? enTete.slice(7) : null;
  if (!jeton) return Response.json({ erreur: "Non authentifiée." }, { status: 401 });

  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(jeton)).uid;
  } catch {
    return Response.json({ erreur: "Jeton invalide." }, { status: 401 });
  }

  const url = new URL(request.url);
  const debut = url.searchParams.get("debut");
  const fin = url.searchParams.get("fin");
  if (!debut || !fin) {
    return Response.json(
      { erreur: "Paramètres debut et fin (ISO 8601) requis." },
      { status: 400 },
    );
  }

  const snap = await getAdminDb().collection("secretsGoogle").doc(uid).get();
  const refreshToken = snap.exists ? (snap.data()?.googleRefreshToken as string) : null;
  if (!refreshToken) {
    return Response.json({ erreur: "Google Agenda non connecté." }, { status: 409 });
  }

  try {
    const accessToken = await rafraichirJeton(refreshToken);
    const occupations = await getOccupations(accessToken, debut, fin);
    return Response.json({ occupations });
  } catch (e) {
    console.error("Erreur lecture agenda :", e);
    return Response.json(
      { erreur: "Lecture de l'agenda impossible pour le moment." },
      { status: 502 },
    );
  }
}
