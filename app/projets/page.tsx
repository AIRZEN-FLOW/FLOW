"use client";

// Étape 5 — Projets : regrouper des tâches autour d'un objectif commun.
import { useMemo, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useProjets } from "@/lib/hooks/useProjets";
import { useTaches } from "@/lib/hooks/useTaches";
import { COULEURS_PROJET } from "@/lib/data/projets";
import type { Projet } from "@/lib/types";

function FormulaireProjet({
  onValider,
  onAnnuler,
}: {
  onValider: (nom: string, couleur: string, description: string) => Promise<void>;
  onAnnuler: () => void;
}) {
  const [nom, setNom] = useState("");
  const [couleur, setCouleur] = useState(COULEURS_PROJET[0]);
  const [description, setDescription] = useState("");
  const [enCours, setEnCours] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!nom.trim()) return;
        setEnCours(true);
        try {
          await onValider(nom, couleur, description);
        } finally {
          setEnCours(false);
        }
      }}
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-airzen-primary">Nom du projet</span>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : Lancement formation Excel"
          autoFocus
          className="rounded-lg border border-airzen-neutral/60 px-3 py-2.5 text-airzen-primary outline-none focus:border-airzen-secondary"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-airzen-primary">Couleur</span>
        <div className="flex gap-2">
          {COULEURS_PROJET.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCouleur(c)}
              aria-label={`Couleur ${c}`}
              className={`h-7 w-7 rounded-full transition-transform ${
                couleur === c ? "ring-2 ring-airzen-primary ring-offset-2" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-airzen-primary">Description (optionnelle)</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-lg border border-airzen-neutral/60 px-3 py-2 text-airzen-primary outline-none focus:border-airzen-secondary"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enCours || !nom.trim()}
          className="rounded-full bg-airzen-accent px-5 py-2.5 font-semibold text-airzen-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enCours ? "Création…" : "Créer le projet"}
        </button>
        <button
          type="button"
          onClick={onAnnuler}
          className="text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

const LIBELLE_STATUT: Record<Projet["statut"], string> = {
  actif: "Actif",
  en_pause: "En pause",
  termine: "Terminé",
  archive: "Archivé",
};

function GestionProjets() {
  const { projets, chargement, creer, changerStatut, supprimer } = useProjets();
  const { taches } = useTaches();
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  const compteParProjet = useMemo(() => {
    const compte = new Map<string, number>();
    for (const t of taches) {
      if (t.projetId && t.statut !== "terminee" && t.statut !== "annulee") {
        compte.set(t.projetId, (compte.get(t.projetId) ?? 0) + 1);
      }
    }
    return compte;
  }, [taches]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-airzen-primary">Mes projets</h1>
        {!formulaireOuvert && (
          <button
            type="button"
            onClick={() => setFormulaireOuvert(true)}
            className="rounded-full bg-airzen-accent px-4 py-2 text-sm font-semibold text-airzen-primary transition-opacity hover:opacity-90"
          >
            + Nouveau projet
          </button>
        )}
      </div>

      {formulaireOuvert && (
        <FormulaireProjet
          onValider={async (nom, couleur, description) => {
            await creer({ nom, couleur, description });
            setFormulaireOuvert(false);
          }}
          onAnnuler={() => setFormulaireOuvert(false)}
        />
      )}

      {chargement ? (
        <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
      ) : projets.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-light text-airzen-secondary">
            Aucun projet. Créez-en un pour regrouper vos tâches 🗂️
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projets.map((p) => {
            const compte = compteParProjet.get(p.id) ?? 0;
            return (
              <article key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: p.couleur }}
                    />
                    <div>
                      <h3 className="font-medium text-airzen-primary">{p.nom}</h3>
                      {p.description && (
                        <p className="mt-0.5 text-sm font-light text-airzen-secondary">
                          {p.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-airzen-neutral">
                        {LIBELLE_STATUT[p.statut]} ·{" "}
                        {compte === 0
                          ? "aucune tâche en cours"
                          : `${compte} tâche${compte > 1 ? "s" : ""} en cours`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <Link
                    href={`/taches?projet=${p.id}`}
                    className="font-medium text-airzen-secondary hover:text-airzen-primary"
                  >
                    Voir les tâches →
                  </Link>
                  {p.statut === "actif" ? (
                    <button
                      type="button"
                      onClick={() => changerStatut(p.id, "archive")}
                      className="text-airzen-neutral hover:text-airzen-secondary"
                    >
                      Archiver
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => changerStatut(p.id, "actif")}
                      className="text-airzen-neutral hover:text-airzen-secondary"
                    >
                      Réactiver
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => supprimer(p.id)}
                    className="text-airzen-neutral hover:text-q1"
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PageProjets() {
  return (
    <RequireAuth>
      <AppShell>
        <GestionProjets />
      </AppShell>
    </RequireAuth>
  );
}
