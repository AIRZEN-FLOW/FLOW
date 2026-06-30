"use client";

// Étape 3 — Le noyau : créer, lister, et terminer des tâches.
import { useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { FormulaireTache } from "@/components/FormulaireTache";
import { CarteTache } from "@/components/CarteTache";
import { useTaches } from "@/lib/hooks/useTaches";
import type { SaisieTache } from "@/lib/types";

function GestionTaches() {
  const { taches, chargement, erreur, creer, terminer, rouvrir, supprimer } = useTaches();
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [terminéesVisibles, setTerminéesVisibles] = useState(false);

  const { actives, terminees } = useMemo(() => {
    const actives = taches.filter(
      (t) => t.statut === "a_faire" || t.statut === "en_cours",
    );
    const terminees = taches.filter((t) => t.statut === "terminee");
    return { actives, terminees };
  }, [taches]);

  async function ajouter(saisie: SaisieTache) {
    setEnregistrement(true);
    try {
      await creer(saisie);
      setFormulaireOuvert(false);
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-airzen-primary">Mes tâches</h1>
        {!formulaireOuvert && (
          <button
            type="button"
            onClick={() => setFormulaireOuvert(true)}
            className="rounded-full bg-airzen-accent px-4 py-2 text-sm font-semibold text-airzen-primary transition-opacity hover:opacity-90"
          >
            + Nouvelle tâche
          </button>
        )}
      </div>

      {formulaireOuvert && (
        <FormulaireTache
          onValider={ajouter}
          onAnnuler={() => setFormulaireOuvert(false)}
          enCours={enregistrement}
        />
      )}

      {erreur && <p className="text-sm text-q1">{erreur}</p>}

      {chargement ? (
        <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
      ) : actives.length === 0 && terminees.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-light text-airzen-secondary">
            Aucune tâche pour l&apos;instant. Ajoutez-en une pour commencer 🌱
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {actives.map((t) => (
              <CarteTache
                key={t.id}
                tache={t}
                onTerminer={(t) => terminer(t.id)}
                onSupprimer={(t) => supprimer(t.id)}
              />
            ))}
            {actives.length === 0 && (
              <p className="text-sm font-light text-airzen-secondary">
                Tout est fait, bravo ✨
              </p>
            )}
          </div>

          {terminees.length > 0 && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setTerminéesVisibles((v) => !v)}
                className="self-start text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
              >
                {terminéesVisibles
                  ? "Masquer les tâches terminées"
                  : `Voir les ${terminees.length} tâche${terminees.length > 1 ? "s" : ""} terminée${terminees.length > 1 ? "s" : ""}`}
              </button>
              {terminéesVisibles &&
                terminees.map((t) => (
                  <CarteTache
                    key={t.id}
                    tache={t}
                    onRouvrir={(t) => rouvrir(t.id)}
                    onSupprimer={(t) => supprimer(t.id)}
                  />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PageTaches() {
  return (
    <RequireAuth>
      <AppShell>
        <GestionTaches />
      </AppShell>
    </RequireAuth>
  );
}
