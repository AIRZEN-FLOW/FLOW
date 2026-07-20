"use client";

// Préférence d'affichage "liste" ou "tuiles", mémorisée sur l'appareil
// (localStorage) — pas besoin de la stocker en base, c'est un simple confort
// d'affichage propre à chaque écran.
import { useCallback, useState } from "react";

export type ModeAffichage = "liste" | "tuile" | "priorites";

function lire(cle: string): ModeAffichage {
  if (typeof window === "undefined") return "liste";
  const v = window.localStorage.getItem(cle);
  return v === "tuile" || v === "priorites" ? v : "liste";
}

export function useModeAffichage(cle: string) {
  const [mode, setModeEtat] = useState<ModeAffichage>(() => lire(cle));

  const setMode = useCallback(
    (m: ModeAffichage) => {
      window.localStorage.setItem(cle, m);
      setModeEtat(m);
    },
    [cle],
  );

  return { mode, setMode };
}
