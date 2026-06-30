// Accès Firestore : profil utilisateur (collection `utilisateurs`) et
// profils d'énergie (collection `profilsEnergie`).
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDbClient } from "@/lib/firebase/client";
import type { ProfilEnergie, Utilisateur } from "@/lib/types";
import { CRENEAUX_ENERGIE_DEFAUT } from "@/lib/energie";
import { SEUIL_URGENCE_JOURS_DEFAUT } from "@/lib/eisenhower";

/**
 * S'assure que le profil utilisateur existe (le crée au premier login avec les
 * valeurs par défaut), et seme les créneaux d'énergie par défaut. Idempotent.
 */
export async function assurerProfilUtilisateur(user: User): Promise<void> {
  const db = getDbClient();
  const refUtilisateur = doc(db, "utilisateurs", user.uid);
  const snap = await getDoc(refUtilisateur);
  if (snap.exists()) return;

  const profil: Omit<Utilisateur, "creeLe"> = {
    id: user.uid,
    email: user.email ?? "",
    nomAffiche: user.displayName ?? user.email?.split("@")[0] ?? "Moi",
    plan: "gratuit",
    seuilUrgenceJours: SEUIL_URGENCE_JOURS_DEFAUT,
    seuilDecoupageMinutes: 90,
    googleCalendarConnecte: false,
  };
  await setDoc(refUtilisateur, { ...profil, creeLe: serverTimestamp() });

  // Semer les créneaux d'énergie par défaut, modifiables ensuite dans Paramètres.
  const batch = writeBatch(db);
  for (const creneau of CRENEAUX_ENERGIE_DEFAUT) {
    const refCreneau = doc(collection(db, "profilsEnergie"));
    batch.set(refCreneau, { ...creneau, utilisateurId: user.uid });
  }
  await batch.commit();
}

export async function getUtilisateur(uid: string): Promise<Utilisateur | null> {
  const db = getDbClient();
  const snap = await getDoc(doc(db, "utilisateurs", uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Utilisateur) : null;
}

export async function getProfilsEnergie(uid: string): Promise<ProfilEnergie[]> {
  const db = getDbClient();
  const q = query(
    collection(db, "profilsEnergie"),
    where("utilisateurId", "==", uid),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProfilEnergie);
}

export async function majProfilEnergie(
  id: string,
  champs: Partial<Omit<ProfilEnergie, "id" | "utilisateurId">>,
): Promise<void> {
  const db = getDbClient();
  await updateDoc(doc(db, "profilsEnergie", id), champs);
}

export async function majUtilisateur(
  uid: string,
  champs: Partial<Pick<Utilisateur, "nomAffiche" | "seuilUrgenceJours" | "seuilDecoupageMinutes">>,
): Promise<void> {
  const db = getDbClient();
  await updateDoc(doc(db, "utilisateurs", uid), champs);
}
