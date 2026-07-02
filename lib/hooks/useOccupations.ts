"use client";

// Étape 8 — Créneaux occupés du jour (Google Agenda, lecture seule).
// Ne fait rien si l'agenda n'est pas connecté.
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export interface Occupation {
  debut: Date;
  fin: Date;
}

export function useOccupations(date: Date = new Date()) {
  const { user, utilisateur } = useAuth();
  const [occupations, setOccupations] = useState<Occupation[] | null>(null);
  const [chargement, setChargement] = useState(false);

  const connecte = utilisateur?.googleCalendarConnecte ?? false;
  const cleJour = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  useEffect(() => {
    if (!user || !connecte) return;
    let actif = true;
    (async () => {
      setChargement(true);
      try {
        const [annee, mois, jour] = cleJour.split("-").map(Number);
        const debut = new Date(annee, mois, jour, 0, 0, 0);
        const fin = new Date(annee, mois, jour, 23, 59, 59);
        const jeton = await user.getIdToken();
        const reponse = await fetch(
          `/api/google/occupations?debut=${encodeURIComponent(debut.toISOString())}&fin=${encodeURIComponent(fin.toISOString())}`,
          { headers: { Authorization: `Bearer ${jeton}` } },
        );
        if (!actif) return;
        if (reponse.ok) {
          const donnees = await reponse.json();
          setOccupations(
            (donnees.occupations as { debut: string; fin: string }[]).map((o) => ({
              debut: new Date(o.debut),
              fin: new Date(o.fin),
            })),
          );
        } else {
          setOccupations(null);
        }
      } catch {
        if (actif) setOccupations(null);
      } finally {
        if (actif) setChargement(false);
      }
    })();
    return () => {
      actif = false;
    };
  }, [user, connecte, cleJour]);

  return { occupations, chargement, connecte };
}

/** Minutes disponibles entre `maintenant` et le prochain créneau occupé (null = journée libre). */
export function minutesAvantProchaineOccupation(
  occupations: Occupation[],
  maintenant: Date = new Date(),
): { minutes: number; prochaine: Occupation } | null {
  const aVenir = occupations
    .filter((o) => o.fin.getTime() > maintenant.getTime())
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());
  if (aVenir.length === 0) return null;
  const prochaine = aVenir[0];
  // Déjà en plein rendez-vous → 0 minute disponible.
  if (prochaine.debut.getTime() <= maintenant.getTime()) {
    return { minutes: 0, prochaine };
  }
  return {
    minutes: Math.floor((prochaine.debut.getTime() - maintenant.getTime()) / 60000),
    prochaine,
  };
}
