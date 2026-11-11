"use client";

// Préférence d'affichage "matrice" ou "tuiles", mémorisée sur l'appareil
// (localStorage) — pas besoin de la stocker en base, c'est un simple confort
// d'affichage propre à chaque écran.
import { useCallback, useState } from "react";

// "priorites" = la matrice (affichage par défaut). L'ancien mode "liste" a été
// retiré : une préférence "liste" déjà mémorisée retombe sur la matrice.
export type ModeAffichage = "priorites" | "tuile";

function lire(cle: string): ModeAffichage {
  if (typeof window === "undefined") return "priorites";
  const v = window.localStorage.getItem(cle);
  return v === "tuile" ? "tuile" : "priorites";
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
