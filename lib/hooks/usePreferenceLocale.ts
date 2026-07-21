"use client";

// Petite préférence d'affichage booléenne, mémorisée sur l'appareil
// (localStorage) — même logique que useModeAffichage / useMeteo, pour des
// réglages qui n'ont pas besoin d'être stockés en base.
import { useCallback, useState } from "react";

function lire(cle: string, defaut: boolean): boolean {
  if (typeof window === "undefined") return defaut;
  const v = window.localStorage.getItem(cle);
  if (v === "1") return true;
  if (v === "0") return false;
  return defaut;
}

export function usePreferenceLocale(cle: string, defaut = true) {
  const [valeur, setValeurEtat] = useState(() => lire(cle, defaut));

  const setValeur = useCallback(
    (v: boolean) => {
      window.localStorage.setItem(cle, v ? "1" : "0");
      setValeurEtat(v);
    },
    [cle],
  );

  return [valeur, setValeur] as const;
}
