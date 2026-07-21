"use client";

// Étape 8 — Vue "journée proposée" : planification automatique INDICATIVE.
// Les créneaux Google Agenda apparaissent en gris, les tâches proposées en
// couleur de quadrant. Rien n'est écrit dans Google Agenda (lecture seule).
import { useMemo, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { MessageFinJournee } from "@/components/MessageFinJournee";
import { useTaches } from "@/lib/hooks/useTaches";
import { useHorloge } from "@/lib/hooks/useHorloge";
import { useEnergieMoment } from "@/lib/hooks/useEnergieMoment";
import { useOccupations } from "@/lib/hooks/useOccupations";
import { usePlanJournee } from "@/lib/hooks/usePlanJournee";
import { QUADRANTS } from "@/lib/eisenhower";
import { formatDuree } from "@/lib/format";

function heureCourte(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function PagePlanningContenu() {
  const { utilisateur, profilsEnergie } = useAuth();
  const { taches, chargement } = useTaches();
  const { occupations, connecte } = useOccupations();
  const { energieEffective } = useEnergieMoment();
  const [voirQuandMeme, setVoirQuandMeme] = useState(false);
  const maintenant = useHorloge();

  // Même réglage "Fin de journée" que sur l'écran Aujourd'hui, même message —
  // c'est la SEULE limite de fin de journée : la fenêtre de planification s'aligne
  // dessus (avant, elle s'arrêtait à la fin du dernier créneau d'énergie, ce qui
  // coupait la proposition trop tôt et sans rapport avec ce réglage).
  const journeeTerminee = useMemo(() => {
    const [h, m] = (utilisateur?.finJournee ?? "19:00").split(":").map(Number);
    const seuil = new Date(
      maintenant.getFullYear(),
      maintenant.getMonth(),
      maintenant.getDate(),
      h,
      m,
    );
    return maintenant.getTime() >= seuil.getTime();
  }, [utilisateur?.finJournee, maintenant]);

  const plan = usePlanJournee(
    taches,
    profilsEnergie,
    occupations,
    energieEffective,
    utilisateur?.finJournee,
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-airzen-primary">
          Ma journée proposée
          <span className="inline-block h-2 w-2 rounded-full bg-airzen-accent" aria-hidden />
        </h1>
        <p className="mt-1 text-sm font-light text-airzen-secondary">
          Une proposition indicative pour le reste de la journée — vous gardez la main.
          Rien n&apos;est écrit dans votre agenda.
        </p>
      </div>

      {journeeTerminee && !voirQuandMeme ? (
        <MessageFinJournee onVoirQuandMeme={() => setVoirQuandMeme(true)} />
      ) : (
        <>
          {!chargement && plan.blocs.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-airzen-primary">
                {plan.tachesProposees} tâche{plan.tachesProposees > 1 ? "s" : ""} proposée
                {plan.tachesProposees > 1 ? "s" : ""} · {formatDuree(plan.minutesPlanifiees)}{" "}
                planifiée{plan.minutesPlanifiees > 1 ? "s" : ""} sur{" "}
                {formatDuree(plan.minutesDisponibles)} disponible
                {plan.minutesDisponibles > 1 ? "s" : ""}
              </p>
            </div>
          )}

          {!connecte && (
            <p className="rounded-2xl bg-white p-4 text-sm font-light text-airzen-secondary shadow-sm">
              💡 Connectez Google Agenda dans les{" "}
              <Link href="/parametres" className="font-medium underline underline-offset-2">
                Réglages
              </Link>{" "}
              pour que vos créneaux libres soient encore plus précis — la proposition
              fonctionne déjà sans, à partir de vos tâches et de votre énergie.
            </p>
          )}

          {chargement ? (
            <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
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
                        {bloc.energieCompatible && " · ⚡ énergie compatible"}
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
            Proposition recalculée à chaque visite, selon vos tâches, votre énergie et
            votre agenda du moment.
          </p>
        </>
      )}
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
