"use client";

// Hook de gestion des événements personnels du calendrier (voir
// lib/data/evenements.ts) — même schéma que useTaches.ts : chargement complet
// + mutations optimistes.
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { EvenementCalendrier, SaisieEvenement } from "@/lib/types";
import {
  creerEvenement,
  getEvenements,
  majEvenement,
  supprimerEvenement,
} from "@/lib/data/evenements";

export function useEvenements() {
  const { user } = useAuth();
  const [evenements, setEvenements] = useState<EvenementCalendrier[]>([]);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(async () => {
    if (!user) return;
    setChargement(true);
    try {
      setEvenements(await getEvenements(user.uid));
    } finally {
      setChargement(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let actif = true;
    (async () => {
      setChargement(true);
      try {
        const data = await getEvenements(user.uid);
        if (actif) setEvenements(data);
      } finally {
        if (actif) setChargement(false);
      }
    })();
    return () => {
      actif = false;
    };
  }, [user]);

  const creer = useCallback(
    async (saisie: SaisieEvenement) => {
      if (!user) return;
      await creerEvenement(user.uid, saisie);
      await recharger();
    },
    [user, recharger],
  );

  const modifier = useCallback(
    async (id: string, saisie: SaisieEvenement) => {
      await majEvenement(id, saisie);
      await recharger();
    },
    [recharger],
  );

  const supprimer = useCallback(async (id: string) => {
    setEvenements((prev) => prev.filter((e) => e.id !== id));
    await supprimerEvenement(id);
  }, []);

  return { evenements, chargement, recharger, creer, modifier, supprimer };
}
