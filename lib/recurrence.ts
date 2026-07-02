// Étape 7 — Récurrence (voir docs/02-specifications-fonctionnelles.md §3).
// Quand une occurrence est terminée, la suivante est créée selon la règle.
// Modifier une règle ne touche jamais aux occurrences déjà créées.
import type { Jour, RecurrenceRegle, Tache } from "./types";
import { JOURS_SEMAINE } from "./types";
import { tsEnDate } from "./format";

function indexJour(jour: Jour): number {
  return JOURS_SEMAINE.indexOf(jour); // 0 = lundi
}

function jourDe(date: Date): number {
  return (date.getDay() + 6) % 7; // 0 = lundi
}

/**
 * Calcule la date de la prochaine occurrence, strictement après `base`.
 * - quotidienne : lendemain
 * - hebdomadaire : prochain jour listé dans `joursConcernes` (ou +7 jours si absent)
 * - mensuelle : même jour le mois suivant (plafonné au dernier jour du mois)
 */
export function prochaineEcheance(
  base: Date,
  regle: Pick<RecurrenceRegle, "frequence" | "joursConcernes">,
): Date {
  const suivante = new Date(base.getFullYear(), base.getMonth(), base.getDate());

  if (regle.frequence === "quotidienne") {
    suivante.setDate(suivante.getDate() + 1);
    return suivante;
  }

  if (regle.frequence === "hebdomadaire") {
    const jours = (regle.joursConcernes ?? []).map(indexJour).sort((a, b) => a - b);
    if (jours.length === 0) {
      suivante.setDate(suivante.getDate() + 7);
      return suivante;
    }
    const courant = jourDe(suivante);
    // Prochain jour actif strictement après aujourd'hui (sinon semaine suivante).
    const prochain = jours.find((j) => j > courant);
    const delta = prochain !== undefined ? prochain - courant : 7 - courant + jours[0];
    suivante.setDate(suivante.getDate() + delta);
    return suivante;
  }

  // mensuelle : même quantième le mois suivant, plafonné (ex. 31 janv. → 28/29 févr.)
  const jourCible = suivante.getDate();
  const moisSuivant = new Date(suivante.getFullYear(), suivante.getMonth() + 1, 1);
  const dernierJour = new Date(
    moisSuivant.getFullYear(),
    moisSuivant.getMonth() + 1,
    0,
  ).getDate();
  moisSuivant.setDate(Math.min(jourCible, dernierJour));
  return moisSuivant;
}

/**
 * Prépare la prochaine occurrence d'une tâche récurrente terminée,
 * ou renvoie `null` si la récurrence est finie (dateFin dépassée).
 * La date de base est l'échéance de l'occurrence (ou aujourd'hui si sans échéance).
 */
export function occurrenceSuivante(
  tache: Tache,
  maintenant: Date = new Date(),
): { dateEcheance: Date } | null {
  const regle = tache.recurrenceRegle;
  if (!regle) return null;

  const base = tsEnDate(tache.dateEcheance) ?? maintenant;
  // La prochaine occurrence part de la plus tardive des deux dates : l'échéance
  // prévue ou aujourd'hui (si on termine en retard, on ne crée pas d'occurrences passées).
  const depart = base.getTime() > maintenant.getTime() ? base : maintenant;
  const prochaine = prochaineEcheance(depart, regle);

  const fin = tsEnDate(regle.dateFin ?? null);
  if (fin && prochaine.getTime() > fin.getTime()) return null;

  return { dateEcheance: prochaine };
}
