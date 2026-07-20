"use client";

// Un lieu dédié pour retrouver les tâches terminées, séparé des tâches actives
// (voir retour utilisatrice : la liste active ne doit pas être encombrée, mais
// les tâches faites doivent rester consultables — rouvrir, supprimer, ou juste
// se rappeler du chemin parcouru).
import { useMemo, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { CarteTache } from "@/components/CarteTache";
import { FormulaireTache } from "@/components/FormulaireTache";
import { useTaches } from "@/lib/hooks/useTaches";
import { useProjets } from "@/lib/hooks/useProjets";
import { tsEnDate } from "@/lib/format";
import type { SaisieTache, Tache } from "@/lib/types";

function PageContenu() {
  const { taches, chargement, modifier, rouvrir, supprimer } = useTaches();
  const { projets } = useProjets();
  const [filtreProjet, setFiltreProjet] = useState<string>("tous");
  const [tacheEnEdition, setTacheEnEdition] = useState<Tache | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const projetParId = useMemo(
    () => new Map(projets.map((p) => [p.id, p])),
    [projets],
  );

  function projetDe(t: Tache) {
    const p = t.projetId ? projetParId.get(t.projetId) : undefined;
    return p ? { nom: p.nom, couleur: p.couleur } : undefined;
  }

  const terminees = useMemo(() => {
    return taches
      .filter((t) => t.statut === "terminee")
      .filter((t) => filtreProjet === "tous" || t.projetId === filtreProjet)
      .sort((a, b) => {
        const da = tsEnDate(a.modifieLe ?? null)?.getTime() ?? 0;
        const db = tsEnDate(b.modifieLe ?? null)?.getTime() ?? 0;
        return db - da;
      });
  }, [taches, filtreProjet]);

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
        <h1 className="text-2xl font-bold text-airzen-primary">Tâches terminées</h1>
        <p className="mt-1 text-sm font-light text-airzen-secondary">
          Tout ce que vous avez accompli, au même endroit.
        </p>
      </div>

      {projets.length > 0 && (
        <label className="flex items-center gap-2 self-start text-sm text-airzen-secondary">
          Projet :
          <select
            value={filtreProjet}
            onChange={(e) => setFiltreProjet(e.target.value)}
            className="rounded-lg border border-airzen-neutral/60 bg-white px-2 py-1.5 text-airzen-primary outline-none focus:border-airzen-secondary"
          >
            <option value="tous">Tous</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </label>
      )}

      {tacheEnEdition && (
        <FormulaireTache
          valeursInitiales={tacheEnEdition}
          onValider={enregistrerModification}
          onAnnuler={() => setTacheEnEdition(null)}
          enCours={enregistrement}
          projets={projets}
          tachesParentes={[]}
        />
      )}

      {chargement ? (
        <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
      ) : terminees.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-light text-airzen-secondary">
            Rien ici pour l&apos;instant — les tâches accomplies apparaîtront à cet
            endroit ✨
          </p>
          <Link
            href="/taches"
            className="mt-4 inline-block text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
          >
            ← Retour à mes tâches
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {terminees.map((t) => (
            <CarteTache
              key={t.id}
              tache={t}
              projet={projetDe(t)}
              onModifier={setTacheEnEdition}
              onRouvrir={(t) => rouvrir(t.id)}
              onSupprimer={(t) => supprimer(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PageTerminees() {
  return (
    <RequireAuth>
      <AppShell>
        <PageContenu />
      </AppShell>
    </RequireAuth>
  );
}
