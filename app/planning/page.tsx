"use client";

// Étape 8 — Vue "journée proposée" : planification automatique INDICATIVE.
// Les créneaux Google Agenda apparaissent en gris, les tâches proposées en
// couleur de quadrant. Rien n'est écrit dans Google Agenda (lecture seule).
//
// Onglet "Calendrier" (nouveau) : calendrier personnel semaine/mois/année,
// utilisable même sans compte Google connecté — les événements sont gérés
// entièrement dans l'app (collection `evenementsCalendrier`, voir
// lib/data/evenements.ts), indépendamment de la lecture seule Google Agenda.
import { useMemo, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { FormulaireTache } from "@/components/FormulaireTache";
import { FormulaireEvenement } from "@/components/FormulaireEvenement";
import { CalendrierSemaine } from "@/components/calendrier/CalendrierSemaine";
import { CalendrierMois } from "@/components/calendrier/CalendrierMois";
import { CalendrierAnnee } from "@/components/calendrier/CalendrierAnnee";
import { useAuth } from "@/components/AuthProvider";
import { MessageFinJournee } from "@/components/MessageFinJournee";
import { useTaches } from "@/lib/hooks/useTaches";
import { useEvenements } from "@/lib/hooks/useEvenements";
import { useProjets } from "@/lib/hooks/useProjets";
import { useHorloge } from "@/lib/hooks/useHorloge";
import { useEnergieMoment } from "@/lib/hooks/useEnergieMoment";
import { useOccupations } from "@/lib/hooks/useOccupations";
import { usePlanJournee } from "@/lib/hooks/usePlanJournee";
import { QUADRANTS } from "@/lib/eisenhower";
import { formatDuree } from "@/lib/format";
import { ajouterJours, lundiDe, nomMoisAnnee } from "@/components/calendrier/utils";
import { IconeChevronDroite, IconeCoche } from "@/components/icones";
import type { EvenementCalendrier, SaisieEvenement, Tache } from "@/lib/types";

function heureCourte(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function JourneeProposee() {
  const { utilisateur, profilsEnergie } = useAuth();
  const { taches, chargement, terminer } = useTaches();
  const { projets } = useProjets();
  const { occupations, connecte } = useOccupations();
  const { energieEffective } = useEnergieMoment();
  const [voirQuandMeme, setVoirQuandMeme] = useState(false);
  const maintenant = useHorloge();

  const projetParId = useMemo(
    () => new Map(projets.map((p) => [p.id, p])),
    [projets],
  );

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

  const plan = usePlanJournee(taches, profilsEnergie, occupations, energieEffective, {
    finJournee: utilisateur?.finJournee,
    heureDebutTravail: utilisateur?.heureDebutTravail,
    pauseDejeunerActive: utilisateur?.pauseDejeunerActive,
    heureDebutDejeuner: utilisateur?.heureDebutDejeuner,
    heureFinDejeuner: utilisateur?.heureFinDejeuner,
  });

  return (
    <div className="flex flex-col gap-5">
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
                        {bloc.label ?? "Occupé (agenda)"}
                      </p>
                      <p className="text-xs text-airzen-neutral">
                        jusqu&apos;à {heureCourte(bloc.fin)}
                      </p>
                    </div>
                  ) : bloc.type === "tache" && bloc.tache ? (
                    <div
                      className="flex flex-1 items-start justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm"
                      style={{
                        borderLeft: `4px solid ${QUADRANTS[bloc.tache.quadrantEisenhower].couleur}`,
                      }}
                    >
                      <div className="min-w-0">
                        {bloc.tache.projetId &&
                          projetParId.get(bloc.tache.projetId) && (
                            <p
                              className="flex items-center gap-1 truncate text-[11px] font-medium"
                              style={{ color: projetParId.get(bloc.tache.projetId)!.couleur }}
                            >
                              <span
                                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: projetParId.get(bloc.tache.projetId)!.couleur,
                                }}
                              />
                              {projetParId.get(bloc.tache.projetId)!.nom}
                            </p>
                          )}
                        <p className="text-sm font-medium text-airzen-primary">
                          {bloc.tache.titre}
                        </p>
                        <p className="text-xs text-airzen-secondary">
                          {formatDuree(bloc.tache.dureeEstimeeMinutes)} ·{" "}
                          {QUADRANTS[bloc.tache.quadrantEisenhower].label}
                          {bloc.energieCompatible && " · ⚡ énergie compatible"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => terminer(bloc.tache!.id)}
                        aria-label="Terminer"
                        title="Terminer"
                        className="shrink-0 rounded-full p-1.5 text-airzen-primary transition-colors hover:bg-airzen-bg"
                      >
                        <IconeCoche />
                      </button>
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

          <p className="text-xs font-light text-airzen-neutral">
            Proposition recalculée à chaque visite, selon vos tâches, votre énergie et
            votre agenda du moment.
          </p>
        </>
      )}
    </div>
  );
}

type VueCalendrier = "semaine" | "mois" | "annee";

function VueCalendrierPersonnel() {
  const { taches, modifier: modifierTache } = useTaches();
  const { projets } = useProjets();
  const { evenements, creer, modifier, supprimer } = useEvenements();
  const [vue, setVue] = useState<VueCalendrier>("semaine");
  const [reference, setReference] = useState(() => new Date());
  const [evenementEnEdition, setEvenementEnEdition] = useState<EvenementCalendrier | null>(null);
  const [dateCreation, setDateCreation] = useState<Date | null>(null);
  const [tacheEnEdition, setTacheEnEdition] = useState<Tache | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const formulaireOuvert = Boolean(evenementEnEdition) || Boolean(dateCreation);

  function naviguer(delta: number) {
    setReference((d) => {
      if (vue === "semaine") return ajouterJours(d, delta * 7);
      if (vue === "annee") return new Date(d.getFullYear() + delta, d.getMonth(), 1);
      return new Date(d.getFullYear(), d.getMonth() + delta, 1);
    });
  }

  async function validerEvenement(saisie: SaisieEvenement) {
    setEnregistrement(true);
    try {
      if (evenementEnEdition) {
        await modifier(evenementEnEdition.id, saisie);
      } else {
        await creer(saisie);
      }
      setEvenementEnEdition(null);
      setDateCreation(null);
    } finally {
      setEnregistrement(false);
    }
  }

  async function supprimerEvenementCourant() {
    if (!evenementEnEdition) return;
    await supprimer(evenementEnEdition.id);
    setEvenementEnEdition(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => naviguer(-1)}
            aria-label="Précédent"
            className="rounded-full p-1.5 text-airzen-secondary hover:bg-airzen-bg"
          >
            <IconeChevronDroite className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => setReference(new Date())}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-airzen-secondary hover:bg-airzen-bg"
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => naviguer(1)}
            aria-label="Suivant"
            className="rounded-full p-1.5 text-airzen-secondary hover:bg-airzen-bg"
          >
            <IconeChevronDroite className="h-4 w-4" />
          </button>
          <span className="ml-1 text-sm font-semibold text-airzen-primary">
            {vue === "annee" ? reference.getFullYear() : nomMoisAnnee(reference)}
          </span>
        </div>
        <div className="flex gap-1.5 rounded-full bg-white p-1 shadow-sm">
          {(
            [
              { valeur: "semaine", label: "Semaine" },
              { valeur: "mois", label: "Mois" },
              { valeur: "annee", label: "Année" },
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
      </div>

      {formulaireOuvert && (
        <FormulaireEvenement
          valeursInitiales={evenementEnEdition ?? undefined}
          dateInitiale={dateCreation ?? undefined}
          onValider={validerEvenement}
          onAnnuler={() => {
            setEvenementEnEdition(null);
            setDateCreation(null);
          }}
          onSupprimer={evenementEnEdition ? supprimerEvenementCourant : undefined}
          enCours={enregistrement}
        />
      )}

      {tacheEnEdition && (
        <FormulaireTache
          valeursInitiales={tacheEnEdition}
          onValider={async (saisie) => {
            setEnregistrement(true);
            try {
              await modifierTache(tacheEnEdition.id, saisie);
              setTacheEnEdition(null);
            } finally {
              setEnregistrement(false);
            }
          }}
          onAnnuler={() => setTacheEnEdition(null)}
          enCours={enregistrement}
          projets={projets}
        />
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        {vue === "semaine" && (
          <CalendrierSemaine
            lundi={lundiDe(reference)}
            evenements={evenements}
            taches={taches}
            onEvenementClic={setEvenementEnEdition}
            onTacheClic={setTacheEnEdition}
            onCreerEvenement={setDateCreation}
          />
        )}
        {vue === "mois" && (
          <CalendrierMois
            mois={reference}
            evenements={evenements}
            taches={taches}
            onEvenementClic={setEvenementEnEdition}
            onTacheClic={setTacheEnEdition}
            onJourClic={(date) => {
              setReference(date);
              setVue("semaine");
            }}
            onAjouterEvenement={setDateCreation}
          />
        )}
        {vue === "annee" && (
          <CalendrierAnnee
            annee={reference.getFullYear()}
            evenements={evenements}
            taches={taches}
            onJourClic={(date) => {
              setReference(date);
              setVue("mois");
            }}
          />
        )}
      </div>
    </div>
  );
}

type Onglet = "journee" | "calendrier";

function PagePlanningContenu() {
  const [onglet, setOnglet] = useState<Onglet>("journee");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-airzen-primary">
            {onglet === "journee" ? "Ma journée proposée" : "Calendrier"}
            {onglet === "journee" && (
              <span className="inline-block h-2 w-2 rounded-full bg-airzen-accent" aria-hidden />
            )}
          </h1>
          <p className="mt-1 text-sm font-light text-airzen-secondary">
            {onglet === "journee"
              ? "Une proposition indicative pour le reste de la journée — vous gardez la main. Rien n'est écrit dans votre agenda."
              : "Votre agenda personnel — utilisable même sans compte Google connecté."}
          </p>
        </div>
        <div className="flex gap-1.5 rounded-full bg-white p-1 shadow-sm">
          {(
            [
              { valeur: "journee", label: "Ma journée" },
              { valeur: "calendrier", label: "Calendrier" },
            ] as const
          ).map((o) => (
            <button
              key={o.valeur}
              type="button"
              onClick={() => setOnglet(o.valeur)}
              className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors ${
                onglet === o.valeur
                  ? "bg-airzen-primary text-white"
                  : "text-airzen-secondary hover:bg-airzen-bg"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {onglet === "journee" ? <JourneeProposee /> : <VueCalendrierPersonnel />}
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
