// Petits utilitaires de formatage pour l'affichage (durée, échéance).
import type { Timestamp } from "firebase/firestore";

/** "30 min", "1 h", "1 h 30". */
export function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

/** Version compacte de la durée pour les espaces très étroits : "30m", "1h30". */
export function formatDureeCourt(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

/** Convertit un Timestamp Firestore (ou null) en Date. */
export function tsEnDate(ts: Timestamp | null | undefined): Date | null {
  return ts ? ts.toDate() : null;
}

/** Texte d'échéance doux et lisible, relatif à aujourd'hui. */
export function formatEcheance(
  date: Date | null,
  maintenant: Date = new Date(),
): string | null {
  if (!date) return null;
  const msParJour = 24 * 60 * 60 * 1000;
  const debutAuj = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate(),
  );
  const debutEch = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const jours = Math.round((debutEch.getTime() - debutAuj.getTime()) / msParJour);
  if (jours < -1) return `il y a ${-jours} jours`;
  if (jours === -1) return "hier";
  if (jours === 0) return "aujourd'hui";
  if (jours === 1) return "demain";
  if (jours <= 7) return `dans ${jours} jours`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Version compacte de l'échéance pour les espaces très étroits : "auj.", "j+3". */
export function formatEcheanceCourt(
  date: Date | null,
  maintenant: Date = new Date(),
): string | null {
  if (!date) return null;
  const msParJour = 24 * 60 * 60 * 1000;
  const debutAuj = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate(),
  );
  const debutEch = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const jours = Math.round((debutEch.getTime() - debutAuj.getTime()) / msParJour);
  if (jours < -1) return `-${-jours}j`;
  if (jours === -1) return "hier";
  if (jours === 0) return "auj.";
  if (jours === 1) return "demain";
  if (jours <= 7) return `j+${jours}`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Valeur "YYYY-MM-DD" pour un <input type="date">. */
export function dateEnValeurInput(date: Date | null): string {
  if (!date) return "";
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}
