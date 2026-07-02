"use client";

// Étape 8 — Vue "journée proposée" : planification automatique INDICATIVE.
// Les créneaux Google Agenda apparaissent en gris, les tâches proposées en
// couleur de quadrant. Rien n'est écrit dans Google Agenda (lecture seule).
import { useMemo } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { useTaches } from "@/lib/hooks/useTaches";
import { useOccupations, type Occupation } from "@/lib/hooks/useOccupations";
import { deduireEnergieMoment } from "@/lib/energie";
import { calculerSuggestions } from "@/lib/matching";
import { QUADRANTS } from "@/lib/eisenhower";
import { formatDuree, tsEnDate } from "@/lib/format";
import type { Tache } from "@/lib/types";

interface Bloc {
  debut: Date;
  fin: Date;
  type: "occupe" | "tache" | "libre";
  tache?: Tache;
}

function heureCourte(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function aujourdhuiA(heures: number, minutes: number): Date {
  const d = new Date();
  d.setHours(heures, minutes, 0, 0);
  return d;
}

/** Fusionne les occupations qui se chevauchent, bornées à la fenêtre de travail. */
function fusionnerOccupations(occupations: Occupation[], debut: Date, fin: Date): Occupation[] {
  const bornees = occupations
    .map((o) => ({
      debut: new Date(Math.max(o.debut.getTime(), debut.getTime())),
      fin: new Date(Math.min(o.fin.getTime(), fin.getTime())),
    }))
    .filter((o) => o.fin.getTime() > o.debut.getTime())
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());

  const fusion: Occupation[] = [];
  for (const o of bornees) {
    const dernier = fusion[fusion.length - 1];
    if (dernier && o.debut.getTime() <= dernier.fin.getTime()) {
      if (o.fin.getTime() > dernier.fin.getTime()) dernier.fin = o.fin;
    } else {
      fusion.push({ ...o });
    }
  }
  return fusion;
}

function PagePlanningContenu() {
  const { profilsEnergie } = useAuth();
  const { taches, chargement } = useTaches();
  const { occupations, connecte } = useOccupations();

  const plan = useMemo(() => {
    // Fenêtre de travail : bornes des créneaux d'énergie (défaut 8h-19h).
    const heures = profilsEnergie.map((p) => p.heureDebut).sort();
    const fins = profilsEnergie.map((p) => p.heureFin).sort();
    const [hd, md] = (heures[0] ?? "08:00").split(":").map(Number);
    const [hf, mf] = (fins[fins.length - 1] ?? "19:00").split(":").map(Number);
    const debutFenetre = aujourdhuiA(hd, md);
    const finFenetre = aujourdhuiA(hf, mf);

    const maintenant = new Date();
    const depart = maintenant.getTime() > debutFenetre.getTime() ? maintenant : debutFenetre;
    if (depart.getTime() >= finFenetre.getTime()) {
      return { blocs: [] as Bloc[], journeeFinie: true };
    }

    const occupes = fusionnerOccupations(occupations ?? [], depart, finFenetre);

    // Tâches candidates : actives, de premier niveau.
    let restantes = taches
      .filter((t) => t.statut === "a_faire" || t.statut === "en_cours")
      .filter((t) => !t.tacheParenteId)
      .map((t) => ({ ...t, echeanceDate: tsEnDate(t.dateEcheance) }));

    const blocs: Bloc[] = [];
    let curseur = new Date(depart);

    const bornesLibres: { debut: Date; fin: Date }[] = [];
    for (const o of occupes) {
      if (o.debut.getTime() > curseur.getTime()) {
        bornesLibres.push({ debut: new Date(curseur), fin: new Date(o.debut) });
      }
      blocs.push({ debut: o.debut, fin: o.fin, type: "occupe" });
      curseur = new Date(Math.max(curseur.getTime(), o.fin.getTime()));
    }
    if (curseur.getTime() < finFenetre.getTime()) {
      bornesLibres.push({ debut: new Date(curseur), fin: new Date(finFenetre) });
    }

    // Remplissage glouton de chaque créneau libre selon le matching.
    for (const libre of bornesLibres) {
      let t = new Date(libre.debut);
      while (true) {
        const minutesRestantes = Math.floor((libre.fin.getTime() - t.getTime()) / 60000);
        if (minutesRestantes < 15 || restantes.length === 0) break;
        const energie = deduireEnergieMoment(profilsEnergie, t);
        const [meilleure] = calculerSuggestions(restantes, energie, minutesRestantes, 1, t);
        if (!meilleure) break;
        const fin = new Date(t.getTime() + meilleure.tache.dureeEstimeeMinutes * 60000);
        blocs.push({ debut: new Date(t), fin, type: "tache", tache: meilleure.tache });
        restantes = restantes.filter((r) => r.id !== meilleure.tache.id);
        t = fin;
      }
      if (t.getTime() < libre.fin.getTime()) {
        blocs.push({ debut: new Date(t), fin: new Date(libre.fin), type: "libre" });
      }
    }

    blocs.sort((a, b) => a.debut.getTime() - b.debut.getTime());
    return { blocs, journeeFinie: false };
  }, [profilsEnergie, taches, occupations]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-airzen-primary">Ma journée proposée</h1>
        <p className="mt-1 text-sm font-light text-airzen-secondary">
          Une proposition indicative pour le reste de la journée — vous gardez la main.
          Rien n&apos;est écrit dans votre agenda.
        </p>
      </div>

      {!connecte && (
        <p className="rounded-2xl bg-white p-4 text-sm font-light text-airzen-secondary shadow-sm">
          💡 Connectez Google Agenda dans les{" "}
          <Link href="/parametres" className="font-medium underline underline-offset-2">
            Réglages
          </Link>{" "}
          pour que vos rendez-vous soient pris en compte.
        </p>
      )}

      {chargement ? (
        <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
      ) : plan.journeeFinie ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-light text-airzen-secondary">
            La journée de travail touche à sa fin. Reposez-vous, demain est un autre
            jour 🌙
          </p>
        </div>
      ) : plan.blocs.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-light text-airzen-secondary">
            Rien à planifier pour l&apos;instant. Ajoutez des tâches pour voir une
            proposition de journée.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {plan.blocs.map((bloc, i) => (
            <li key={i} className="flex items-stretch gap-3">
              <div className="w-14 shrink-0 pt-3 text-right text-xs text-airzen-neutral">
                {heureCourte(bloc.debut)}
              </div>
              {bloc.type === "occupe" ? (
                <div className="flex-1 rounded-xl bg-airzen-neutral/25 px-4 py-3">
                  <p className="text-sm font-medium text-airzen-secondary">
                    Occupé (agenda)
                  </p>
                  <p className="text-xs text-airzen-neutral">
                    jusqu&apos;à {heureCourte(bloc.fin)}
                  </p>
                </div>
              ) : bloc.type === "tache" && bloc.tache ? (
                <div
                  className="flex-1 rounded-xl bg-white px-4 py-3 shadow-sm"
                  style={{
                    borderLeft: `4px solid ${QUADRANTS[bloc.tache.quadrantEisenhower].couleur}`,
                  }}
                >
                  <p className="text-sm font-medium text-airzen-primary">
                    {bloc.tache.titre}
                  </p>
                  <p className="text-xs text-airzen-secondary">
                    {formatDuree(bloc.tache.dureeEstimeeMinutes)} ·{" "}
                    {QUADRANTS[bloc.tache.quadrantEisenhower].label}
                  </p>
                </div>
              ) : (
                <div className="flex-1 rounded-xl border border-dashed border-airzen-neutral/40 px-4 py-3">
                  <p className="text-xs font-light text-airzen-neutral">
                    Temps libre — jusqu&apos;à {heureCourte(bloc.fin)}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* Nombre de minutes de la fenetre : indicatif seulement */}
      <p className="text-xs font-light text-airzen-neutral">
        Proposition recalculée à chaque visite, selon vos tâches, votre énergie et votre
        agenda du moment.
      </p>
    </div>
  );
}

export default function PagePlanning() {
  return (
    <RequireAuth>
      <AppShell>
        <PagePlanningContenu />
      </AppShell>
    </RequireAuth>
  );
}
