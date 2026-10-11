// Petits utilitaires de dates partagés par les vues du calendrier personnel
// (CalendrierSemaine/Mois/Annee) — pas de librairie externe, calculs "à la
// main" comme le reste du projet (voir le Gantt de la fiche projet).

/** Lundi de la semaine contenant `date` (cohérent avec JOURS_SEMAINE, lundi=0). */
export function lundiDe(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const decalage = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - decalage);
  return d;
}

export function ajouterJours(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function estMemeJour(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Grille de 6 semaines (lundi→dimanche) couvrant le mois de `reference`. */
export function grilleMois(reference: Date): Date[] {
  const premierDuMois = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const debut = lundiDe(premierDuMois);
  return Array.from({ length: 42 }, (_, i) => ajouterJours(debut, i));
}

export const NOMS_JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function nomMoisAnnee(date: Date): string {
  const texte = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
