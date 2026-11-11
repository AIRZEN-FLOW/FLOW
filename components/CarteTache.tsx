"use client";

// Carte de tâche : la brique de base, visible dans les listes et les suggestions
// (voir docs/04-design-system.md §3). Une bande de couleur pleine sur le bord
// gauche rend le quadrant Eisenhower reconnaissable d'un coup d'œil, en plus
// du badge (voir components/BadgeQuadrant.tsx et ExplicationMatrice.tsx).
// Le titre est cliquable pour ouvrir directement l'édition (si onModifier fourni).
import type { Tache } from "@/lib/types";
import { BadgeQuadrant } from "@/components/BadgeQuadrant";
import { ChronoTache } from "@/components/ChronoTache";
import { QUADRANTS } from "@/lib/eisenhower";
import { abregeNiveau, libelleNiveau } from "@/lib/energie";
import {
  formatDuree,
  formatDureeCourt,
  formatEcheance,
  formatEcheanceCourt,
  tsEnDate,
} from "@/lib/format";
import {
  IconeCalendrier,
  IconeCoche,
  IconeCorbeille,
  IconeEclair,
  IconeHorloge,
  IconePunaise,
  IconeRouvrir,
} from "@/components/icones";

interface CarteTacheProps {
  tache: Tache;
  raison?: string; // "pourquoi maintenant" (suggestions)
  attenue?: boolean; // affichage en retrait (second plan / terminée)
  projet?: { nom: string; couleur: string }; // pastille projet, si rattachée
  sousTacheDe?: string; // titre de la tâche mère (mode tuile, hiérarchie aplatie)
  // "priorite" : même forme que "liste" (pas carrée), mais titre en petite
  // police + retour à la ligne comme en mode tuile — les colonnes de la vue
  // Priorités sont trop étroites pour un titre sur une seule ligne.
  mode?: "liste" | "tuile" | "priorite";
  onModifier?: (t: Tache) => void;
  onTerminer?: (t: Tache) => void;
  onRouvrir?: (t: Tache) => void;
  onSupprimer?: (t: Tache) => void;
  // Épingler dans la colonne "Faire maintenant" (Q1) de la vue Priorités,
  // pour garder une tâche sous les yeux sans changer son échéance/importance.
  onEpingler?: (t: Tache) => void;
  // Chronomètre — fournis les deux pour l'afficher (voir components/ChronoTache.tsx).
  onDemarrerChrono?: (t: Tache) => void;
  onMettreEnPauseChrono?: (t: Tache) => void;
}

const CLASSE_BOUTON_ICONE =
  "rounded-full p-1.5 transition-colors hover:bg-airzen-bg shrink-0";

// Petit repère quand une tâche est épinglée dans la case IU alors que son
// quadrant réel (calculé) est différent — pour ne pas induire en erreur.
function IndicateurEpingle({ tache }: { tache: Tache }) {
  if (!tache.epinglee) return null;
  return (
    <span title="Épinglée dans IU (important et urgent)" className="inline-flex text-airzen-accent">
      <IconePunaise className="h-3 w-3" />
    </span>
  );
}

export function CarteTache({
  tache,
  raison,
  attenue = false,
  projet,
  sousTacheDe,
  mode = "liste",
  onModifier,
  onTerminer,
  onRouvrir,
  onSupprimer,
  onEpingler,
  onDemarrerChrono,
  onMettreEnPauseChrono,
}: CarteTacheProps) {
  const terminee = tache.statut === "terminee";
  const echeance = formatEcheance(tsEnDate(tache.dateEcheance));
  const couleurQuadrant = QUADRANTS[tache.quadrantEisenhower].couleur;
  const tuile = mode === "tuile";
  const titrePetit = mode === "tuile" || mode === "priorite";

  function elementTitre(classes: string) {
    return onModifier ? (
      <button
        type="button"
        onClick={() => onModifier(tache)}
        className={`text-left font-medium text-airzen-primary hover:underline ${
          terminee ? "line-through" : ""
        } ${classes}`}
        title="Modifier"
      >
        {tache.titre}
      </button>
    ) : (
      <p className={`font-medium text-airzen-primary ${terminee ? "line-through" : ""} ${classes}`}>
        {tache.titre}
      </p>
    );
  }

  const chrono =
    !terminee && onDemarrerChrono && onMettreEnPauseChrono ? (
      <ChronoTache
        tache={tache}
        onDemarrer={() => onDemarrerChrono(tache)}
        onPause={() => onMettreEnPauseChrono(tache)}
      />
    ) : null;

  const actions = (
    <>
      {!terminee && onEpingler && (
        <button
          type="button"
          onClick={() => onEpingler(tache)}
          aria-label={tache.epinglee ? "Désépingler" : "Épingler dans IU"}
          title={
            tache.epinglee
              ? "Désépingler"
              : "Épingler dans IU — la garder sous les yeux"
          }
          className={`${CLASSE_BOUTON_ICONE} ${
            tache.epinglee ? "text-airzen-accent" : "text-airzen-secondary"
          }`}
        >
          <IconePunaise />
        </button>
      )}
      {!terminee && onTerminer && (
        <button
          type="button"
          onClick={() => onTerminer(tache)}
          aria-label="Terminer"
          title="Terminer"
          className={`${CLASSE_BOUTON_ICONE} text-airzen-primary`}
        >
          <IconeCoche />
        </button>
      )}
      {terminee && onRouvrir && (
        <button
          type="button"
          onClick={() => onRouvrir(tache)}
          aria-label="Rouvrir"
          title="Rouvrir"
          className={`${CLASSE_BOUTON_ICONE} text-airzen-secondary`}
        >
          <IconeRouvrir />
        </button>
      )}
    </>
  );

  // La corbeille vit à part, dans le coin en haut à droite de la carte : loin de
  // "Terminer", pour ne pas supprimer une tâche par un clic à côté.
  const corbeille = onSupprimer ? (
    <button
      type="button"
      onClick={() => onSupprimer(tache)}
      aria-label="Supprimer"
      title="Supprimer"
      className="shrink-0 rounded-full p-1 text-airzen-neutral transition-colors hover:bg-q1/10 hover:text-q1"
    >
      <IconeCorbeille className="h-3.5 w-3.5" />
    </button>
  ) : null;

  // Nom du projet affiché AVANT le titre de la tâche (repère de contexte immédiat),
  // conformément au besoin exprimé : "1 - le nom du projet, 2 - la tâche".
  function elementProjet(classes: string) {
    if (!projet) return null;
    return (
      <p
        className={`flex items-center gap-1 truncate font-medium ${classes}`}
        style={{ color: projet.couleur }}
        title={`Projet : ${projet.nom}`}
      >
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: projet.couleur }}
        />
        {projet.nom}
      </p>
    );
  }

  if (tuile) {
    return (
      <article
        className={`relative flex flex-col rounded-2xl bg-white p-3 shadow-sm transition-opacity ${
          attenue || terminee ? "opacity-60" : ""
        }`}
        style={{ borderLeft: `4px solid ${couleurQuadrant}` }}
      >
        {corbeille && <div className="absolute right-1.5 top-1.5">{corbeille}</div>}
        {/* Hauteur libre : la tuile prend la place de son texte, pas plus.
            pr-5 : le texte ne passe pas sous la corbeille. */}
        <div className={`min-w-0 ${corbeille ? "pr-5" : ""}`}>
          {elementProjet("mb-0.5 text-[10px]")}
          {sousTacheDe && (
            <p className="mb-0.5 truncate text-[10px] font-light text-airzen-neutral">
              ↳ {sousTacheDe}
            </p>
          )}
          {elementTitre("block line-clamp-3 text-xs leading-snug")}
          {tache.description && (
            <p className="mt-0.5 line-clamp-3 whitespace-pre-line text-[11px] font-light leading-snug text-airzen-secondary">
              {tache.description}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <BadgeQuadrant quadrant={tache.quadrantEisenhower} avecLabel={false} />
            <IndicateurEpingle tache={tache} />
          </div>
          <p className="mt-1 text-[11px] text-airzen-secondary">
            {formatDuree(tache.dureeEstimeeMinutes)}
            {` · énergie ${libelleNiveau(tache.niveauEnergieRequis).toLowerCase()}`}
            {echeance ? ` · ${echeance}` : ""}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-0.5 border-t border-airzen-neutral/20 pt-1.5">
          {chrono}
          <div className="ml-auto flex items-center gap-0.5">{actions}</div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`flex items-center gap-2 rounded-xl bg-white py-2 pl-3 pr-1.5 shadow-sm transition-opacity ${
        attenue || terminee ? "opacity-60" : ""
      }`}
      style={{ borderLeft: `4px solid ${couleurQuadrant}` }}
    >
      <div className="min-w-0 flex-1">
        {elementProjet("text-[11px]")}
        {sousTacheDe && (
          <p className="truncate text-[11px] font-light text-airzen-neutral">
            ↳ sous-tâche de « {sousTacheDe} »
          </p>
        )}
        {elementTitre(
          titrePetit ? "block line-clamp-2 text-xs leading-snug" : "block truncate",
        )}
        {mode === "priorite" ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-airzen-secondary">
            <BadgeQuadrant quadrant={tache.quadrantEisenhower} avecLabel={false} />
            <IndicateurEpingle tache={tache} />
            <span
              className="inline-flex items-center gap-0.5"
              title={`Durée : ${formatDuree(tache.dureeEstimeeMinutes)}`}
            >
              <IconeHorloge className="h-3 w-3" />
              {formatDureeCourt(tache.dureeEstimeeMinutes)}
            </span>
            <span
              className="inline-flex items-center gap-0.5"
              title={`Énergie requise : ${libelleNiveau(tache.niveauEnergieRequis)}`}
            >
              <IconeEclair className="h-3 w-3" />
              {abregeNiveau(tache.niveauEnergieRequis)}
            </span>
            {echeance && (
              <span className="inline-flex items-center gap-0.5" title={`Échéance : ${echeance}`}>
                <IconeCalendrier className="h-3 w-3" />
                {formatEcheanceCourt(tsEnDate(tache.dateEcheance))}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-airzen-secondary">
            <BadgeQuadrant quadrant={tache.quadrantEisenhower} avecLabel={false} />
            <IndicateurEpingle tache={tache} />
            <span>{formatDuree(tache.dureeEstimeeMinutes)}</span>
            <span title="Énergie requise">{libelleNiveau(tache.niveauEnergieRequis).toLowerCase()}</span>
            {echeance && <span>{echeance}</span>}
          </div>
        )}
        {raison && <p className="mt-1 text-xs font-light text-airzen-secondary">{raison}</p>}
      </div>

      <div
        className={`flex shrink-0 flex-col items-end gap-0.5 self-stretch ${
          corbeille ? "justify-between" : "justify-center"
        }`}
      >
        {corbeille && <div className="-mt-1">{corbeille}</div>}
        <div className="flex items-center gap-1">
          {chrono}
          <div className="flex items-center gap-0.5">{actions}</div>
        </div>
      </div>
    </article>
  );
}
