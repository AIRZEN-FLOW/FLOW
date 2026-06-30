// SDK Admin Firebase — CÔTÉ SERVEUR UNIQUEMENT (routes API Next.js sur Render).
// NE JAMAIS importer ce fichier dans un composant client : il utilise la clé de
// service secrète (FIREBASE_SERVICE_ACCOUNT_KEY) qui ne doit jamais atteindre le navigateur.
// C'est par ce SDK qu'on lira les champs sensibles (ex. googleRefreshToken) hors des
// règles de sécurité Firestore (voir 03-specifications-techniques.md, §3).
import {
  cert,
  getApps,
  getApp,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// L'initialisation est "paresseuse" (à la demande) : on ne lit la clé de service
// que lorsqu'une route serveur en a réellement besoin. Cela évite de faire planter
// le build si la variable n'est pas encore configurée.
function getAdminApp(): App {
  if (getApps().length) return getApp();

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY est manquante. Configurez-la dans les variables d'environnement Render (jamais côté client).",
    );
  }

  const serviceAccount = JSON.parse(raw);
  return initializeApp({ credential: cert(serviceAccount) });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
