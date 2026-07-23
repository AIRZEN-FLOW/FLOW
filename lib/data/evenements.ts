// Accès Firestore : événements personnels du calendrier (collection
// `evenementsCalendrier`), indépendants de Google Agenda (voir lib/google/calendar.ts
// pour la lecture seule des occupations Google). Même schéma d'accès que
// lib/data/projets.ts : fetch complet par utilisateurId, pas de filtre de plage
// côté serveur (volumétrie faible, évite un index composite).
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDbClient } from "@/lib/firebase/client";
import type { EvenementCalendrier, SaisieEvenement } from "@/lib/types";

export async function creerEvenement(
  uid: string,
  saisie: SaisieEvenement,
): Promise<string> {
  const db = getDbClient();
  const ref = await addDoc(collection(db, "evenementsCalendrier"), {
    utilisateurId: uid,
    titre: saisie.titre.trim(),
    description: saisie.description?.trim() ?? "",
    dateDebut: Timestamp.fromDate(saisie.dateDebut),
    dateFin: Timestamp.fromDate(saisie.dateFin),
    journeeEntiere: saisie.journeeEntiere,
    creeLe: serverTimestamp(),
  });
  return ref.id;
}

export async function getEvenements(uid: string): Promise<EvenementCalendrier[]> {
  const db = getDbClient();
  const q = query(collection(db, "evenementsCalendrier"), where("utilisateurId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EvenementCalendrier);
}

export async function majEvenement(id: string, saisie: SaisieEvenement): Promise<void> {
  const db = getDbClient();
  await updateDoc(doc(db, "evenementsCalendrier", id), {
    titre: saisie.titre.trim(),
    description: saisie.description?.trim() ?? "",
    dateDebut: Timestamp.fromDate(saisie.dateDebut),
    dateFin: Timestamp.fromDate(saisie.dateFin),
    journeeEntiere: saisie.journeeEntiere,
  });
}

export async function supprimerEvenement(id: string): Promise<void> {
  const db = getDbClient();
  await deleteDoc(doc(db, "evenementsCalendrier", id));
}
