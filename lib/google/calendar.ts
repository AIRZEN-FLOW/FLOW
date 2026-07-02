// Étape 8 — Intégration Google Calendar, CÔTÉ SERVEUR uniquement.
//
// ⚠️ RÈGLE STRICTE DE NON-ÉCRITURE (docs/03-specifications-techniques.md §4) :
// cette intégration est en LECTURE SEULE. Aucune fonction de ce module — ni
// aucune route API du projet — ne doit appeler les endpoints d'écriture de
// l'API Google Calendar (events.insert, events.update, events.delete).
// Le scope OAuth demandé est exclusivement `calendar.readonly`.
// Ne pas modifier sans une session de travail dédiée et une confirmation explicite.

export const SCOPE_LECTURE_SEULE =
  "https://www.googleapis.com/auth/calendar.readonly";

const URL_AUTORISATION = "https://accounts.google.com/o/oauth2/v2/auth";
const URL_JETON = "https://oauth2.googleapis.com/token";
const URL_FREEBUSY = "https://www.googleapis.com/calendar/v3/freeBusy";

/** Origine publique de l'app (derrière le proxy Render). */
export function originePublique(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return `${proto}://${host}`;
}

export function urlRedirection(request: Request): string {
  return `${originePublique(request)}/api/google/callback`;
}

/** Construit l'URL de consentement Google (accès hors-ligne pour obtenir un refresh token). */
export function urlConsentement(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE_LECTURE_SEULE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${URL_AUTORISATION}?${params}`;
}

interface ReponseJeton {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

/** Échange le code d'autorisation contre des jetons (access + refresh). */
export async function echangerCode(
  code: string,
  redirectUri: string,
): Promise<ReponseJeton> {
  const reponse = await fetch(URL_JETON, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!reponse.ok) {
    throw new Error(`Échange de code Google refusé (${reponse.status})`);
  }
  return reponse.json();
}

/** Obtient un access token frais à partir du refresh token stocké côté serveur. */
export async function rafraichirJeton(refreshToken: string): Promise<string> {
  const reponse = await fetch(URL_JETON, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!reponse.ok) {
    throw new Error(`Rafraîchissement du jeton Google refusé (${reponse.status})`);
  }
  const donnees: ReponseJeton = await reponse.json();
  return donnees.access_token;
}

export interface Occupation {
  debut: string; // ISO 8601
  fin: string; // ISO 8601
}

/**
 * Récupère les créneaux OCCUPÉS du calendrier principal entre deux instants
 * (endpoint freeBusy — lecture seule par nature).
 */
export async function getOccupations(
  accessToken: string,
  debutIso: string,
  finIso: string,
): Promise<Occupation[]> {
  const reponse = await fetch(URL_FREEBUSY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: debutIso,
      timeMax: finIso,
      items: [{ id: "primary" }],
    }),
  });
  if (!reponse.ok) {
    throw new Error(`Lecture freeBusy refusée (${reponse.status})`);
  }
  const donnees = await reponse.json();
  const busy: { start: string; end: string }[] =
    donnees?.calendars?.primary?.busy ?? [];
  return busy.map((b) => ({ debut: b.start, fin: b.end }));
}
