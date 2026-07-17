"use client";

// Hook de gestion des projets de l'utilisatrice connectée.
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Projet, StatutProjet } from "@/lib/types";
import {
  creerProjet,
  getProjets,
  majProjet,
  supprimerProjet,
  type SaisieProjet,
} from "@/lib/data/projets";

export function useProjets() {
  const { user } = useAuth();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!user) return;
    let actif = true;
    (async () => {
      setChargement(true);
      try {
        const data = await getProjets(user.uid);
        if (actif) setProjets(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (actif) setChargement(false);
      }
    })();
    return () => {
      actif = false;
    };
  }, [user]);

  const recharger = useCallback(async () => {
    if (!user) return;
    setProjets(await getProjets(user.uid));
  }, [user]);

  const creer = useCallback(
    async (saisie: SaisieProjet) => {
      if (!user) return;
      await creerProjet(user.uid, saisie);
      await recharger();
    },
    [user, recharger],
  );

  const modifier = useCallback(async (id: string, saisie: SaisieProjet) => {
    setProjets((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, nom: saisie.nom, couleur: saisie.couleur, description: saisie.description }
          : p,
      ),
    );
    await majProjet(id, {
      nom: saisie.nom.trim(),
      description: saisie.description?.trim() ?? "",
      couleur: saisie.couleur,
    });
  }, []);

  const changerStatut = useCallback(
    async (id: string, statut: StatutProjet) => {
      setProjets((prev) => prev.map((p) => (p.id === id ? { ...p, statut } : p)));
      await majProjet(id, { statut });
    },
    [],
  );

  const supprimer = useCallback(async (id: string) => {
    setProjets((prev) => prev.filter((p) => p.id !== id));
    await supprimerProjet(id);
  }, []);

  return { projets, chargement, recharger, creer, modifier, changerStatut, supprimer };
}
