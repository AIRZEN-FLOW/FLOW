// Algorithme de suggestion "quoi faire maintenant"
// (voir docs/02-specifications-fonctionnelles.md §6).
// Croise : durée disponible × énergie du moment × quadrant Eisenhower.
import type { NiveauEnergie, Quadrant, Tache } from "./types";
import { QUADRANTS } from "./eisenhower";

/** Temps disponible déclaré par l'utilisatrice (Étape 4, avant Google Agenda). */
export type TempsDisponible = 15 | 30 | 60 | "plus";

export interface Suggestion {
  tache: Tache;
  raison: string; // "pourquoi maintenant"
  secondPlan: boolean; // tâche affichée mais "à éviter si possible maintenant"
}

const ORDRE_QUADRANT: Record<Quadrant, number> = { q1: 0, q2: 1, q3: 2, q4: 3 };

/** Compatibilité énergie entre le moment présent et l'énergie requise par la tâche. */
type AjustementEnergie = "ok" | "avertir" | "eviter" | "exclure";

function compatibiliteEnergie(
  moment: NiveauEnergie,
  requis: NiveauEnergie,
  quadrant: Quadrant,
): AjustementEnergie {
  if (moment === "haute") return "ok"; // tout est possible
  if (moment === "moyenne") {
    return requis === "haute" ? "eviter" : "ok";
  }
  // moment === "basse"
  if (requis === "basse") return "ok";
  if (requis === "haute") {
    // L'urgence (Q1) peut primer sur le confort, avec un avertissement.
    return quadrant === "q1" ? "avertir" : "exclure";
  }
  return "eviter"; // requis === "moyenne"
}

function minutesEnTexte(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

function texteEcheance(
  dateEcheance: Date | null | undefined,
  maintenant: Date,
): string | null {
  if (!dateEcheance) return null;
  const msParJour = 24 * 60 * 60 * 1000;
  const debutAuj = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate(),
  );
  const debutEch = new Date(
    dateEcheance.getFullYear(),
    dateEcheance.getMonth(),
    dateEcheance.getDate(),
  );
  const jours = Math.round((debutEch.getTime() - debutAuj.getTime()) / msParJour);
  if (jours < 0) return "échéance passée";
  if (jours === 0) return "échéance aujourd'hui";
  if (jours === 1) return "échéance demain";
  return `échéance dans ${jours} jours`;
}

/** Une tâche enrichie de l'échéance convertie en `Date` pour le calcul. */
export interface TacheAvecEcheance extends Tache {
  echeanceDate?: Date | null;
}

/**
 * Calcule la liste des suggestions, déjà filtrées, scorées et triées.
 * @param taches      tâches de l'utilisatrice (échéance fournie en Date via echeanceDate)
 * @param energieMoment niveau d'énergie déduit (ou ajusté) ; si null on n'exclut rien
 * @param tempsDisponible minutes disponibles, ou "plus" pour illimité
 * @param maxResultats nombre max de suggestions (3 à 5 conseillé)
 */
export function calculerSuggestions(
  taches: TacheAvecEcheance[],
  energieMoment: NiveauEnergie | null,
  tempsDisponible: TempsDisponible | number,
  maxResultats = 5,
  maintenant: Date = new Date(),
): Suggestion[] {
  const limiteMinutes = tempsDisponible === "plus" ? Infinity : tempsDisponible;

  const candidates = taches
    // Étape 1 — exclure terminées/annulées et les sous-tâches (gérées via leur parente)
    .filter((t) => t.statut !== "terminee" && t.statut !== "annulee")
    .filter((t) => !t.tacheParenteId)
    // Étape 2 — compatibilité de durée
    .filter((t) => t.dureeEstimeeMinutes <= limiteMinutes);

  const scored = candidates
    .map((t) => {
      const ajustement = energieMoment
        ? compatibiliteEnergie(energieMoment, t.niveauEnergieRequis, t.quadrantEisenhower)
        : "ok";
      return { tache: t, ajustement };
    })
    // Étape 3 — exclure les tâches énergétiquement incompatibles
    .filter((s) => s.ajustement !== "exclure");

  // Score : priorité quadrant + pénalité énergie.
  // Une tâche Q2 compatible (score 1) passe devant une Q1 à "éviter" (score 2),
  // mais une Q1 urgente "à avertir" (score 0.5) reste prioritaire.
  const penalite: Record<AjustementEnergie, number> = {
    ok: 0,
    avertir: 0.5,
    eviter: 2,
    exclure: 99,
  };

  scored.sort((a, b) => {
    const sa = ORDRE_QUADRANT[a.tache.quadrantEisenhower] + penalite[a.ajustement];
    const sb = ORDRE_QUADRANT[b.tache.quadrantEisenhower] + penalite[b.ajustement];
    if (sa !== sb) return sa - sb;
    // Égalité : échéance la plus proche, puis tâche la plus courte.
    const ea = a.tache.echeanceDate?.getTime() ?? Infinity;
    const eb = b.tache.echeanceDate?.getTime() ?? Infinity;
    if (ea !== eb) return ea - eb;
    return a.tache.dureeEstimeeMinutes - b.tache.dureeEstimeeMinutes;
  });

  return scored.slice(0, maxResultats).map(({ tache, ajustement }) => {
    const morceaux: string[] = [minutesEnTexte(tache.dureeEstimeeMinutes)];
    morceaux.push(QUADRANTS[tache.quadrantEisenhower].label);
    if (ajustement === "ok") morceaux.push("énergie compatible");
    else if (ajustement === "avertir") morceaux.push("énergie élevée, mais urgente");
    else if (ajustement === "eviter") morceaux.push("plutôt à éviter là, maintenant");
    const ech = texteEcheance(tache.echeanceDate, maintenant);
    if (ech) morceaux.push(ech);
    return {
      tache,
      raison: morceaux.join(" · "),
      secondPlan: ajustement === "eviter",
    };
  });
}
