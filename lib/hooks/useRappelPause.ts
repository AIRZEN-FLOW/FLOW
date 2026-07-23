"use client";

// Rappel doux de pause toutes les 1h30 (indépendant des rappels d'échéance,
// voir useRappels.ts). Même limite honnête : uniquement pendant que l'app est
// ouverte dans un onglet. Le compte à rebours redémarre à chaque ouverture de
// l'app (pas de suivi de "temps de travail réel", volontairement simple).
import { useEffect } from "react";
import { usePreferenceLocale } from "@/lib/hooks/usePreferenceLocale";

export const CLE_RAPPEL_PAUSE_ACTIF = "airzen-rappel-pause-actif";
const INTERVALLE_MS = 90 * 60 * 1000; // 1h30

export function useRappelPause() {
  const [actif] = usePreferenceLocale(CLE_RAPPEL_PAUSE_ACTIF, true);

  useEffect(() => {
    if (!actif || typeof window === "undefined" || !("Notification" in window)) return;

    const intervalle = window.setInterval(() => {
      if (Notification.permission !== "granted") return;
      new Notification("🌿 Petite pause ?", {
        body: "1h30 de travail — un moment pour souffler vous ferait du bien.",
        icon: "/icons/icon-192.png",
        tag: "airzen-pause",
      });
    }, INTERVALLE_MS);

    return () => window.clearInterval(intervalle);
  }, [actif]);
}
