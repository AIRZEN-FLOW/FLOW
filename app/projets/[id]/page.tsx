"use client";

// Fiche projet — vue détaillée (voir "AIR ZEN Flow.dc.html") : avancement,
// répartition par priorité/énergie, notes, et bascule Liste / Kanban / Gantt.
// Le Kanban s'appuie sur `statut` (a_faire / en_cours / terminee) et le Gantt
// est dérivé des vraies dates des tâches (création → échéance) — pas de
// planification fictive, seulement ce que l'utilisatrice a renseigné.
import { use, useMemo, useState, type DragEvent } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { CarteTache } from "@/components/CarteTache";
import { FormulaireTache } from "@/components/FormulaireTache";
import { CalendrierMois } from "@/components/calendrier/CalendrierMois";
import { useProjets } from "@/lib/hooks/useProjets";
import { useTaches } from "@/lib/hooks/useTaches";
import { QUADRANTS, estUrgente } from "@/lib/eisenhower";
import { formatDureeCourt, formatEcheanceCourt, tsEnDate } from "@/lib/format";
import { useAuth } from "@/components/AuthProvider";
import { IconeGlisser } from "@/components/icones";
import type { Quadrant, SaisieTache, StatutTache, Tache } from "@/lib/types";

const ORDRE_QUADRANTS: Quadrant[] = ["q1", "q2", "q3", "q4"];
const NIVEAUX_ENERGIE = ["haute", "moyenne", "basse"] as const;
const COULEUR_ENERGIE: Record<(typeof NIVEAUX_ENERGIE)[number], string> = {
  haute: "#76939D",
  moyenne: "#EDC426",
  basse: "#B3BEC4",
};

const COLONNES_KANBAN: { statut: StatutTache; label: string }[] = [
  { statut: "a_faire", label: "À faire" },
  { statut: "en_cours", label: "En cours" },
  { statut: "terminee", label: "Terminé" },
];

type VueProjet = "liste" | "kanban" | "gantt" | "calendrier";

function VueGantt({
  taches,
  seuilUrgenceJours,
  onReordonner,
}: {
  taches: Tache[];
  seuilUrgenceJours: number;
  onReordonner: (idsEnOrdre: string[]) => void;
}) {
  const [idEnCoursDeDrag, setIdEnCoursDeDrag] = useState<string | null>(null);

  const lignes = useMemo(() => {
    return taches
      .map((t) => {
        const fin = tsEnDate(t.dateEcheance);
        if (!fin) return null;
        const debut = tsEnDate(t.creeLe) ?? fin;
        return { tache: t, debut: debut.getTime() <= fin.getTime() ? debut : fin, fin };
      })
      .filter((l): l is { tache: Tache; debut: Date; fin: Date } => l !== null)
      .sort((a, b) => (a.tache.ordre ?? 0) - (b.tache.ordre ?? 0));
  }, [taches]);

  if (lignes.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="font-light text-airzen-secondary">
          Ajoutez une échéance à vos tâches pour voir le planning du projet.
        </p>
      </div>
    );
  }

  const debutMin = Math.min(...lignes.map((l) => l.debut.getTime()));
  const finBrute = Math.max(...lignes.map((l) => l.fin.getTime()));
  const jourMs = 24 * 60 * 60 * 1000;
  const finMax = Math.max(finBrute, debutMin + jourMs) + jourMs; // petit padding visuel
  const total = finMax - debutMin;
  const nbJours = Math.min(14, Math.max(5, Math.round(total / jourMs)));

  function surDepot(idCible: string) {
    if (!idEnCoursDeDrag || idEnCoursDeDrag === idCible) {
      setIdEnCoursDeDrag(null);
      return;
    }
    const ids = lignes.map((l) => l.tache.id);
    const source = ids.indexOf(idEnCoursDeDrag);
    const cible = ids.indexOf(idCible);
    ids.splice(source, 1);
    ids.splice(cible, 0, idEnCoursDeDrag);
    onReordonner(ids);
    setIdEnCoursDeDrag(null);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs font-light text-airzen-neutral">
        Glissez une tâche par sa poignée pour réordonner. La bordure terracotta signale
        une échéance urgente.
      </p>
      <div className="flex gap-0 pl-[184px]">
        {Array.from({ length: nbJours }, (_, i) => {
          const d = new Date(debutMin + (total / nbJours) * i);
          return (
            <span key={i} className="flex-1 text-center text-[10px] text-airzen-neutral">
              {d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
          );
        })}
      </div>
      <div className="flex flex-col gap-3">
        {lignes.map(({ tache, debut, fin }) => {
          const left = ((debut.getTime() - debutMin) / total) * 100;
          const width = Math.max(3, ((fin.getTime() - debut.getTime()) / total) * 100);
          const urgente = estUrgente(fin, seuilUrgenceJours);
          return (
            <div
              key={tache.id}
              draggable
              onDragStart={() => setIdEnCoursDeDrag(tache.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => surDepot(tache.id)}
              className={`flex items-center gap-2 ${
                idEnCoursDeDrag === tache.id ? "opacity-50" : ""
              }`}
            >
              <IconeGlisser className="h-4 w-4 shrink-0 cursor-grab text-airzen-neutral" />
              <span
                className="w-32 shrink-0 truncate text-[12.5px] font-medium text-airzen-primary"
                title={tache.titre}
              >
                {tache.titre}
              </span>
              <div
                className="relative h-[26px] flex-1 rounded-md"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, rgba(179,190,196,0.25), rgba(179,190,196,0.25) 1px, transparent 1px, transparent 10%)",
                }}
              >
                <div
                  className="absolute top-[3px] flex h-5 items-center justify-end overflow-hidden rounded-md px-1.5"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: QUADRANTS[tache.quadrantEisenhower].couleur,
                    border: urgente ? "2px solid #C97064" : undefined,
                  }}
                  title={`${formatEcheanceCourt(fin) ?? ""} · ${formatDureeCourt(tache.dureeEstimeeMinutes)}`}
                >
                  <span className="truncate text-[10px] font-semibold text-white">
                    {formatDureeCourt(tache.dureeEstimeeMinutes)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VueKanban({
  taches,
  onDeplacer,
}: {
  taches: Tache[];
  onDeplacer: (id: string, statut: StatutTache) => void;
}) {
  const [idEnCoursDeDrag, setIdEnCoursDeDrag] = useState<string | null>(null);

  function surDepot(e: DragEvent<HTMLDivElement>, statut: StatutTache) {
    e.preventDefault();
    if (idEnCoursDeDrag) onDeplacer(idEnCoursDeDrag, statut);
    setIdEnCoursDeDrag(null);
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      {COLONNES_KANBAN.map((col) => {
        const tachesCol = taches.filter((t) => t.statut === col.statut);
        return (
          <div
            key={col.statut}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => surDepot(e, col.statut)}
            className="flex min-h-[220px] flex-col gap-2.5 rounded-2xl bg-airzen-bg p-3.5"
          >
            <p className="text-xs font-bold text-airzen-primary">
              {col.label} · {tachesCol.length}
            </p>
            {tachesCol.map((t) => (
              <div
                key={t.id}
                draggable
                onDragStart={() => setIdEnCoursDeDrag(t.id)}
                className="cursor-grab rounded-xl bg-white p-3 shadow-sm"
                style={{ borderLeft: `3px solid ${QUADRANTS[t.quadrantEisenhower].couleur}` }}
              >
                <p className="text-[12.5px] font-medium text-airzen-primary">{t.titre}</p>
                {t.dureeEstimeeMinutes && (
                  <p className="mt-1 text-[11px] text-airzen-secondary">
                    {t.dureeEstimeeMinutes >= 60
                      ? `${Math.round(t.dureeEstimeeMinutes / 60)} h`
                      : `${t.dureeEstimeeMinutes} min`}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function FicheProjet({ projetId }: { projetId: string }) {
  const { utilisateur } = useAuth();
  const { projets, chargement: chargementProjets } = useProjets();
  const {
    taches,
    chargement: chargementTaches,
    terminer,
    rouvrir,
    changerStatut,
    demarrerChrono,
    mettreEnPauseChrono,
    modifier,
    reordonnerTaches,
  } = useTaches();
  const [vue, setVue] = useState<VueProjet>("liste");
  const [tacheEnEdition, setTacheEnEdition] = useState<Tache | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const seuilUrgenceJours = utilisateur?.seuilUrgenceJours ?? 3;

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

  const projet = projets.find((p) => p.id === projetId);
  const tachesProjet = useMemo(
    () => taches.filter((t) => t.projetId === projetId && t.statut !== "annulee"),
    [taches, projetId],
  );

  const total = tachesProjet.length;
  const termine = tachesProjet.filter((t) => t.statut === "terminee").length;
  const progressPct = total > 0 ? Math.round((termine / total) * 100) : 0;

  const parQuadrant = useMemo(() => {
    const c: Record<Quadrant, number> = { q1: 0, q2: 0, q3: 0, q4: 0 };
    for (const t of tachesProjet) c[t.quadrantEisenhower]++;
    return c;
  }, [tachesProjet]);

  const parEnergie = useMemo(() => {
    const c: Record<(typeof NIVEAUX_ENERGIE)[number], number> = {
      haute: 0,
      moyenne: 0,
      basse: 0,
    };
    for (const t of tachesProjet) c[t.niveauEnergieRequis]++;
    return c;
  }, [tachesProjet]);

  if (!chargementProjets && !projet) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/projets"
        className="w-fit text-xs font-medium text-airzen-secondary hover:text-airzen-primary"
      >
        ← Tous les projets
      </Link>

      {chargementProjets || !projet ? (
        <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: projet.couleur }}
            />
            <h1 className="text-xl font-bold text-airzen-primary sm:text-2xl">{projet.nom}</h1>
            <span className="rounded-full bg-airzen-secondary/20 px-3 py-1 text-xs font-semibold text-airzen-primary">
              {projet.statut === "actif"
                ? "Actif"
                : projet.statut === "en_pause"
                  ? "En pause"
                  : projet.statut === "termine"
                    ? "Terminé"
                    : "Archivé"}
            </span>
            <Link
              href={`/taches?projet=${projet.id}&nouvelle=1`}
              className="ml-auto rounded-full bg-airzen-accent px-4 py-2 text-sm font-semibold text-airzen-primary transition-opacity hover:opacity-90"
            >
              + Nouvelle tâche
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-airzen-primary">Avancement</span>
              <span className="text-[13px] font-bold text-airzen-primary">
                {progressPct}% · {termine}/{total} tâche{total > 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-airzen-bg">
              <div
                className="h-full rounded-full bg-airzen-accent transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2.5 text-xs font-semibold text-airzen-primary">Par priorité</p>
              {total === 0 ? (
                <p className="text-xs font-light text-airzen-secondary">Aucune tâche.</p>
              ) : (
                <>
                  <div className="flex h-2.5 overflow-hidden rounded-full">
                    {ORDRE_QUADRANTS.map((q) => (
                      <div
                        key={q}
                        style={{
                          width: `${(parQuadrant[q] / total) * 100}%`,
                          backgroundColor: QUADRANTS[q].couleur,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2.5">
                    {ORDRE_QUADRANTS.map((q) => (
                      <span key={q} className="text-[10px] text-airzen-secondary">
                        <span
                          className="mr-0.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                          style={{ backgroundColor: QUADRANTS[q].couleur }}
                        />
                        {QUADRANTS[q].court} {parQuadrant[q]}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2.5 text-xs font-semibold text-airzen-primary">
                Par énergie requise
              </p>
              {total === 0 ? (
                <p className="text-xs font-light text-airzen-secondary">Aucune tâche.</p>
              ) : (
                <>
                  <div className="flex h-2.5 overflow-hidden rounded-full">
                    {NIVEAUX_ENERGIE.map((n) => (
                      <div
                        key={n}
                        style={{
                          width: `${(parEnergie[n] / total) * 100}%`,
                          backgroundColor: COULEUR_ENERGIE[n],
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2.5">
                    {NIVEAUX_ENERGIE.map((n) => (
                      <span key={n} className="text-[10px] text-airzen-secondary">
                        <span
                          className="mr-0.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                          style={{ backgroundColor: COULEUR_ENERGIE[n] }}
                        />
                        {n.charAt(0).toUpperCase() + n.slice(1)} {parEnergie[n]}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {projet.description && (
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <p className="mb-1.5 text-xs font-semibold text-airzen-primary">Notes & objectifs</p>
              <p className="text-[13px] font-light italic leading-relaxed text-airzen-secondary">
                {projet.description}
              </p>
            </div>
          )}

          {tacheEnEdition && (
            <FormulaireTache
              valeursInitiales={tacheEnEdition}
              onValider={enregistrerModification}
              onAnnuler={() => setTacheEnEdition(null)}
              enCours={enregistrement}
              projets={projets}
            />
          )}

          <div className="flex w-fit flex-wrap gap-1.5 rounded-full bg-white p-1 shadow-sm">
            {(
              [
                { valeur: "liste", label: "Liste" },
                { valeur: "kanban", label: "Kanban" },
                { valeur: "gantt", label: "Gantt" },
                { valeur: "calendrier", label: "Calendrier" },
              ] as const
            ).map((o) => (
              <button
                key={o.valeur}
                type="button"
                onClick={() => setVue(o.valeur)}
                className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors ${
                  vue === o.valeur
                    ? "bg-airzen-primary text-white"
                    : "text-airzen-secondary hover:bg-airzen-bg"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {chargementTaches ? (
            <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
          ) : total === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="font-light text-airzen-secondary">
                Aucune tâche dans ce projet pour l&apos;instant.
              </p>
            </div>
          ) : vue === "liste" ? (
            <div className="flex flex-col gap-2.5">
              {tachesProjet.map((t) => (
                <CarteTache
                  key={t.id}
                  tache={t}
                  onModifier={setTacheEnEdition}
                  onTerminer={(t) => terminer(t.id)}
                  onRouvrir={(t) => rouvrir(t.id)}
                  onDemarrerChrono={(t) => demarrerChrono(t.id)}
                  onMettreEnPauseChrono={(t) => mettreEnPauseChrono(t.id)}
                />
              ))}
            </div>
          ) : vue === "kanban" ? (
            <VueKanban
              taches={tachesProjet}
              onDeplacer={(id, statut) => changerStatut(id, statut)}
            />
          ) : vue === "gantt" ? (
            <VueGantt
              taches={tachesProjet}
              seuilUrgenceJours={seuilUrgenceJours}
              onReordonner={reordonnerTaches}
            />
          ) : (
            <CalendrierMois mois={new Date()} taches={tachesProjet} onTacheClic={setTacheEnEdition} />
          )}
        </>
      )}
    </div>
  );
}

export default function PageFicheProjet({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <AppShell>
        <FicheProjet projetId={id} />
      </AppShell>
    </RequireAuth>
  );
}
