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

/**
 * Causes de panne reconnues, traduites en message clair côté écran
 * (voir lib/google/diagnostic.ts) :
 *   autorisation_expiree : le refresh token est refusé (révoqué, ou expiré au
 *                          bout de 7 jours quand l'écran de consentement Google
 *                          est resté en mode "Test")
 *   api_desactivee       : l'API Google Calendar n'est pas activée dans le
 *                          projet Google Cloud
 *   configuration        : identifiant / secret client refusés, ou adresse de
 *                          redirection non déclarée
 *   inconnue             : tout le reste (panne passagère, réseau…)
 */
export type CodeErreurGoogle =
  | "autorisation_expiree"
  | "api_desactivee"
  | "configuration"
  | "inconnue";

export class ErreurGoogle extends Error {
  code: CodeErreurGoogle;

  constructor(code: CodeErreurGoogle, etape: string, status: number, detail: string) {
    super(`Google — ${etape} refusé (${status}) : ${detail}`);
    this.code = code;
  }
}

/** Lit la réponse d'erreur de Google et en déduit la cause la plus probable. */
async function erreurDepuisReponse(etape: string, reponse: Response): Promise<ErreurGoogle> {
  let detail = "";
  let raison = "";
  try {
    const corps = await reponse.json();
    if (typeof corps?.error === "string") {
      // Format du serveur de jetons : { error, error_description }
      raison = corps.error;
      detail = [corps.error, corps.error_description].filter(Boolean).join(" — ");
    } else if (corps?.error) {
      // Format des API Google : { error: { status, message, errors: [{ reason }] } }
      raison = corps.error.errors?.[0]?.reason ?? corps.error.status ?? "";
      detail = [raison, corps.error.message].filter(Boolean).join(" — ");
    }
  } catch {
    detail = "réponse illisible";
  }

  let code: CodeErreurGoogle = "inconnue";
  if (raison === "invalid_grant") code = "autorisation_expiree";
  else if (
    raison === "invalid_client" ||
    raison === "unauthorized_client" ||
    raison === "redirect_uri_mismatch"
  )
    code = "configuration";
  else if (raison === "accessNotConfigured" || /has not been used|is disabled/i.test(detail))
    code = "api_desactivee";
  else if (reponse.status === 401) code = "autorisation_expiree";

  return new ErreurGoogle(code, etape, reponse.status, detail || "sans détail");
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
    throw await erreurDepuisReponse("échange du code", reponse);
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
    throw await erreurDepuisReponse("renouvellement de l'accès", reponse);
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
    throw await erreurDepuisReponse("lecture de l'agenda", reponse);
  }
  const donnees = await reponse.json();
  const busy: { start: string; end: string }[] =
    donnees?.calendars?.primary?.busy ?? [];
  return busy.map((b) => ({ debut: b.start, fin: b.end }));
}
