"use client";

// Énergie du moment : déduite des créneaux de l'utilisatrice, avec possibilité
// d'un ajustement manuel pour la journée en cours (un seul tap, optionnel).
// L'ajustement du jour est stocké localement (localStorage) — sans charge mentale,
// sans écriture en base à chaque tap.
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { NiveauEnergie } from "@/lib/types";
import { deduireEnergieMoment } from "@/lib/energie";

function cleDuJour(date = new Date()): string {
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `airzen-energie-${date.getFullYear()}-${mois}-${jour}`;
}

function lireOverride(): NiveauEnergie | null {
  if (typeof window === "undefined") return null;
  const s = window.localStorage.getItem(cleDuJour());
  return s === "haute" || s === "moyenne" || s === "basse" ? s : null;
}

export function useEnergieMoment() {
  const { profilsEnergie } = useAuth();
  // Lecture paresseuse de l'ajustement du jour (côté navigateur uniquement).
  const [override, setOverride] = useState<NiveauEnergie | null>(lireOverride);
  const [maintenant] = useState(() => new Date());

  const energieDeduite = useMemo(
    () => deduireEnergieMoment(profilsEnergie, maintenant),
    [profilsEnergie, maintenant],
  );

  const energieEffective: NiveauEnergie | null = override ?? energieDeduite;

  const definirOverride = useCallback((niveau: NiveauEnergie) => {
    window.localStorage.setItem(cleDuJour(), niveau);
    setOverride(niveau);
  }, []);

  const reinitialiser = useCallback(() => {
    window.localStorage.removeItem(cleDuJour());
    setOverride(null);
  }, []);

  return {
    energieDeduite,
    energieEffective,
    ajustementManuel: override,
    definirOverride,
    reinitialiser,
  };
}
