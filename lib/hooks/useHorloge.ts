"use client";

// Horloge qui se met à jour régulièrement (toutes les minutes par défaut), pour
// que les seuils basés sur l'heure (ex. fin de journée) se déclenchent pendant
// que l'écran reste ouvert, sans attendre un rechargement de la page.
import { useEffect, useState } from "react";

export function useHorloge(intervalleMs = 60_000): Date {
  const [maintenant, setMaintenant] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setMaintenant(new Date()), intervalleMs);
    return () => clearInterval(id);
  }, [intervalleMs]);

  return maintenant;
}
