"use client";

// Hook de gestion des tâches de l'utilisatrice connectée.
// Charge la liste et expose les mutations (créer, terminer, rouvrir, supprimer).
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { SaisieTache, StatutTache, Tache } from "@/lib/types";
import {
  creerTache,
  getTaches,
  majStatutTache,
  majTache,
  supprimerTache,
} from "@/lib/data/taches";
import { calculerQuadrant } from "@/lib/eisenhower";
import { tsEnDate } from "@/lib/format";

export function useTaches() {
  const { user, utilisateur } = useAuth();
  const [taches, setTaches] = useState<Tache[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const seuilJours = utilisateur?.seuilUrgenceJours ?? 3;

  // Recalcule le quadrant en fonction de la date du jour (l'urgence est relative
  // au moment présent). Le quadrant stocké sert de cache ; l'affichage reste juste.
  const rafraichirQuadrants = useCallback(
    (list: Tache[]): Tache[] =>
      list.map((t) => ({
        ...t,
        quadrantEisenhower: calculerQuadrant(
          tsEnDate(t.dateEcheance),
          t.niveauImportance,
          seuilJours,
        ),
      })),
    [seuilJours],
  );

  const recharger = useCallback(async () => {
    if (!user) return;
    setChargement(true);
    setErreur(null);
    try {
      setTaches(rafraichirQuadrants(await getTaches(user.uid)));
    } catch (e) {
      console.error(e);
      setErreur("Impossible de charger les tâches.");
    } finally {
      setChargement(false);
    }
  }, [user, rafraichirQuadrants]);

  // Chargement initial : logique inline (avec annulation) pour ne pas déclencher
  // de setState synchrone dans l'effet.
  useEffect(() => {
    if (!user) return;
    let actif = true;
    (async () => {
      setChargement(true);
      setErreur(null);
      try {
        const data = await getTaches(user.uid);
        if (actif) setTaches(rafraichirQuadrants(data));
      } catch (e) {
        console.error(e);
        if (actif) setErreur("Impossible de charger les tâches.");
      } finally {
        if (actif) setChargement(false);
      }
    })();
    return () => {
      actif = false;
    };
  }, [user, rafraichirQuadrants]);

  const creer = useCallback(
    async (saisie: SaisieTache) => {
      if (!user) return;
      await creerTache(user.uid, saisie, seuilJours);
      await recharger();
    },
    [user, seuilJours, recharger],
  );

  // Étape 6 — crée la tâche mère puis ses sous-tâches issues du découpage IA.
  const creerAvecSousTaches = useCallback(
    async (
      saisie: SaisieTache,
      sousTaches: { titre: string; dureeEstimeeMinutes: number }[],
    ) => {
      if (!user) return;
      const idMere = await creerTache(user.uid, saisie, seuilJours);
      for (const s of sousTaches) {
        await creerTache(
          user.uid,
          {
            titre: s.titre,
            dureeEstimeeMinutes: s.dureeEstimeeMinutes,
            niveauImportance: saisie.niveauImportance,
            niveauEnergieRequis: saisie.niveauEnergieRequis,
            dateEcheance: saisie.dateEcheance,
            projetId: saisie.projetId,
            tacheParenteId: idMere,
            source: "decoupage_auto",
          },
          seuilJours,
        );
      }
      await recharger();
    },
    [user, seuilJours, recharger],
  );

  const modifier = useCallback(
    async (id: string, saisie: SaisieTache) => {
      await majTache(id, saisie, seuilJours);
      await recharger();
    },
    [seuilJours, recharger],
  );

  const changerStatut = useCallback(
    async (id: string, statut: StatutTache) => {
      // Mise à jour optimiste locale, puis persistance.
      setTaches((prev) => prev.map((t) => (t.id === id ? { ...t, statut } : t)));
      await majStatutTache(id, statut);
    },
    [],
  );

  const supprimer = useCallback(async (id: string) => {
    setTaches((prev) => prev.filter((t) => t.id !== id));
    await supprimerTache(id);
  }, []);

  return {
    taches,
    chargement,
    erreur,
    recharger,
    creer,
    creerAvecSousTaches,
    modifier,
    terminer: (id: string) => changerStatut(id, "terminee"),
    rouvrir: (id: string) => changerStatut(id, "a_faire"),
    supprimer,
  };
}
