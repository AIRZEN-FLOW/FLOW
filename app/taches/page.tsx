"use client";

// Étape 3 + 5 — Gestion des tâches : création, liste, quadrant, terminer,
// rattachement à un projet, sous-tâches (tâche parente) et filtre par projet.
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { FormulaireTache } from "@/components/FormulaireTache";
import { CarteTache } from "@/components/CarteTache";
import { ModaleDecoupage, type SousTacheChoisie } from "@/components/ModaleDecoupage";
import { ExplicationMatrice } from "@/components/ExplicationMatrice";
import { SelecteurAffichage } from "@/components/SelecteurAffichage";
import { MatricePriorites } from "@/components/MatricePriorites";
import { OngletsTaches } from "@/components/OngletsTaches";
import { useAuth } from "@/components/AuthProvider";
import { useTaches } from "@/lib/hooks/useTaches";
import { useProjets } from "@/lib/hooks/useProjets";
import { useModeAffichage } from "@/lib/hooks/useModeAffichage";
import type { Quadrant, SaisieTache, Tache } from "@/lib/types";

// items-start : chaque tuile garde la hauteur de son propre texte, au lieu de
// s'étirer à la hauteur de la plus grande de sa rangée.
const CLASSES_GRILLE_TUILES = "grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4";

function GestionTaches() {
  const { utilisateur } = useAuth();
  const {
    taches,
    chargement,
    erreur,
    creer,
    creerAvecSousTaches,
    modifier,
    terminer,
    supprimer,
    basculerEpingle,
    deplacerVersQuadrant,
    demarrerChrono,
    mettreEnPauseChrono,
  } = useTaches();
  const { projets } = useProjets();
  const { mode, setMode } = useModeAffichage("airzen-affichage-taches");
  const searchParams = useSearchParams();
  const [formulaireOuvert, setFormulaireOuvert] = useState(
    searchParams.get("nouvelle") === "1",
  );
  const [enregistrement, setEnregistrement] = useState(false);
  // Étape 6 — saisie en attente de décision de découpage (tâche > seuil).
  const [saisieADecouper, setSaisieADecouper] = useState<SaisieTache | null>(null);
  // Édition d'une tâche existante (mutuellement exclusif avec la création).
  const [tacheEnEdition, setTacheEnEdition] = useState<Tache | null>(null);
  const [filtreProjet, setFiltreProjet] = useState<string>(
    searchParams.get("projet") ?? "tous",
  );

  // Projet à présélectionner à la création (filtre actif, si c'est un vrai projet).
  const projetIdInitial =
    filtreProjet !== "tous" && filtreProjet !== "sans" ? filtreProjet : undefined;

  // Accès rapide depuis un autre écran (ex. rappel Q2 sur Aujourd'hui) :
  // ?mode=priorites ouvre directement la vue matrice, une seule fois au chargement.
  const modeParam = searchParams.get("mode");
  useEffect(() => {
    if (modeParam === "liste" || modeParam === "tuile" || modeParam === "priorites") {
      setMode(modeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seuilDecoupage = utilisateur?.seuilDecoupageMinutes ?? 90;

  const projetParId = useMemo(
    () => new Map(projets.map((p) => [p.id, p])),
    [projets],
  );

  // Mode tuiles : la hiérarchie parent/enfant ne peut pas s'indenter dans une
  // grille, donc chaque sous-tâche affiche plutôt le titre de sa tâche mère.
  const titreParId = useMemo(
    () => new Map(taches.map((t) => [t.id, t.titre])),
    [taches],
  );

  function correspondAuFiltre(t: Tache): boolean {
    if (filtreProjet === "tous") return true;
    if (filtreProjet === "sans") return !t.projetId;
    return t.projetId === filtreProjet;
  }

  const { topLevel, enfantsDe, terminees, parentesCandidates } = useMemo(() => {
    const actives = taches.filter(
      (t) => t.statut === "a_faire" || t.statut === "en_cours",
    );
    const activesFiltrees = actives.filter(correspondAuFiltre);
    const parentsIds = new Set(
      activesFiltrees.filter((t) => !t.tacheParenteId).map((t) => t.id),
    );
    // Une tâche est "de premier niveau" si elle n'a pas de parente affichée.
    const topLevel = activesFiltrees.filter(
      (t) => !t.tacheParenteId || !parentsIds.has(t.tacheParenteId),
    );
    const enfantsDe = (id: string) =>
      activesFiltrees.filter((t) => t.tacheParenteId === id);
    const terminees = taches
      .filter((t) => t.statut === "terminee")
      .filter(correspondAuFiltre);
    // Candidates pour devenir une tâche parente : tâches actives autonomes.
    const parentesCandidates = actives.filter((t) => !t.tacheParenteId);
    return { topLevel, enfantsDe, terminees, parentesCandidates };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taches, filtreProjet]);

  async function ajouter(saisie: SaisieTache) {
    // Étape 6 — au-delà du seuil, on propose systématiquement un découpage
    // avant validation (uniquement pour une tâche autonome, pas une sous-tâche).
    if (saisie.dureeEstimeeMinutes > seuilDecoupage && !saisie.tacheParenteId) {
      setSaisieADecouper(saisie);
      return;
    }
    setEnregistrement(true);
    try {
      await creer(saisie);
      setFormulaireOuvert(false);
    } finally {
      setEnregistrement(false);
    }
  }

  async function creerEntiere() {
    if (!saisieADecouper) return;
    await creer(saisieADecouper);
    setSaisieADecouper(null);
    setFormulaireOuvert(false);
  }

  async function creerDecoupee(sousTaches: SousTacheChoisie[]) {
    if (!saisieADecouper) return;
    await creerAvecSousTaches(saisieADecouper, sousTaches);
    setSaisieADecouper(null);
    setFormulaireOuvert(false);
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

  function ouvrirEdition(t: Tache) {
    setFormulaireOuvert(false);
    setTacheEnEdition(t);
  }

  function projetDe(t: Tache) {
    const p = t.projetId ? projetParId.get(t.projetId) : undefined;
    return p ? { nom: p.nom, couleur: p.couleur } : undefined;
  }

  // Mode priorités : les tâches de premier niveau réparties par quadrant,
  // avec le temps total estimé de chacun (vue d'ensemble de la charge).
  // Une tâche épinglée s'affiche dans Q1 quel que soit son quadrant calculé
  // (voir components/CarteTache.tsx — bouton punaise), pour la garder sous
  // les yeux sans toucher à son échéance ni à son importance réelles.
  const parQuadrant = useMemo(() => {
    const groupes: Record<Quadrant, Tache[]> = { q1: [], q2: [], q3: [], q4: [] };
    for (const t of topLevel) {
      groupes[t.epinglee ? "q1" : t.quadrantEisenhower].push(t);
    }
    return groupes;
  }, [topLevel]);

  const aucune = !chargement && topLevel.length === 0 && terminees.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-airzen-primary">Mes tâches</h1>
        {!formulaireOuvert && !tacheEnEdition && (
          <button
            type="button"
            onClick={() => setFormulaireOuvert(true)}
            className="rounded-full bg-airzen-accent px-4 py-2 text-sm font-semibold text-airzen-primary transition-opacity hover:opacity-90"
          >
            + Nouvelle tâche
          </button>
        )}
      </div>

      <OngletsTaches
        actif="a_faire"
        nombreTerminees={taches.filter((t) => t.statut === "terminee").length}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {projets.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-airzen-secondary">
              Projet :
              <select
                value={filtreProjet}
                onChange={(e) => setFiltreProjet(e.target.value)}
                className="rounded-lg border border-airzen-neutral/60 bg-white px-2 py-1.5 text-airzen-primary outline-none focus:border-airzen-secondary"
              >
                <option value="tous">Tous</option>
                <option value="sans">Sans projet</option>
                {projets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </label>
          )}
          <ExplicationMatrice seuilJours={utilisateur?.seuilUrgenceJours ?? 3} />
        </div>
        <SelecteurAffichage mode={mode} onChange={setMode} />
      </div>

      {formulaireOuvert && (
        <FormulaireTache
          onValider={ajouter}
          onAnnuler={() => setFormulaireOuvert(false)}
          projetIdInitial={projetIdInitial}
          enCours={enregistrement}
          projets={projets}
          tachesParentes={parentesCandidates}
        />
      )}

      {tacheEnEdition && (
        <FormulaireTache
          valeursInitiales={tacheEnEdition}
          onValider={enregistrerModification}
          onAnnuler={() => setTacheEnEdition(null)}
          enCours={enregistrement}
          projets={projets}
          tachesParentes={parentesCandidates.filter((t) => t.id !== tacheEnEdition.id)}
        />
      )}

      {saisieADecouper && (
        <ModaleDecoupage
          saisie={saisieADecouper}
          onCreerEntiere={creerEntiere}
          onCreerAvecSousTaches={creerDecoupee}
          onAnnuler={() => setSaisieADecouper(null)}
        />
      )}

      {erreur && <p className="text-sm text-q1">{erreur}</p>}

      {chargement ? (
        <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
      ) : aucune ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-light text-airzen-secondary">
            Aucune tâche ici. Ajoutez-en une pour commencer 🌱
          </p>
        </div>
      ) : mode === "liste" ? (
        <div className="flex flex-col gap-3">
          {topLevel.map((t) => {
            const enfants = enfantsDe(t.id);
            return (
              <div key={t.id} className="flex flex-col gap-2">
                <CarteTache
                  tache={t}
                  projet={projetDe(t)}
                  onModifier={ouvrirEdition}
                  onTerminer={(t) => terminer(t.id)}
                  onSupprimer={(t) => supprimer(t.id)}
                  onEpingler={(t) => basculerEpingle(t.id)}
                  onDemarrerChrono={(t) => demarrerChrono(t.id)}
                  onMettreEnPauseChrono={(t) => mettreEnPauseChrono(t.id)}
                />
                {enfants.length > 0 && (
                  <div className="ml-4 flex flex-col gap-2 border-l-2 border-airzen-neutral/30 pl-4">
                    {enfants.map((s) => (
                      <CarteTache
                        key={s.id}
                        tache={s}
                        projet={projetDe(s)}
                        onModifier={ouvrirEdition}
                        onTerminer={(s) => terminer(s.id)}
                        onSupprimer={(s) => supprimer(s.id)}
                        onEpingler={(s) => basculerEpingle(s.id)}
                        onDemarrerChrono={(s) => demarrerChrono(s.id)}
                        onMettreEnPauseChrono={(s) => mettreEnPauseChrono(s.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {topLevel.length === 0 && terminees.length > 0 && (
            <p className="text-sm font-light text-airzen-secondary">
              Tout est fait ici, bravo ✨
            </p>
          )}
        </div>
      ) : mode === "tuile" ? (
        // Mode tuiles : hiérarchie aplatie (une sous-tâche affiche le titre
        // de sa mère au lieu d'une indentation, impossible à rendre en grille).
        <>
          <div className={CLASSES_GRILLE_TUILES}>
            {topLevel.flatMap((t) => [t, ...enfantsDe(t.id)]).map((t) => (
              <CarteTache
                key={t.id}
                tache={t}
                mode="tuile"
                projet={projetDe(t)}
                sousTacheDe={
                  t.tacheParenteId ? titreParId.get(t.tacheParenteId) : undefined
                }
                onModifier={ouvrirEdition}
                onTerminer={(t) => terminer(t.id)}
                onSupprimer={(t) => supprimer(t.id)}
                onEpingler={(t) => basculerEpingle(t.id)}
                onDemarrerChrono={(t) => demarrerChrono(t.id)}
                onMettreEnPauseChrono={(t) => mettreEnPauseChrono(t.id)}
              />
            ))}
          </div>
          {topLevel.length === 0 && terminees.length > 0 && (
            <p className="text-sm font-light text-airzen-secondary">
              Tout est fait ici, bravo ✨
            </p>
          )}
        </>
      ) : (
        // Mode matrice : voir components/MatricePriorites.tsx (grille 2×2,
        // tâches déplaçables d'une case à l'autre).
        <MatricePriorites
          parQuadrant={parQuadrant}
          onDeplacer={(t, vers) => deplacerVersQuadrant(t.id, vers)}
          rendreCarte={(t) => (
            <CarteTache
              tache={t}
              mode="priorite"
              projet={projetDe(t)}
              onModifier={ouvrirEdition}
              onTerminer={(t) => terminer(t.id)}
              onSupprimer={(t) => supprimer(t.id)}
              onEpingler={(t) => basculerEpingle(t.id)}
              onDemarrerChrono={(t) => demarrerChrono(t.id)}
              onMettreEnPauseChrono={(t) => mettreEnPauseChrono(t.id)}
            />
          )}
        />
      )}
    </div>
  );
}

export default function PageTaches() {
  return (
    <RequireAuth>
      <AppShell>
        <Suspense fallback={null}>
          <GestionTaches />
        </Suspense>
      </AppShell>
    </RequireAuth>
  );
}
