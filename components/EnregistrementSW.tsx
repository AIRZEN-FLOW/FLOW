"use client";

// Étape 9 — Enregistre le service worker au chargement (navigateur uniquement).
import { useEffect } from "react";

export function EnregistrementSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.warn("Service worker non enregistré :", e);
      });
    }
  }, []);
  return null;
}
