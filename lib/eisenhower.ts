// Calcul du quadrant Eisenhower (voir docs/02-specifications-fonctionnelles.md §1).
// L'app PROPOSE, l'utilisatrice AJUSTE : le quadrant est recalculé à chaque
// écriture à partir de l'importance (choisie) et de l'urgence — proposée d'après
// l'échéance, sauf si l'utilisatrice a indiqué son urgence ressentie.
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
 * Urgence retenue pour la matrice : l'urgence ressentie par l'utilisatrice si
 * elle l'a indiquée (true / false), sinon celle proposée d'après l'échéance.
 */
export function urgenceEffective(
  dateEcheance: Date | null | undefined,
  urgenceRessentie: boolean | null | undefined,
  seuilJours: number = SEUIL_URGENCE_JOURS_DEFAUT,
  maintenant: Date = new Date(),
): boolean {
  if (urgenceRessentie === true || urgenceRessentie === false) return urgenceRessentie;
  return estUrgente(dateEcheance, seuilJours, maintenant);
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
  urgenceRessentie: boolean | null = null,
): Quadrant {
  const urgent = urgenceEffective(dateEcheance, urgenceRessentie, seuilJours, maintenant);
  const important = estImportante(niveauImportance);
  if (urgent && important) return "q1";
  if (!urgent && important) return "q2";
  if (urgent && !important) return "q3";
  return "q4";
}

/** Nombre de jours calendaires entre aujourd'hui et l'échéance (négatif si dépassée). */
function joursAvant(dateEcheance: Date, maintenant: Date): number {
  const msParJour = 24 * 60 * 60 * 1000;
  const a = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  const b = new Date(dateEcheance.getFullYear(), dateEcheance.getMonth(), dateEcheance.getDate());
  return Math.round((b.getTime() - a.getTime()) / msParJour);
}

function phraseEcheance(n: number): string {
  if (n < 0) return `l'échéance est dépassée depuis ${-n} jour${n < -1 ? "s" : ""}`;
  if (n === 0) return "l'échéance tombe aujourd'hui";
  if (n === 1) return "l'échéance tombe demain";
  return `l'échéance tombe dans ${n} jours`;
}

/**
 * Explique en langage courant POURQUOI une tâche tombe dans son quadrant,
 * pour que l'utilisatrice puisse comprendre la proposition et l'ajuster.
 */
export function expliquerQuadrant(
  dateEcheance: Date | null | undefined,
  niveauImportance: NiveauImportance,
  urgenceRessentie: boolean | null | undefined,
  seuilJours: number = SEUIL_URGENCE_JOURS_DEFAUT,
  maintenant: Date = new Date(),
): { quadrant: Quadrant; importance: string; urgence: string } {
  const quadrant = calculerQuadrant(
    dateEcheance,
    niveauImportance,
    seuilJours,
    maintenant,
    urgenceRessentie ?? null,
  );

  const importance =
    niveauImportance === "haute"
      ? "Importante : vous lui avez donné une importance haute."
      : `Pas comptée comme importante : importance ${niveauImportance} (seule l'importance haute compte dans la matrice).`;

  const echeance = dateEcheance
    ? phraseEcheance(joursAvant(dateEcheance, maintenant))
    : null;
  let urgence: string;
  if (urgenceRessentie === true) {
    urgence = `Urgente : c'est vous qui l'avez indiqué${echeance ? ` (${echeance})` : ""}.`;
  } else if (urgenceRessentie === false) {
    urgence = `Pas urgente : vous avez indiqué qu'elle peut attendre${echeance ? ` (${echeance})` : ""}.`;
  } else if (!echeance) {
    urgence = "Pas urgente : aucune échéance n'est fixée.";
  } else if (estUrgente(dateEcheance, seuilJours, maintenant)) {
    urgence = `Urgente : ${echeance} (seuil réglé à ${seuilJours} jour${seuilJours > 1 ? "s" : ""}).`;
  } else {
    urgence = `Pas encore urgente : ${echeance} (elle le deviendra à ${seuilJours} jour${seuilJours > 1 ? "s" : ""} de l'échéance).`;
  }

  return { quadrant, importance, urgence };
}

/**
 * Libellés et couleurs des quadrants (charte docs/04-design-system.md).
 * Choisies exclusivement parmi les couleurs de la charte AIR ZEN, chacune
 * associée à ce qu'elle signifie pour la décision :
 *   Q1 urgent + important        → corail  (alerte douce, sans être alarmante)
 *   Q2 important, moins urgent   → jaune   (l'accent de la marque — le travail
 *                                            de fond mis en valeur, pas relégué)
 *   Q3 peu important, urgent     → bleu-vert (secondaire — présent mais discret)
 *   Q4 peu important, peu urgent → gris clair (neutre — quasi invisible)
 */
export const QUADRANTS: Record<
  Quadrant,
  { label: string; court: string; couleur: string }
> = {
  q1: { label: "Faire maintenant", court: "P1", couleur: "#C97064" },
  q2: { label: "Planifier", court: "P2", couleur: "#EDC426" },
  q3: { label: "Déléguer ou minimiser", court: "P3", couleur: "#76939D" },
  q4: { label: "Éliminer ou différer", court: "P4", couleur: "#B3BEC4" },
};
