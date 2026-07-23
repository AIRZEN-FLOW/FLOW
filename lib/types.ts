// Modèle de données AIR ZEN Flow (voir docs/03-specifications-techniques.md).
// Le modèle est volontairement complet — pensé pour grandir — même si l'interface
// n'exploite pas encore tous les champs.
import type { Timestamp } from "firebase/firestore";

export type NiveauEnergie = "haute" | "moyenne" | "basse";
export type NiveauImportance = "haute" | "moyenne" | "basse";
/** Plaisir procuré par la tâche — sert à proposer d'abord ce qui pèse le plus. */
export type NiveauPlaisir = "haute" | "moyenne" | "basse";
export type StatutTache = "a_faire" | "en_cours" | "terminee" | "annulee";
export type Quadrant = "q1" | "q2" | "q3" | "q4";
export type SourceTache = "manuelle" | "decoupage_auto" | "notion" | "gmail" | "trello";
export type StatutProjet = "actif" | "en_pause" | "termine" | "archive";

/** Jours de la semaine, en minuscules (cohérent avec profilsEnergie.joursActifs). */
export const JOURS_SEMAINE = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;
export type Jour = (typeof JOURS_SEMAINE)[number];

/** Règle de récurrence (Étape 7 — modèle prévu, non exploité en MVP). */
export interface RecurrenceRegle {
  frequence: "quotidienne" | "hebdomadaire" | "mensuelle";
  joursConcernes?: Jour[];
  dateFin?: Timestamp | null;
}

/** Profil utilisateur étendu (collection `utilisateurs`). */
export interface Utilisateur {
  id: string; // = uid Firebase Auth
  email: string;
  nomAffiche: string;
  plan: "gratuit"; // prévu pour évolution future
  seuilUrgenceJours: number; // défaut 3
  seuilDecoupageMinutes: number; // défaut 90
  /** Heure de fin de journée de travail, format "HH:mm". Défaut "19:00". */
  finJournee?: string;
  /** Heure de début de journée type, format "HH:mm". Défaut "08:00". */
  heureDebutTravail?: string;
  /** Pause déjeuner, exclue de la planification automatique. Défaut true. */
  pauseDejeunerActive?: boolean;
  /** Format "HH:mm". Défaut "12:30". */
  heureDebutDejeuner?: string;
  /** Format "HH:mm". Défaut "13:00". */
  heureFinDejeuner?: string;
  googleCalendarConnecte: boolean;
  creeLe?: Timestamp;
}

/** Créneau d'énergie de la journée (collection `profilsEnergie`). */
export interface ProfilEnergie {
  id: string;
  utilisateurId: string;
  nomCreneau: string;
  heureDebut: string; // "HH:mm"
  heureFin: string; // "HH:mm"
  niveauEnergie: NiveauEnergie;
  joursActifs: Jour[];
}

/** Projet regroupant des tâches (collection `projets`). */
export interface Projet {
  id: string;
  utilisateurId: string;
  nom: string;
  description?: string;
  couleur: string; // code hex
  statut: StatutProjet;
  creeLe?: Timestamp;
}

/** Tâche (collection `taches`). */
export interface Tache {
  id: string;
  utilisateurId: string;
  projetId?: string | null;
  tacheParenteId?: string | null;
  titre: string;
  description?: string;
  statut: StatutTache;
  dateEcheance?: Timestamp | null;
  niveauImportance: NiveauImportance;
  dureeEstimeeMinutes: number;
  niveauEnergieRequis: NiveauEnergie;
  /** Plaisir procuré (optionnel : les tâches créées avant ce champ ne l'ont pas). */
  niveauPlaisir?: NiveauPlaisir;
  quadrantEisenhower: Quadrant; // calculé côté application
  tags: string[];
  source: SourceTache;
  recurrenceRegle?: RecurrenceRegle | null;
  /** Rappel (notification navigateur) à activer le jour de l'échéance. Défaut false. */
  rappel?: boolean;
  /** Tri manuel (ex. glisser-déposer dans le Gantt d'un projet). Plus petit = plus haut. */
  ordre?: number;
  /** Chronomètre — minutes déjà accumulées (hors session en cours). Défaut 0. */
  tempsPasseMinutes?: number;
  /** Chronomètre — horodatage de démarrage si en cours, `null`/absent si en pause. */
  chronoDemarreLe?: Timestamp | null;
  creeLe?: Timestamp;
  modifieLe?: Timestamp;
}

/** Données d'un formulaire de création de tâche (avant écriture en base). */
export interface SaisieTache {
  titre: string;
  description?: string;
  dateEcheance?: Date | null;
  niveauImportance: NiveauImportance;
  dureeEstimeeMinutes: number;
  niveauEnergieRequis: NiveauEnergie;
  niveauPlaisir?: NiveauPlaisir;
  tags?: string[];
  projetId?: string | null;
  tacheParenteId?: string | null;
  source?: SourceTache;
  rappel?: boolean;
  recurrenceRegle?: {
    frequence: "quotidienne" | "hebdomadaire" | "mensuelle";
    joursConcernes?: Jour[];
    dateFin?: Date | null;
  } | null;
}

/**
 * Événement personnel du calendrier (collection `evenementsCalendrier`) —
 * indépendant de Google Agenda, géré entièrement dans l'app (créé/modifié/
 * supprimé par l'utilisatrice), pour que le calendrier soit utile même sans
 * compte Google connecté.
 */
export interface EvenementCalendrier {
  id: string;
  utilisateurId: string;
  titre: string;
  description?: string;
  dateDebut: Timestamp;
  dateFin: Timestamp;
  /** Si vrai, `dateDebut`/`dateFin` ne portent que la date (heures ignorées à l'affichage). */
  journeeEntiere: boolean;
  creeLe?: Timestamp;
}

/** Données de formulaire pour un événement (avant écriture en base). */
export interface SaisieEvenement {
  titre: string;
  description?: string;
  dateDebut: Date;
  dateFin: Date;
  journeeEntiere: boolean;
}
