"use client";

// Écran principal "Aujourd'hui" — fil de suggestions (Étapes 4 & 8).
// Croise énergie du moment × temps disponible × quadrant Eisenhower.
// Si Google Agenda est connecté, le temps disponible est déduit du prochain
// rendez-vous ; le choix manuel reste prioritaire.
import { useMemo, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { BandeauEnergie } from "@/components/BandeauEnergie";
import { MessageFinJournee } from "@/components/MessageFinJournee";
import { EnTeteAccueil } from "@/components/EnTeteAccueil";
import { CarteTache } from "@/components/CarteTache";
import { FormulaireTache } from "@/components/FormulaireTache";
import { useTaches } from "@/lib/hooks/useTaches";
import { useProjets } from "@/lib/hooks/useProjets";
import { useEnergieMoment } from "@/lib/hooks/useEnergieMoment";
import { useHorloge } from "@/lib/hooks/useHorloge";
import { usePlanJournee } from "@/lib/hooks/usePlanJournee";
import {
  minutesAvantProchaineOccupation,
  useOccupations,
} from "@/lib/hooks/useOccupations";
import { calculerSuggestions, type TempsDisponible } from "@/lib/matching";
import { estUrgente, QUADRANTS } from "@/lib/eisenhower";
import { formatDuree, tsEnDate } from "@/lib/format";
import type { Quadrant, SaisieTache, Tache } from "@/lib/types";

const OPTIONS_TEMPS: { valeur: TempsDisponible; label: string }[] = [
  { valeur: 15, label: "15 min" },
  { valeur: 30, label: "30 min" },
  { valeur: 60, label: "1 h" },
  { valeur: "plus", label: "Plus" },
];

function heureCourte(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function EcranAujourdhui() {
  const { utilisateur, profilsEnergie } = useAuth();
  const { taches, chargement, modifier, terminer } = useTaches();
  const { projets } = useProjets();
  const { energieEffective, ajustementManuel, definirOverride, reinitialiser } =
    useEnergieMoment();
  const { occupations, connecte } = useOccupations();
  // Choix manuel (prioritaire) ; null = suivre l'agenda (ou 30 min par défaut).
  const [tempsChoisi, setTempsChoisi] = useState<TempsDisponible | null>(null);
  const [tacheEnEdition, setTacheEnEdition] = useState<Tache | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [bilanVisible, setBilanVisible] = useState(false);
  const maintenant = useHorloge();
  const [voirQuandMeme, setVoirQuandMeme] = useState(false);

  // Fin de journée choisie dans Réglages (défaut 19h) : passé cette heure,
  // on n'insiste plus pour proposer des tâches — le repos aussi compte.
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

  // Petite reconnaissance douce : tâches accomplies au cours des 7 derniers jours,
  // détaillées par quadrant pour le mini bilan (badge cliquable).
  const bilanParQuadrant = useMemo(() => {
    const ilYA7Jours = maintenant.getTime() - 7 * 24 * 60 * 60 * 1000;
    const compte: Record<Quadrant, number> = { q1: 0, q2: 0, q3: 0, q4: 0 };
    for (const t of taches) {
      if (t.statut !== "terminee") continue;
      const mod = tsEnDate(t.modifieLe ?? null);
      if (mod && mod.getTime() >= ilYA7Jours) compte[t.quadrantEisenhower]++;
    }
    return compte;
  }, [taches, maintenant]);
  const termineesCetteSemaine =
    bilanParQuadrant.q1 + bilanParQuadrant.q2 + bilanParQuadrant.q3 + bilanParQuadrant.q4;

  // Rappel doux pour le quadrant Q2 (important, pas urgent) : c'est celui
  // qu'on laisse le plus facilement de côté puisque rien ne presse.
  const q2EnAttente = useMemo(() => {
    const seuilMs = 7 * 24 * 60 * 60 * 1000;
    return taches.filter((t) => {
      if (t.statut !== "a_faire" && t.statut !== "en_cours") return false;
      if (t.quadrantEisenhower !== "q2" || t.tacheParenteId) return false;
      const cree = tsEnDate(t.creeLe ?? null);
      return cree ? maintenant.getTime() - cree.getTime() >= seuilMs : false;
    }).length;
  }, [taches, maintenant]);

  // Charge du jour : mêmes chiffres que sur Planning, condensés en une ligne.
  const plan = usePlanJournee(
    taches,
    profilsEnergie,
    occupations,
    energieEffective,
    utilisateur?.finJournee,
  );
  const tachesUrgentes = useMemo(() => {
    const seuilJours = utilisateur?.seuilUrgenceJours ?? 3;
    return taches.filter(
      (t) =>
        (t.statut === "a_faire" || t.statut === "en_cours") &&
        estUrgente(tsEnDate(t.dateEcheance), seuilJours, maintenant),
    ).length;
  }, [taches, utilisateur?.seuilUrgenceJours, maintenant]);

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

  // Temps déduit de l'agenda : minutes avant le prochain rendez-vous.
  const agenda = useMemo(() => {
    if (!connecte || !occupations) return null;
    return { creneau: minutesAvantProchaineOccupation(occupations) };
  }, [connecte, occupations]);

  const tempsAuto: TempsDisponible | number | null = agenda
    ? agenda.creneau === null
      ? "plus" // plus aucun rendez-vous aujourd'hui
      : agenda.creneau.minutes
    : null;

  const tempsEffectif: TempsDisponible | number = tempsChoisi ?? tempsAuto ?? 30;

  const suggestions = useMemo(() => {
    const avecEcheance = taches.map((t) => ({
      ...t,
      echeanceDate: tsEnDate(t.dateEcheance),
    }));
    return calculerSuggestions(avecEcheance, energieEffective, tempsEffectif, 5);
  }, [taches, energieEffective, tempsEffectif]);

  const aucuneTache =
    !chargement &&
    taches.filter((t) => t.statut !== "terminee" && t.statut !== "annulee").length === 0;

  const prenom = utilisateur?.nomAffiche?.split(" ")[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-airzen-primary">Aujourd&apos;hui</h1>
        {termineesCetteSemaine > 0 && (
          <button
            type="button"
            onClick={() => setBilanVisible((v) => !v)}
            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-airzen-primary shadow-sm ring-1 ring-airzen-accent/40 transition-opacity hover:opacity-80"
          >
            😊 {termineesCetteSemaine} cette semaine
          </button>
        )}
      </div>

      {bilanVisible && termineesCetteSemaine > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-airzen-primary">
            Cette semaine, par priorité
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {(["q1", "q2", "q3", "q4"] as Quadrant[]).map((q) => (
              <li key={q} className="flex items-center gap-2 text-sm text-airzen-secondary">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: QUADRANTS[q].couleur }}
                />
                <span className="flex-1">{QUADRANTS[q].label}</span>
                <span className="font-medium text-airzen-primary">
                  {bilanParQuadrant[q]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <EnTeteAccueil prenom={prenom} maintenant={maintenant} />

      <div className="flex flex-wrap gap-x-5 gap-y-1">
        <Link
          href="/taches"
          className="text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
        >
          Gérer toutes mes tâches →
        </Link>
        <Link
          href="/planning"
          className="text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
        >
          Voir ma journée proposée →
        </Link>
      </div>

      {q2EnAttente > 0 && (
        <Link
          href="/taches?mode=priorites"
          className="flex items-center gap-2 rounded-xl bg-q2/10 px-4 py-2.5 text-sm text-airzen-primary transition-opacity hover:opacity-80"
        >
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-q2" aria-hidden />
          <span>
            {q2EnAttente} tâche{q2EnAttente > 1 ? "s" : ""} importante
            {q2EnAttente > 1 ? "s" : ""} en attente depuis plus de 7 jours
          </span>
          <span className="ml-auto shrink-0 font-medium">→</span>
        </Link>
      )}

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

      {journeeTerminee && !voirQuandMeme ? (
        <MessageFinJournee onVoirQuandMeme={() => setVoirQuandMeme(true)} />
      ) : (
        <>
          <BandeauEnergie
            energieEffective={energieEffective}
            ajustementManuel={ajustementManuel}
            onDefinir={definirOverride}
            onReinitialiser={reinitialiser}
          />

          <section className="flex flex-col gap-2">
            {agenda && agenda.creneau !== null && tempsChoisi === null ? (
          <p className="text-sm text-airzen-secondary">
            📅 Prochain rendez-vous à{" "}
            <span className="font-semibold text-airzen-primary">
              {heureCourte(agenda.creneau.prochaine.debut)}
            </span>{" "}
            — vous avez environ{" "}
            <span className="font-semibold text-airzen-primary">
              {agenda.creneau.minutes} min
            </span>{" "}
            devant vous.
          </p>
        ) : agenda && agenda.creneau === null && tempsChoisi === null ? (
          <p className="text-sm text-airzen-secondary">
            📅 Plus aucun rendez-vous aujourd&apos;hui — la journée vous appartient.
          </p>
        ) : (
          <p className="text-sm text-airzen-secondary">
            Combien de temps avez-vous là, maintenant ?
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {OPTIONS_TEMPS.map((o) => (
            <button
              key={String(o.valeur)}
              type="button"
              onClick={() => setTempsChoisi(o.valeur)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                tempsChoisi === o.valeur
                  ? "bg-airzen-primary font-medium text-white"
                  : "bg-white text-airzen-secondary shadow-sm hover:bg-airzen-bg"
              }`}
            >
              {o.label}
            </button>
          ))}
          {tempsChoisi !== null && tempsAuto !== null && (
            <button
              type="button"
              onClick={() => setTempsChoisi(null)}
              className="text-xs text-airzen-neutral hover:text-airzen-secondary"
            >
              suivre l&apos;agenda
            </button>
          )}
        </div>
      </section>

      {!chargement && (tachesUrgentes > 0 || plan.minutesDisponibles > 0) && (
        <p className="text-sm font-light text-airzen-secondary">
          {tachesUrgentes > 0 &&
            `${tachesUrgentes} tâche${tachesUrgentes > 1 ? "s" : ""} urgente${tachesUrgentes > 1 ? "s" : ""}`}
          {tachesUrgentes > 0 && plan.minutesDisponibles > 0 && " · "}
          {plan.minutesDisponibles > 0 &&
            `${formatDuree(plan.minutesPlanifiees)} planifiée${plan.minutesPlanifiees > 1 ? "s" : ""} sur ${formatDuree(plan.minutesDisponibles)} disponible${plan.minutesDisponibles > 1 ? "s" : ""} aujourd'hui`}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-airzen-neutral">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-airzen-accent" aria-hidden />
          Suggestions pour ce moment
        </h2>

        {chargement ? (
          <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
        ) : aucuneTache ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="font-light text-airzen-secondary">
              Vous n&apos;avez pas encore de tâche.
            </p>
            <Link
              href="/taches"
              className="mt-4 inline-block rounded-full bg-airzen-accent px-5 py-2.5 font-semibold text-airzen-primary transition-opacity hover:opacity-90"
            >
              Ajouter ma première tâche
            </Link>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="font-light text-airzen-secondary">
              Rien ne colle parfaitement à ce créneau et à votre énergie là, maintenant.
              C&apos;est peut-être le bon moment pour souffler 🌿
            </p>
          </div>
        ) : (
          suggestions.map((s) => (
            <CarteTache
              key={s.tache.id}
              tache={s.tache}
              raison={s.raison}
              attenue={s.secondPlan}
              onModifier={setTacheEnEdition}
              onTerminer={(t) => terminer(t.id)}
            />
          ))
        )}
          </section>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <AppShell>
        <EcranAujourdhui />
      </AppShell>
    </RequireAuth>
  );
}
