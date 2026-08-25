"use client";

// Étape 5 — Projets : regrouper des tâches autour d'un objectif commun.
import { useMemo, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useProjets } from "@/lib/hooks/useProjets";
import { useTaches } from "@/lib/hooks/useTaches";
import { COULEURS_PROJET } from "@/lib/data/projets";
import { QUADRANTS } from "@/lib/eisenhower";
import { IconeCrayon } from "@/components/icones";
import type { Projet, Quadrant, Tache } from "@/lib/types";

const ORDRE_QUADRANTS: Quadrant[] = ["q1", "q2", "q3", "q4"];

function FormulaireProjet({
  onValider,
  onAnnuler,
  valeursInitiales,
}: {
  onValider: (nom: string, couleur: string, description: string) => Promise<void>;
  onAnnuler: () => void;
  valeursInitiales?: Projet;
}) {
  const [nom, setNom] = useState(valeursInitiales?.nom ?? "");
  const [couleur, setCouleur] = useState(valeursInitiales?.couleur ?? COULEURS_PROJET[0]);
  const [description, setDescription] = useState(valeursInitiales?.description ?? "");
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
          spellCheck
          lang="fr"
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
        <p className="text-xs font-light text-airzen-secondary">
          Cette couleur identifiera ce projet partout dans l&apos;app (tâches, planning,
          tuiles) — un simple repère visuel, pas de sens caché : choisissez celle qui vous
          parle le plus pour ce projet.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-airzen-primary">Description (optionnelle)</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          spellCheck
          lang="fr"
          className="rounded-lg border border-airzen-neutral/60 px-3 py-2 text-airzen-primary outline-none focus:border-airzen-secondary"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enCours || !nom.trim()}
          className="rounded-full bg-airzen-accent px-5 py-2.5 font-semibold text-airzen-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : valeursInitiales ? "Enregistrer" : "Créer le projet"}
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

// Rattacher des tâches déjà existantes à un projet (créées avant lui, ou mal
// classées) : liste cochable avec recherche, rattachement en un seul geste.
function SelecteurTachesExistantes({
  candidates,
  projetParId,
  onValider,
  onAnnuler,
}: {
  candidates: Tache[];
  projetParId: Map<string, Projet>;
  onValider: (ids: string[]) => Promise<void>;
  onAnnuler: () => void;
}) {
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [recherche, setRecherche] = useState("");
  const [enCours, setEnCours] = useState(false);

  const filtrees = candidates.filter((t) =>
    t.titre.toLowerCase().includes(recherche.trim().toLowerCase()),
  );

  function basculer(id: string) {
    setSelection((prev) => {
      const suivante = new Set(prev);
      if (suivante.has(id)) suivante.delete(id);
      else suivante.add(id);
      return suivante;
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-airzen-primary">
        Rattacher des tâches déjà existantes
      </p>

      {candidates.length === 0 ? (
        <p className="text-sm font-light text-airzen-secondary">
          Toutes vos autres tâches sont déjà dans ce projet.
        </p>
      ) : (
        <>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une tâche…"
            className="rounded-lg border border-airzen-neutral/60 px-3 py-2 text-sm text-airzen-primary outline-none focus:border-airzen-secondary"
          />

          {filtrees.length === 0 ? (
            <p className="text-sm font-light text-airzen-secondary">
              Aucune tâche ne correspond.
            </p>
          ) : (
            <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
              {filtrees.map((t) => {
                const autreProjet = t.projetId ? projetParId.get(t.projetId) : undefined;
                return (
                  <li key={t.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-airzen-bg">
                      <input
                        type="checkbox"
                        checked={selection.has(t.id)}
                        onChange={() => basculer(t.id)}
                        className="h-4 w-4 shrink-0 accent-airzen-primary"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-airzen-primary">
                        {t.titre}
                      </span>
                      {autreProjet && (
                        <span className="shrink-0 text-xs text-airzen-neutral">
                          déjà dans « {autreProjet.nom} »
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <div className="flex items-center gap-3">
        {candidates.length > 0 && (
          <button
            type="button"
            disabled={selection.size === 0 || enCours}
            onClick={async () => {
              setEnCours(true);
              try {
                await onValider([...selection]);
              } finally {
                setEnCours(false);
              }
            }}
            className="rounded-full bg-airzen-accent px-4 py-2 text-sm font-semibold text-airzen-primary transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {enCours
              ? "Rattachement…"
              : selection.size === 0
                ? "Rattacher"
                : `Rattacher ${selection.size} tâche${selection.size > 1 ? "s" : ""}`}
          </button>
        )}
        <button
          type="button"
          onClick={onAnnuler}
          disabled={enCours}
          className="text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

const LIBELLE_STATUT: Record<Projet["statut"], string> = {
  actif: "Actif",
  en_pause: "En pause",
  termine: "Terminé",
  archive: "Archivé",
};

function GestionProjets() {
  const { projets, chargement, creer, modifier, changerStatut, supprimer } = useProjets();
  const { taches, rattacherAuProjet } = useTaches();
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  // Un seul panneau de rattachement ouvert à la fois (id du projet concerné).
  const [projetPourRattachement, setProjetPourRattachement] = useState<string | null>(
    null,
  );
  // Édition d'un projet existant (mutuellement exclusif avec le rattachement).
  const [projetEnEdition, setProjetEnEdition] = useState<Projet | null>(null);

  // Répartition par quadrant des tâches en cours de chaque projet — pour
  // repérer d'un coup d'œil un projet qui n'avance que sur du non-prioritaire.
  const repartitionParProjet = useMemo(() => {
    const repartition = new Map<string, Record<Quadrant, number>>();
    for (const t of taches) {
      if (!t.projetId || t.statut === "terminee" || t.statut === "annulee") continue;
      const courant = repartition.get(t.projetId) ?? { q1: 0, q2: 0, q3: 0, q4: 0 };
      courant[t.quadrantEisenhower]++;
      repartition.set(t.projetId, courant);
    }
    return repartition;
  }, [taches]);

  const projetParId = useMemo(() => new Map(projets.map((p) => [p.id, p])), [projets]);

  // Tâches candidates au rattachement : tout sauf celles déjà dans CE projet,
  // et hors sous-tâches (elles suivent leur tâche mère), tâches annulées et
  // tâches déjà terminées (rien à faire d'utile en les rattachant).
  function candidatesPour(projetId: string): Tache[] {
    return taches.filter(
      (t) =>
        t.projetId !== projetId &&
        !t.tacheParenteId &&
        t.statut !== "annulee" &&
        t.statut !== "terminee",
    );
  }

  function ouvrirEditionProjet(p: Projet) {
    setProjetPourRattachement(null);
    setProjetEnEdition(p);
  }

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
            const repartition = repartitionParProjet.get(p.id) ?? {
              q1: 0,
              q2: 0,
              q3: 0,
              q4: 0,
            };
            const compte = repartition.q1 + repartition.q2 + repartition.q3 + repartition.q4;
            const detailQuadrants = ORDRE_QUADRANTS.filter((q) => repartition[q] > 0)
              .map((q) => `${repartition[q]} tâche${repartition[q] > 1 ? "s" : ""} ${QUADRANTS[q].court}`)
              .join(" · ");
            return (
              <article key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
                {projetEnEdition?.id === p.id ? (
                  <FormulaireProjet
                    valeursInitiales={p}
                    onValider={async (nom, couleur, description) => {
                      await modifier(p.id, { nom, couleur, description });
                      setProjetEnEdition(null);
                    }}
                    onAnnuler={() => setProjetEnEdition(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-1 h-4 w-4 shrink-0 rounded-full"
                          style={{ backgroundColor: p.couleur }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => ouvrirEditionProjet(p)}
                              className="truncate text-left font-medium text-airzen-primary hover:underline"
                              title="Modifier le nom, la couleur ou la description"
                            >
                              {p.nom}
                            </button>
                            <button
                              type="button"
                              onClick={() => ouvrirEditionProjet(p)}
                              aria-label="Modifier le projet"
                              title="Modifier le nom, la couleur ou la description"
                              className="shrink-0 rounded-full p-1 text-airzen-neutral transition-colors hover:bg-airzen-bg hover:text-airzen-secondary"
                            >
                              <IconeCrayon className="h-3.5 w-3.5" />
                            </button>
                          </div>
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
                          {detailQuadrants && (
                            <p className="mt-0.5 text-xs text-airzen-neutral">
                              {detailQuadrants}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                      <Link
                        href={`/projets/${p.id}`}
                        className="font-medium text-airzen-secondary hover:text-airzen-primary"
                      >
                        Voir le projet →
                      </Link>
                      <Link
                        href={`/taches?projet=${p.id}&nouvelle=1`}
                        className="font-medium text-airzen-primary hover:underline"
                      >
                        + Nouvelle tâche
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setProjetPourRattachement((actuel) =>
                            actuel === p.id ? null : p.id,
                          )
                        }
                        className="font-medium text-airzen-primary hover:underline"
                      >
                        {projetPourRattachement === p.id
                          ? "Fermer"
                          : "+ Tâches existantes"}
                      </button>
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
                        onClick={() => {
                          if (
                            window.confirm(
                              `Supprimer le projet « ${p.nom} » ? Les tâches déjà créées ne seront pas supprimées, mais elles perdront leur rattachement à ce projet.`,
                            )
                          ) {
                            supprimer(p.id);
                          }
                        }}
                        className="text-airzen-neutral hover:text-q1"
                      >
                        Supprimer
                      </button>
                    </div>

                    {projetPourRattachement === p.id && (
                      <div className="mt-3">
                        <SelecteurTachesExistantes
                          candidates={candidatesPour(p.id)}
                          projetParId={projetParId}
                          onValider={async (ids) => {
                            await rattacherAuProjet(ids, p.id);
                            setProjetPourRattachement(null);
                          }}
                          onAnnuler={() => setProjetPourRattachement(null)}
                        />
                      </div>
                    )}
                  </>
                )}
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
