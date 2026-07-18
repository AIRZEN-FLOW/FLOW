"use client";

// Vue Priorités : la matrice d'Eisenhower en 4 colonnes, pour voir d'un coup
// d'œil où se trouve chaque tâche active (voir docs/02-specifications-fonctionnelles.md §1).
import { useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { CarteTache } from "@/components/CarteTache";
import { FormulaireTache } from "@/components/FormulaireTache";
import { useTaches } from "@/lib/hooks/useTaches";
import { useProjets } from "@/lib/hooks/useProjets";
import { QUADRANTS } from "@/lib/eisenhower";
import type { Quadrant, SaisieTache, Tache } from "@/lib/types";

const ORDRE: Quadrant[] = ["q1", "q2", "q3", "q4"];

const SOUS_TITRE: Record<Quadrant, string> = {
  q1: "urgent et important",
  q2: "important, pas urgent",
  q3: "urgent, pas important",
  q4: "ni urgent ni important",
};

function VuePriorites() {
  const { taches, chargement, modifier, terminer, supprimer } = useTaches();
  const { projets } = useProjets();
  const [tacheEnEdition, setTacheEnEdition] = useState<Tache | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const projetParId = useMemo(() => new Map(projets.map((p) => [p.id, p])), [projets]);

  const parQuadrant = useMemo(() => {
    const actives = taches.filter(
      (t) => (t.statut === "a_faire" || t.statut === "en_cours") && !t.tacheParenteId,
    );
    const groupes: Record<Quadrant, Tache[]> = { q1: [], q2: [], q3: [], q4: [] };
    for (const t of actives) groupes[t.quadrantEisenhower].push(t);
    return groupes;
  }, [taches]);

  function projetDe(t: Tache) {
    const p = t.projetId ? projetParId.get(t.projetId) : undefined;
    return p ? { nom: p.nom, couleur: p.couleur } : undefined;
  }

  async function enregistrerModification(saisie: SaisieTache) {
    if (!tacheEnEdition) return;
    setEnregistrement(true);
    try {
      await modifier(tacheEnEdition.id, saisie);
      setTacheEnEdition(null);
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-airzen-primary">Priorités</h1>
        <p className="mt-1 text-sm font-light text-airzen-secondary">
          Vos tâches actives réparties selon la matrice d&apos;Eisenhower.
        </p>
      </div>

      {tacheEnEdition && (
        <FormulaireTache
          valeursInitiales={tacheEnEdition}
          onValider={enregistrerModification}
          onAnnuler={() => setTacheEnEdition(null)}
          enCours={enregistrement}
          projets={projets}
          tachesParentes={taches.filter(
            (t) => !t.tacheParenteId && t.id !== tacheEnEdition.id,
          )}
        />
      )}

      {chargement ? (
        <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ORDRE.map((q) => {
            const liste = parQuadrant[q];
            return (
              <div key={q} className="flex flex-col gap-2.5">
                <div
                  className="rounded-xl px-3 py-2"
                  style={{ backgroundColor: `${QUADRANTS[q].couleur}40` }}
                >
                  <p className="text-sm font-semibold text-airzen-primary">
                    {QUADRANTS[q].label}
                  </p>
                  <p className="text-xs text-airzen-secondary">
                    {SOUS_TITRE[q]} · {liste.length}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {liste.length === 0 ? (
                    <p className="px-1 text-xs font-light text-airzen-neutral">
                      Rien ici pour l&apos;instant.
                    </p>
                  ) : (
                    liste.map((t) => (
                      <CarteTache
                        key={t.id}
                        tache={t}
                        projet={projetDe(t)}
                        onModifier={setTacheEnEdition}
                        onTerminer={(t) => terminer(t.id)}
                        onSupprimer={(t) => supprimer(t.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PagePriorites() {
  return (
    <RequireAuth>
      <AppShell>
        <VuePriorites />
      </AppShell>
    </RequireAuth>
  );
}
