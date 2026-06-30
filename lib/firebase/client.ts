// SDK Firebase CÔTÉ CLIENT (navigateur).
// Utilise uniquement les clés publiques NEXT_PUBLIC_* (sans danger à exposer).
//
// Initialisation PARESSEUSE : on ne crée l'app/Auth/Firestore qu'au premier appel,
// donc uniquement dans le navigateur (jamais pendant le rendu serveur / le build).
// Cela évite l'erreur "auth/invalid-api-key" au prérendu et respecte le fait que
// Firebase Auth n'a de sens que côté client.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let appMemo: FirebaseApp | null = null;
let authMemo: Auth | null = null;
let dbMemo: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (appMemo) return appMemo;
  appMemo = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return appMemo;
}

/** Instance Firebase Auth (créée à la demande, côté navigateur). */
export function getAuthClient(): Auth {
  if (!authMemo) authMemo = getAuth(getFirebaseApp());
  return authMemo;
}

/** Instance Firestore (créée à la demande, côté navigateur). */
export function getDbClient(): Firestore {
  if (!dbMemo) dbMemo = getFirestore(getFirebaseApp());
  return dbMemo;
}
