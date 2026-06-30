// Calcul du quadrant Eisenhower (voir docs/02-specifications-fonctionnelles.md §1).
// Le quadrant n'est JAMAIS saisi manuellement : il est recalculé à chaque écriture
// d'une tâche, à partir de l'échéance et de l'importance.
import type { NiveauImportance, Quadrant } from "./types";

export const SEUIL_URGENCE_JOURS_DEFAUT = 3;

/**
 * Une tâche est "urgente" si son échéance est dans `seuilJours` jours ou moins.
 * Une tâche sans échéance n'est jamais urgente.
 */
export function estUrgente(
  dateEcheance: Date | null | undefined,
  seuilJours: number = SEUIL_URGENCE_JOURS_DEFAUT,
  maintenant: Date = new Date(),
): boolean {
  if (!dateEcheance) return false;
  const msParJour = 24 * 60 * 60 * 1000;
  // On compare en nombre de jours calendaires entiers restants.
  const debutAujourdhui = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate(),
  );
  const debutEcheance = new Date(
    dateEcheance.getFullYear(),
    dateEcheance.getMonth(),
    dateEcheance.getDate(),
  );
  const joursRestants = Math.round(
    (debutEcheance.getTime() - debutAujourdhui.getTime()) / msParJour,
  );
  return joursRestants <= seuilJours;
}

/** Une tâche est "importante" si son niveau d'importance est `haute`. */
export function estImportante(niveauImportance: NiveauImportance): boolean {
  return niveauImportance === "haute";
}

/**
 * Calcule le quadrant Eisenhower :
 *   urgent + important      → q1 (faire maintenant)
 *   important, pas urgent   → q2 (planifier — le cœur du travail de fond)
 *   urgent, pas important   → q3 (déléguer / minimiser)
 *   ni l'un ni l'autre      → q4 (éliminer / différer)
 */
export function calculerQuadrant(
  dateEcheance: Date | null | undefined,
  niveauImportance: NiveauImportance,
  seuilJours: number = SEUIL_URGENCE_JOURS_DEFAUT,
  maintenant: Date = new Date(),
): Quadrant {
  const urgent = estUrgente(dateEcheance, seuilJours, maintenant);
  const important = estImportante(niveauImportance);
  if (urgent && important) return "q1";
  if (!urgent && important) return "q2";
  if (urgent && !important) return "q3";
  return "q4";
}

/** Libellés et couleurs des quadrants (charte docs/04-design-system.md). */
export const QUADRANTS: Record<
  Quadrant,
  { label: string; court: string; couleur: string }
> = {
  q1: { label: "Faire maintenant", court: "Q1", couleur: "#C97064" },
  q2: { label: "Planifier", court: "Q2", couleur: "#76939D" },
  q3: { label: "Déléguer ou minimiser", court: "Q3", couleur: "#B3BEC4" },
  q4: { label: "Éliminer ou différer", court: "Q4", couleur: "#D9D9D9" },
};
