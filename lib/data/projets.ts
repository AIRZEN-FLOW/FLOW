// Accès Firestore : projets (collection `projets`).
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDbClient } from "@/lib/firebase/client";
import type { Projet, StatutProjet } from "@/lib/types";

/** Palette de couleurs de projet, dans l'esprit doux de la charte AIR ZEN. */
export const COULEURS_PROJET = [
  "#596D85",
  "#76939D",
  "#EDC426",
  "#C97064",
  "#B3BEC4",
  "#7A9E7E",
];

export interface SaisieProjet {
  nom: string;
  description?: string;
  couleur: string;
}

export async function creerProjet(uid: string, saisie: SaisieProjet): Promise<string> {
  const db = getDbClient();
  const ref = await addDoc(collection(db, "projets"), {
    utilisateurId: uid,
    nom: saisie.nom.trim(),
    description: saisie.description?.trim() ?? "",
    couleur: saisie.couleur,
    statut: "actif" as StatutProjet,
    creeLe: serverTimestamp(),
  });
  return ref.id;
}

export async function getProjets(uid: string): Promise<Projet[]> {
  const db = getDbClient();
  const q = query(collection(db, "projets"), where("utilisateurId", "==", uid));
  const snap = await getDocs(q);
  const projets = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Projet);
  return projets.sort((a, b) => a.nom.localeCompare(b.nom));
}

export async function majProjet(
  id: string,
  champs: Partial<Pick<Projet, "nom" | "description" | "couleur" | "statut">>,
): Promise<void> {
  const db = getDbClient();
  await updateDoc(doc(db, "projets", id), champs);
}

export async function supprimerProjet(id: string): Promise<void> {
  const db = getDbClient();
  await deleteDoc(doc(db, "projets", id));
}
