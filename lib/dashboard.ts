// Agrégats du "Tableau de bord" (vue d'ensemble jour/semaine/mois).
// Toutes les données viennent des tâches et du profil d'énergie déjà chargés
// côté client — pas de nouvel appel Google Agenda (la lecture par plage de
// dates n'est pas implémentée, voir docs/03-specifications-techniques.md §4).
import type { Jour, ProfilEnergie, Quadrant, Tache } from "./types";
import { JOURS_SEMAINE } from "./types";
import { tsEnDate } from "./format";

export type PeriodeTableauBord = "jour" | "semaine" | "mois";

function debutJour(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function jourDeLaSemaine(date: Date): Jour {
  return JOURS_SEMAINE[(date.getDay() + 6) % 7]; // 0 = lundi
}

/** Plage `[debut, fin)` couverte par la période, relative à `reference`. */
export function plagePeriode(
  periode: PeriodeTableauBord,
  reference: Date = new Date(),
): { debut: Date; fin: Date } {
  const debut = debutJour(reference);
  if (periode === "jour") {
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 1);
    return { debut, fin };
  }
  if (periode === "semaine") {
    const lundi = new Date(debut);
    lundi.setDate(lundi.getDate() - ((debut.getDay() + 6) % 7));
    const fin = new Date(lundi);
    fin.setDate(fin.getDate() + 7);
    return { debut: lundi, fin };
  }
  const premier = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const suivant = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return { debut: premier, fin: suivant };
}

/** Minutes d'énergie disponibles pour un jour donné, selon le profil (0 si aucun créneau actif ce jour-là). */
function disponibleDuJour(profils: ProfilEnergie[], jour: Date): number {
  const nomJour = jourDeLaSemaine(jour);
  return profils
    .filter((p) => p.joursActifs.includes(nomJour))
    .reduce((total, p) => {
      const [hd, md] = p.heureDebut.split(":").map(Number);
      const [hf, mf] = p.heureFin.split(":").map(Number);
      return total + (hf * 60 + mf - (hd * 60 + md));
    }, 0);
}

/** Libellé court d'une sous-période, pour l'axe des barres. */
function libelleJourCourt(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
}

export interface StatsPeriode {
  sousTitre: string;
  planLabel: string;
  planifieMinutes: number;
  disponibleMinutes: number;
  /** Forme du temps disponible sur la période, normalisée 0-100 (visuel des barres). */
  bars: { label: string; hauteur: number }[];
  totalTaches: number;
  completionPct: number;
  completionLabel: string;
  quadrants: Record<Quadrant, number>;
  /** Tâches (hors annulées) dont l'échéance tombe dans la période — pour la vue Eisenhower. */
  taches: Tache[];
}

/** Nombre de tâches (hors annulées) dont l'échéance tombe dans chaque période, à date de référence. */
export function compterTachesParPeriode(
  taches: Tache[],
  reference: Date = new Date(),
): { jour: number; semaine: number; mois: number } {
  function compter(periode: PeriodeTableauBord): number {
    const { debut, fin } = plagePeriode(periode, reference);
    return taches.filter((t) => {
      if (t.statut === "annulee") return false;
      const echeance = tsEnDate(t.dateEcheance);
      if (!echeance) return false;
      return echeance.getTime() >= debut.getTime() && echeance.getTime() < fin.getTime();
    }).length;
  }
  return { jour: compter("jour"), semaine: compter("semaine"), mois: compter("mois") };
}

const SOUS_TITRE: Record<PeriodeTableauBord, string> = {
  jour: "Votre journée en un coup d'œil 🌿",
  semaine: "Votre semaine en un coup d'œil 🌿",
  mois: "Votre mois en un coup d'œil 🌿",
};

const COMPLETION_LABEL: Record<PeriodeTableauBord, string> = {
  jour: "terminées aujourd'hui",
  semaine: "terminées cette semaine",
  mois: "terminées ce mois-ci",
};

/**
 * Statistiques de la période : temps planifié (durée estimée des tâches dont
 * l'échéance tombe dans la période) vs temps disponible (déduit des créneaux
 * d'énergie actifs sur les jours de la période), répartition Eisenhower et
 * taux de complétion — le tout sur les tâches ayant une échéance dans la période.
 */
export function calculerStatsPeriode(
  taches: Tache[],
  profilsEnergie: ProfilEnergie[],
  periode: PeriodeTableauBord,
  reference: Date = new Date(),
): StatsPeriode {
  const { debut, fin } = plagePeriode(periode, reference);

  const tachesPeriode = taches.filter((t) => {
    if (t.statut === "annulee") return false;
    const echeance = tsEnDate(t.dateEcheance);
    if (!echeance) return false;
    return echeance.getTime() >= debut.getTime() && echeance.getTime() < fin.getTime();
  });

  const planifieMinutes = tachesPeriode.reduce((s, t) => s + t.dureeEstimeeMinutes, 0);

  // Découpage en sous-unités pour la forme des barres : jours pour jour/semaine,
  // semaines pour mois.
  const jours: Date[] = [];
  for (let d = new Date(debut); d.getTime() < fin.getTime(); d.setDate(d.getDate() + 1)) {
    jours.push(new Date(d));
  }

  let bars: { label: string; hauteur: number }[];
  let disponibleMinutes: number;

  if (periode === "mois") {
    // Regroupe les jours par semaine (lundi-dimanche) pour ne pas afficher ~30 barres.
    const semaines: Date[][] = [];
    let courante: Date[] = [];
    for (const j of jours) {
      courante.push(j);
      if (jourDeLaSemaine(j) === "dimanche") {
        semaines.push(courante);
        courante = [];
      }
    }
    if (courante.length > 0) semaines.push(courante);
    const dispoParSemaine = semaines.map((s) =>
      s.reduce((sum, j) => sum + disponibleDuJour(profilsEnergie, j), 0),
    );
    disponibleMinutes = dispoParSemaine.reduce((a, b) => a + b, 0);
    const max = Math.max(1, ...dispoParSemaine);
    bars = dispoParSemaine.map((v, i) => ({
      label: `S${i + 1}`,
      hauteur: Math.round((v / max) * 100),
    }));
  } else {
    const dispoParJour = jours.map((j) => disponibleDuJour(profilsEnergie, j));
    disponibleMinutes = dispoParJour.reduce((a, b) => a + b, 0);
    const max = Math.max(1, ...dispoParJour);
    bars = dispoParJour.map((v, i) => ({
      label: libelleJourCourt(jours[i]),
      hauteur: Math.round((v / max) * 100),
    }));
  }

  const quadrants: Record<Quadrant, number> = { q1: 0, q2: 0, q3: 0, q4: 0 };
  for (const t of tachesPeriode) quadrants[t.quadrantEisenhower]++;

  const termineesPeriode = tachesPeriode.filter((t) => t.statut === "terminee").length;
  const completionPct =
    tachesPeriode.length > 0
      ? Math.round((termineesPeriode / tachesPeriode.length) * 100)
      : 0;

  const heuresPlan = Math.round((planifieMinutes / 60) * 10) / 10;
  const heuresDispo = Math.round((disponibleMinutes / 60) * 10) / 10;

  return {
    sousTitre: SOUS_TITRE[periode],
    planLabel:
      disponibleMinutes > 0 || planifieMinutes > 0
        ? `${heuresPlan} h planifiées sur ${heuresDispo} h disponibles ${
            periode === "jour"
              ? "aujourd'hui"
              : periode === "semaine"
                ? "cette semaine"
                : "ce mois-ci"
          }`
        : "Aucune échéance sur cette période pour l'instant.",
    planifieMinutes,
    disponibleMinutes,
    bars,
    totalTaches: tachesPeriode.length,
    completionPct,
    completionLabel: COMPLETION_LABEL[periode],
    quadrants,
    taches: tachesPeriode,
  };
}
