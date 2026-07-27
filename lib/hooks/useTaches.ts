"use client";

// Hook de gestion des tâches de l'utilisatrice connectée.
// Charge la liste et expose les mutations (créer, terminer, rouvrir, supprimer).
import { useCallback, useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { useCelebration } from "@/components/CelebrationProvider";
import type { SaisieTache, StatutTache, Tache } from "@/lib/types";
import {
  assignerProjetTache,
  basculerEpingleTache,
  creerTache,
  demarrerChrono as demarrerChronoDb,
  getTaches,
  majStatutTache,
  majTache,
  mettreEnPauseChrono as mettreEnPauseChronoDb,
  reordonnerTaches as reordonnerTachesDb,
  supprimerTache,
} from "@/lib/data/taches";
import { calculerQuadrant } from "@/lib/eisenhower";
import { tsEnDate } from "@/lib/format";
import { occurrenceSuivante } from "@/lib/recurrence";

export function useTaches() {
  const { user, utilisateur } = useAuth();
  const { celebrer } = useCelebration();
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

  // Étape 7 — terminer une tâche : si elle est récurrente, l'occurrence
  // suivante est créée automatiquement selon la règle (sauf dateFin dépassée).
  const terminer = useCallback(
    async (id: string) => {
      const tache = taches.find((t) => t.id === id);
      await changerStatut(id, "terminee");
      // Reconnaissance à chaque tâche accomplie — d'autant plus enthousiaste
      // que la tâche était longue et importante (voir CelebrationProvider).
      celebrer({
        dureeEstimeeMinutes: tache?.dureeEstimeeMinutes,
        niveauImportance: tache?.niveauImportance,
      });
      if (!user || !tache?.recurrenceRegle) return;
      const suivante = occurrenceSuivante(tache);
      if (!suivante) return;
      await creerTache(
        user.uid,
        {
          titre: tache.titre,
          description: tache.description,
          dateEcheance: suivante.dateEcheance,
          niveauImportance: tache.niveauImportance,
          dureeEstimeeMinutes: tache.dureeEstimeeMinutes,
          niveauEnergieRequis: tache.niveauEnergieRequis,
          tags: tache.tags,
          projetId: tache.projetId,
          source: tache.source,
          recurrenceRegle: {
            frequence: tache.recurrenceRegle.frequence,
            joursConcernes: tache.recurrenceRegle.joursConcernes,
            dateFin: tsEnDate(tache.recurrenceRegle.dateFin ?? null),
          },
        },
        seuilJours,
      );
      await recharger();
    },
    [taches, user, seuilJours, changerStatut, recharger, celebrer],
  );

  const supprimer = useCallback(async (id: string) => {
    setTaches((prev) => prev.filter((t) => t.id !== id));
    await supprimerTache(id);
  }, []);

  // Épingler/désépingler une tâche dans la colonne Q1 de la vue Priorités
  // (voir docs/02-specifications-fonctionnelles.md — le quadrant réel, lui,
  // n'est jamais modifié manuellement).
  const basculerEpingle = useCallback(
    async (id: string) => {
      const tache = taches.find((t) => t.id === id);
      if (!tache) return;
      const epinglee = !tache.epinglee;
      setTaches((prev) => prev.map((t) => (t.id === id ? { ...t, epinglee } : t)));
      await basculerEpingleTache(id, epinglee);
    },
    [taches],
  );

  // Rattache d'un coup plusieurs tâches déjà existantes à un projet
  // (ex : tâches créées avant que le projet n'existe).
  const rattacherAuProjet = useCallback(
    async (ids: string[], projetId: string) => {
      await Promise.all(ids.map((id) => assignerProjetTache(id, projetId)));
      setTaches((prev) =>
        prev.map((t) => (ids.includes(t.id) ? { ...t, projetId } : t)),
      );
    },
    [],
  );

  // Chronomètre — démarrer/reprendre : horodatage optimiste local (précision à
  // la seconde près suffisante ici), persisté avec un vrai `serverTimestamp()`.
  const demarrerChrono = useCallback(async (id: string) => {
    const maintenant = Timestamp.fromDate(new Date());
    setTaches((prev) =>
      prev.map((t) => (t.id === id ? { ...t, chronoDemarreLe: maintenant } : t)),
    );
    await demarrerChronoDb(id);
  }, []);

  // Chronomètre — mettre en pause : cumule le temps écoulé depuis le démarrage.
  const mettreEnPauseChrono = useCallback(
    async (id: string) => {
      const tache = taches.find((t) => t.id === id);
      if (!tache?.chronoDemarreLe) return;
      const debut = tsEnDate(tache.chronoDemarreLe);
      const ecouleMinutes = debut
        ? Math.max(0, Math.round((Date.now() - debut.getTime()) / 60000))
        : 0;
      const total = (tache.tempsPasseMinutes ?? 0) + ecouleMinutes;
      setTaches((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, tempsPasseMinutes: total, chronoDemarreLe: null } : t,
        ),
      );
      await mettreEnPauseChronoDb(id, total);
    },
    [taches],
  );

  // Réordonnancement manuel (glisser-déposer dans le Gantt d'un projet).
  const reordonnerTaches = useCallback(async (idsEnOrdre: string[]) => {
    setTaches((prev) =>
      prev.map((t) => {
        const index = idsEnOrdre.indexOf(t.id);
        return index >= 0 ? { ...t, ordre: index } : t;
      }),
    );
    await reordonnerTachesDb(idsEnOrdre);
  }, []);

  return {
    taches,
    chargement,
    erreur,
    recharger,
    creer,
    creerAvecSousTaches,
    modifier,
    terminer,
    rouvrir: (id: string) => changerStatut(id, "a_faire"),
    changerStatut,
    supprimer,
    rattacherAuProjet,
    basculerEpingle,
    demarrerChrono,
    mettreEnPauseChrono,
    reordonnerTaches,
  };
}
