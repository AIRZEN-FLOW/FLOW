"use client";

// Tableau de bord — vue d'ensemble (nouvel écran d'accueil, voir "AIR ZEN
// Flow.dc.html"). Le fil de suggestions "Aujourd'hui" a déménagé vers
// /aujourdhui ; cet écran donne une vue d'ensemble jour/semaine/mois.
import { useMemo, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { CarteTache } from "@/components/CarteTache";
import { useAuth } from "@/components/AuthProvider";
import { useTaches } from "@/lib/hooks/useTaches";
import { useProjets } from "@/lib/hooks/useProjets";
import { usePreferenceLocale } from "@/lib/hooks/usePreferenceLocale";
import {
  calculerStatsPeriode,
  compterTachesParPeriode,
  type PeriodeTableauBord,
} from "@/lib/dashboard";
import { QUADRANTS } from "@/lib/eisenhower";
import { formatDuree } from "@/lib/format";
import { IconeCalendrier } from "@/components/icones";
import type { Quadrant, Tache } from "@/lib/types";

const OPTIONS_PERIODE: { valeur: PeriodeTableauBord; label: string }[] = [
  { valeur: "jour", label: "Jour" },
  { valeur: "semaine", label: "Semaine" },
  { valeur: "mois", label: "Mois" },
];

const ORDRE_QUADRANTS: Quadrant[] = ["q1", "q2", "q3", "q4"];
const CLE_VUE_EISENHOWER = "airzen-dashboard-vue-eisenhower";

function TableauDeBord() {
  const { profilsEnergie } = useAuth();
  const { taches, chargement: chargementTaches } = useTaches();
  const { projets, chargement: chargementProjets } = useProjets();
  const [periode, setPeriode] = useState<PeriodeTableauBord>("semaine");
  const [vueEisenhower, setVueEisenhower] = usePreferenceLocale(CLE_VUE_EISENHOWER, false);

  const stats = useMemo(
    () => calculerStatsPeriode(taches, profilsEnergie, periode),
    [taches, profilsEnergie, periode],
  );

  const comptes = useMemo(() => compterTachesParPeriode(taches), [taches]);

  const tachesPeriode = stats.taches;
  const parQuadrantPeriode = useMemo(() => {
    const groupes: Record<Quadrant, Tache[]> = { q1: [], q2: [], q3: [], q4: [] };
    for (const t of tachesPeriode) groupes[t.quadrantEisenhower].push(t);
    return groupes;
  }, [tachesPeriode]);

  const quadrantTotal = Math.max(
    1,
    stats.quadrants.q1 + stats.quadrants.q2 + stats.quadrants.q3 + stats.quadrants.q4,
  );
  const p1 = (stats.quadrants.q1 / quadrantTotal) * 100;
  const p2 = p1 + (stats.quadrants.q2 / quadrantTotal) * 100;
  const p3 = p2 + (stats.quadrants.q3 / quadrantTotal) * 100;

  const projetsActifs = useMemo(() => {
    const parProjet = new Map<string, { total: number; termine: number }>();
    for (const t of taches) {
      if (!t.projetId || t.statut === "annulee") continue;
      const c = parProjet.get(t.projetId) ?? { total: 0, termine: 0 };
      c.total++;
      if (t.statut === "terminee") c.termine++;
      parProjet.set(t.projetId, c);
    }
    return projets
      .filter((p) => p.statut === "actif")
      .map((p) => {
        const c = parProjet.get(p.id) ?? { total: 0, termine: 0 };
        return {
          projet: p,
          pct: c.total > 0 ? Math.round((c.termine / c.total) * 100) : 0,
        };
      });
  }, [projets, taches]);

  const chargement = chargementTaches || chargementProjets;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-airzen-primary sm:text-[27px]">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm font-light text-airzen-secondary">{stats.sousTitre}</p>
        </div>
        <div className="flex gap-1.5 rounded-full bg-white p-1 shadow-sm">
          {OPTIONS_PERIODE.map((o) => (
            <button
              key={o.valeur}
              type="button"
              onClick={() => setPeriode(o.valeur)}
              className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors ${
                periode === o.valeur
                  ? "bg-airzen-primary text-white"
                  : "text-airzen-secondary hover:bg-airzen-bg"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2.5">
          {[
            { label: "aujourd'hui", val: comptes.jour },
            { label: "cette semaine", val: comptes.semaine },
            { label: "ce mois-ci", val: comptes.mois },
          ].map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 shadow-sm"
            >
              <IconeCalendrier className="h-3.5 w-3.5 text-airzen-secondary" />
              <span className="text-sm font-bold text-airzen-primary">{c.val}</span>
              <span className="text-xs text-airzen-secondary">{c.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 rounded-full bg-white p-1 shadow-sm">
          {(
            [
              { valeur: false, label: "Vue résumé" },
              { valeur: true, label: "Vue Eisenhower" },
            ] as const
          ).map((o) => (
            <button
              key={String(o.valeur)}
              type="button"
              onClick={() => setVueEisenhower(o.valeur)}
              className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors ${
                vueEisenhower === o.valeur
                  ? "bg-airzen-primary text-white"
                  : "text-airzen-secondary hover:bg-airzen-bg"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {chargement ? (
        <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
      ) : vueEisenhower ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ORDRE_QUADRANTS.map((q) => {
            const liste = parQuadrantPeriode[q];
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
                    {liste.length} tâche{liste.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {liste.length === 0 ? (
                    <p className="px-1 text-xs font-light text-airzen-neutral">
                      Rien ici pour l&apos;instant.
                    </p>
                  ) : (
                    liste.map((t) => <CarteTache key={t.id} tache={t} mode="priorite" />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
            <div className="flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-[13px] font-semibold text-airzen-primary">
                Temps planifié vs disponible
              </p>
              <p className="text-xs text-airzen-secondary">{stats.planLabel}</p>
              <div className="mt-1.5 flex h-14 items-end gap-1.5">
                {stats.bars.map((b, i) => (
                  <div
                    key={i}
                    className="relative h-full flex-1 rounded bg-airzen-bg"
                    title={b.label}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded bg-airzen-secondary"
                      style={{ height: `${Math.max(4, b.hauteur)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                {stats.bars.map((b, i) => (
                  <span key={i} className="flex-1 text-center text-[10px] text-airzen-neutral">
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-[18px] shadow-sm">
              <div
                className="flex h-[104px] w-[104px] items-center justify-center rounded-full"
                style={{
                  background:
                    stats.totalTaches > 0
                      ? `conic-gradient(${QUADRANTS.q1.couleur} 0% ${p1}%, ${QUADRANTS.q2.couleur} ${p1}% ${p2}%, ${QUADRANTS.q3.couleur} ${p2}% ${p3}%, ${QUADRANTS.q4.couleur} ${p3}% 100%)`
                      : "#F5F7F8",
                }}
              >
                <div className="flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-lg font-bold text-airzen-primary">
                    {stats.totalTaches}
                  </span>
                  <span className="text-[10px] text-airzen-secondary">tâches</span>
                </div>
              </div>
              <p className="text-center text-xs font-semibold text-airzen-primary">
                Répartition Eisenhower
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {(["q1", "q2", "q3", "q4"] as const).map((q) => (
                  <span key={q} className="text-[10px] text-airzen-secondary">
                    <span
                      className="mr-0.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                      style={{ backgroundColor: QUADRANTS[q].couleur }}
                    />
                    {QUADRANTS[q].court} {stats.quadrants[q]}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white p-[18px] shadow-sm">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#EDC426 0% ${stats.completionPct}%, #F5F7F8 ${stats.completionPct}% 100%)`,
                }}
              >
                <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-white text-[19px] font-bold text-airzen-primary">
                  {stats.completionPct}%
                </div>
              </div>
              <p className="text-center text-xs font-semibold text-airzen-primary">
                {stats.completionLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-[13px] font-semibold text-airzen-primary">Projets actifs</p>
            {projetsActifs.length === 0 ? (
              <p className="text-sm font-light text-airzen-secondary">
                Aucun projet actif pour l&apos;instant.{" "}
                <Link href="/projets" className="font-medium underline underline-offset-2">
                  En créer un
                </Link>
              </p>
            ) : (
              projetsActifs.map(({ projet, pct }) => (
                <Link
                  key={projet.id}
                  href={`/projets/${projet.id}`}
                  className="flex items-center gap-3 rounded-xl px-1 py-1 transition-colors hover:bg-airzen-bg"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: projet.couleur }}
                  />
                  <span className="flex-1 truncate text-[13px] text-airzen-primary">
                    {projet.nom}
                  </span>
                  <div className="h-1.5 w-28 shrink-0 rounded-full bg-airzen-bg">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: projet.couleur }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs text-airzen-secondary">
                    {pct}%
                  </span>
                </Link>
              ))
            )}
          </div>

          {stats.planifieMinutes > 0 && (
            <p className="text-xs font-light text-airzen-neutral">
              Basé sur les tâches dont l&apos;échéance tombe {periode === "jour" ? "aujourd'hui" : periode === "semaine" ? "cette semaine" : "ce mois-ci"}
              {" "}({formatDuree(stats.planifieMinutes)} au total).
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <AppShell>
        <TableauDeBord />
      </AppShell>
    </RequireAuth>
  );
}
