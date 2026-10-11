// Niveau d'énergie modélisé par créneaux de la journée
// (voir docs/02-specifications-fonctionnelles.md §2).
import type { Jour, NiveauEnergie, ProfilEnergie } from "./types";
import { JOURS_SEMAINE } from "./types";

/** Créneaux d'énergie par défaut, proposés à l'inscription (modifiables ensuite). */
export const CRENEAUX_ENERGIE_DEFAUT: Omit<
  ProfilEnergie,
  "id" | "utilisateurId"
>[] = [
  { nomCreneau: "Début de matinée", heureDebut: "08:00", heureFin: "11:00", niveauEnergie: "haute", joursActifs: [...JOURS_SEMAINE] },
  { nomCreneau: "Fin de matinée", heureDebut: "11:00", heureFin: "12:30", niveauEnergie: "moyenne", joursActifs: [...JOURS_SEMAINE] },
  { nomCreneau: "Début d'après-midi", heureDebut: "13:00", heureFin: "15:00", niveauEnergie: "moyenne", joursActifs: [...JOURS_SEMAINE] },
  { nomCreneau: "Milieu d'après-midi", heureDebut: "15:00", heureFin: "16:30", niveauEnergie: "basse", joursActifs: [...JOURS_SEMAINE] },
  { nomCreneau: "Fin d'après-midi", heureDebut: "16:30", heureFin: "19:00", niveauEnergie: "moyenne", joursActifs: [...JOURS_SEMAINE] },
];

const LIBELLES_NIVEAU: Record<NiveauEnergie, string> = {
  haute: "Haute",
  moyenne: "Moyenne",
  basse: "Basse",
};

export function libelleNiveau(niveau: NiveauEnergie): string {
  return LIBELLES_NIVEAU[niveau];
}

const ABREV_NIVEAU: Record<NiveauEnergie, string> = {
  haute: "H",
  moyenne: "M",
  basse: "B",
};

/** Abréviation d'une lettre, pour les espaces très étroits (avec title complet à côté). */
export function abregeNiveau(niveau: NiveauEnergie): string {
  return ABREV_NIVEAU[niveau];
}

/** Renvoie le jour de la semaine (minuscule) correspondant à une date. */
export function jourDeLaSemaine(date: Date): Jour {
  // getDay(): 0 = dimanche, 1 = lundi, ...
  const index = (date.getDay() + 6) % 7; // 0 = lundi
  return JOURS_SEMAINE[index];
}

/** Convertit "HH:mm" en minutes depuis minuit. */
function heureEnMinutes(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Déduit le niveau d'énergie du moment présent à partir des créneaux de l'utilisatrice.
 * Renvoie `null` si aucun créneau ne couvre l'instant donné (ex. la nuit).
 */
export function deduireEnergieMoment(
  profils: ProfilEnergie[],
  maintenant: Date = new Date(),
): NiveauEnergie | null {
  const jour = jourDeLaSemaine(maintenant);
  const minutesActuelles = maintenant.getHours() * 60 + maintenant.getMinutes();

  const creneauCourant = profils.find((p) => {
    if (!p.joursActifs.includes(jour)) return false;
    const debut = heureEnMinutes(p.heureDebut);
    const fin = heureEnMinutes(p.heureFin);
    return minutesActuelles >= debut && minutesActuelles < fin;
  });

  return creneauCourant ? creneauCourant.niveauEnergie : null;
}
