// Accès Firestore : tâches (collection `taches`).
// Le quadrant Eisenhower est recalculé ici, côté application, à chaque écriture
// (voir docs/03-specifications-techniques.md §2).
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
import type { SaisieTache, StatutTache, Tache } from "@/lib/types";
import { calculerQuadrant } from "@/lib/eisenhower";

/** Construit le quadrant à partir d'une saisie + le seuil d'urgence de l'utilisatrice. */
function quadrantPourSaisie(saisie: SaisieTache, seuilJours: number) {
  return calculerQuadrant(saisie.dateEcheance ?? null, saisie.niveauImportance, seuilJours);
}

export async function creerTache(
  uid: string,
  saisie: SaisieTache,
  seuilJours: number,
): Promise<string> {
  const db = getDbClient();
  const ref = await addDoc(collection(db, "taches"), {
    utilisateurId: uid,
    projetId: saisie.projetId ?? null,
    tacheParenteId: saisie.tacheParenteId ?? null,
    titre: saisie.titre.trim(),
    description: saisie.description?.trim() ?? "",
    statut: "a_faire" as StatutTache,
    dateEcheance: saisie.dateEcheance ? Timestamp.fromDate(saisie.dateEcheance) : null,
    niveauImportance: saisie.niveauImportance,
    dureeEstimeeMinutes: saisie.dureeEstimeeMinutes,
    niveauEnergieRequis: saisie.niveauEnergieRequis,
    quadrantEisenhower: quadrantPourSaisie(saisie, seuilJours),
    tags: saisie.tags ?? [],
    source: saisie.source ?? "manuelle",
    recurrenceRegle: saisie.recurrenceRegle
      ? {
          frequence: saisie.recurrenceRegle.frequence,
          joursConcernes: saisie.recurrenceRegle.joursConcernes ?? [],
          dateFin: saisie.recurrenceRegle.dateFin
            ? Timestamp.fromDate(saisie.recurrenceRegle.dateFin)
            : null,
        }
      : null,
    creeLe: serverTimestamp(),
    modifieLe: serverTimestamp(),
  });
  return ref.id;
}

export async function getTaches(uid: string): Promise<Tache[]> {
  const db = getDbClient();
  // Filtre par égalité seul (pas d'orderBy) → aucun index composite requis.
  // Le tri (plus récentes d'abord) est fait côté client.
  const q = query(collection(db, "taches"), where("utilisateurId", "==", uid));
  const snap = await getDocs(q);
  const taches = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tache);
  return taches.sort(
    (a, b) => (b.creeLe?.toMillis() ?? 0) - (a.creeLe?.toMillis() ?? 0),
  );
}

export async function majStatutTache(id: string, statut: StatutTache): Promise<void> {
  const db = getDbClient();
  await updateDoc(doc(db, "taches", id), {
    statut,
    modifieLe: serverTimestamp(),
  });
}

/** Met à jour des champs et recalcule le quadrant si l'échéance/importance change. */
export async function majTache(
  id: string,
  saisie: SaisieTache,
  seuilJours: number,
): Promise<void> {
  const db = getDbClient();
  await updateDoc(doc(db, "taches", id), {
    titre: saisie.titre.trim(),
    description: saisie.description?.trim() ?? "",
    dateEcheance: saisie.dateEcheance ? Timestamp.fromDate(saisie.dateEcheance) : null,
    niveauImportance: saisie.niveauImportance,
    dureeEstimeeMinutes: saisie.dureeEstimeeMinutes,
    niveauEnergieRequis: saisie.niveauEnergieRequis,
    quadrantEisenhower: quadrantPourSaisie(saisie, seuilJours),
    tags: saisie.tags ?? [],
    projetId: saisie.projetId ?? null,
    tacheParenteId: saisie.tacheParenteId ?? null,
    modifieLe: serverTimestamp(),
  });
}

export async function supprimerTache(id: string): Promise<void> {
  const db = getDbClient();
  await deleteDoc(doc(db, "taches", id));
}

/** Rattache (ou détache, si null) une tâche existante à un projet — sans toucher au reste. */
export async function assignerProjetTache(
  id: string,
  projetId: string | null,
): Promise<void> {
  const db = getDbClient();
  await updateDoc(doc(db, "taches", id), {
    projetId,
    modifieLe: serverTimestamp(),
  });
}
