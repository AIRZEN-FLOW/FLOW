"use client";

// Météo optionnelle sur l'écran "Aujourd'hui" (voir tâche "écran plus chaleureux").
// Désactivée par défaut : rien n'est demandé au navigateur (position géographique)
// tant que la personne n'a pas cliqué pour l'activer. Préférence mémorisée sur
// l'appareil (localStorage), comme le mode d'affichage — pas besoin de la stocker
// en base. Source météo : Open-Meteo, gratuite et sans clé d'API.
import { useCallback, useEffect, useState } from "react";

const CLE_ACTIF = "airzen-meteo-active";

export interface Meteo {
  temperature: number;
  code: number;
}

function lireActif(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CLE_ACTIF) === "1";
}

export function useMeteo() {
  const [actif, setActifEtat] = useState(() => lireActif());
  const [meteo, setMeteo] = useState<Meteo | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const chargement = actif && !meteo && !erreur;

  const activer = useCallback(() => {
    window.localStorage.setItem(CLE_ACTIF, "1");
    setActifEtat(true);
  }, []);

  const desactiver = useCallback(() => {
    window.localStorage.setItem(CLE_ACTIF, "0");
    setActifEtat(false);
    setMeteo(null);
    setErreur(null);
  }, []);

  useEffect(() => {
    if (!actif || meteo || erreur || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    let annule = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
        fetch(url)
          .then((reponse) => {
            if (!reponse.ok) throw new Error("Météo indisponible");
            return reponse.json();
          })
          .then((donnees) => {
            if (annule) return;
            setMeteo({
              temperature: Math.round(donnees.current.temperature_2m),
              code: donnees.current.weather_code,
            });
          })
          .catch(() => {
            if (!annule) setErreur("Météo indisponible pour le moment.");
          });
      },
      () => {
        if (!annule) setErreur("Localisation refusée — impossible d'afficher la météo.");
      },
      { timeout: 8000 },
    );
    return () => {
      annule = true;
    };
  }, [actif, meteo, erreur]);

  return { actif, meteo, erreur, chargement, activer, desactiver };
}
