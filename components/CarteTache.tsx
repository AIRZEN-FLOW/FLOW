"use client";

// Carte de tâche : la brique de base, visible dans les listes et les suggestions
// (voir docs/04-design-system.md §3). Une bande de couleur pleine sur le bord
// gauche rend le quadrant Eisenhower reconnaissable d'un coup d'œil, en plus
// du badge (voir components/BadgeQuadrant.tsx et LegendeQuadrants.tsx).
// Le titre est cliquable pour ouvrir directement l'édition (si onModifier fourni).
import type { Tache } from "@/lib/types";
import { BadgeQuadrant } from "@/components/BadgeQuadrant";
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
  IconeCloche,
  IconeCoche,
  IconeCorbeille,
  IconeCrayon,
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
}

const CLASSE_BOUTON_ICONE =
  "rounded-full p-1.5 transition-colors hover:bg-airzen-bg shrink-0";

// Indicateur de plaisir, affiché seulement aux extrêmes (corvée / plaisir) —
// le niveau "moyenne" est le cas neutre par défaut, pas besoin de le signaler.
function IndicateurPlaisir({ tache }: { tache: Tache }) {
  if (tache.niveauPlaisir === "basse") {
    return (
      <span title="Plutôt une corvée" className="text-airzen-neutral">
        💪
      </span>
    );
  }
  if (tache.niveauPlaisir === "haute") {
    return (
      <span title="Plutôt un plaisir" className="text-airzen-neutral">
        😊
      </span>
    );
  }
  return null;
}

// Petit repère quand une tâche est épinglée dans Priorité 1 alors que son
// quadrant réel (calculé) est différent — pour ne pas induire en erreur.
function IndicateurEpingle({ tache }: { tache: Tache }) {
  if (!tache.epinglee) return null;
  return (
    <span title="Épinglée dans Priorité 1" className="inline-flex text-airzen-accent">
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

  const actions = (
    <>
      {!terminee && onEpingler && (
        <button
          type="button"
          onClick={() => onEpingler(tache)}
          aria-label={tache.epinglee ? "Désépingler" : "Épingler dans Priorité 1"}
          title={
            tache.epinglee
              ? "Désépingler"
              : "Épingler dans Priorité 1 — la garder sous les yeux"
          }
          className={`${CLASSE_BOUTON_ICONE} ${
            tache.epinglee ? "text-airzen-accent" : "text-airzen-secondary"
          }`}
        >
          <IconePunaise />
        </button>
      )}
      {onModifier && (
        <button
          type="button"
          onClick={() => onModifier(tache)}
          aria-label="Modifier"
          title="Modifier"
          className={`${CLASSE_BOUTON_ICONE} text-airzen-secondary`}
        >
          <IconeCrayon />
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
      {onSupprimer && (
        <button
          type="button"
          onClick={() => onSupprimer(tache)}
          aria-label="Supprimer"
          title="Supprimer"
          className={`${CLASSE_BOUTON_ICONE} text-airzen-neutral hover:bg-q1/10 hover:text-q1`}
        >
          <IconeCorbeille />
        </button>
      )}
    </>
  );

  if (tuile) {
    return (
      <article
        className={`flex aspect-square flex-col rounded-2xl bg-white p-3 shadow-sm transition-opacity ${
          attenue || terminee ? "opacity-60" : ""
        }`}
        style={{ borderLeft: `4px solid ${couleurQuadrant}` }}
      >
        <div className="min-w-0 flex-1 overflow-hidden">
          {sousTacheDe && (
            <p className="mb-0.5 truncate text-[10px] font-light text-airzen-neutral">
              ↳ {sousTacheDe}
            </p>
          )}
          {elementTitre("block line-clamp-2 text-xs leading-snug")}
          {tache.description && (
            <p className="mt-0.5 line-clamp-1 text-[10px] font-light text-airzen-neutral">
              {tache.description}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <BadgeQuadrant quadrant={tache.quadrantEisenhower} avecLabel={false} />
            <IndicateurEpingle tache={tache} />
            {tache.recurrenceRegle && (
              <span title="Tâche récurrente" className="text-xs text-airzen-neutral">
                ↻
              </span>
            )}
            {tache.rappel && (
              <span title="Rappel activé" className="text-airzen-neutral">
                <IconeCloche className="h-3 w-3" />
              </span>
            )}
            <IndicateurPlaisir tache={tache} />
          </div>
          <p className="mt-1 text-[11px] text-airzen-secondary">
            {formatDuree(tache.dureeEstimeeMinutes)}
            {echeance ? ` · ${echeance}` : ""}
          </p>
          {projet && (
            <p
              className="mt-1 truncate text-[11px] text-airzen-secondary"
              title={`Projet : ${projet.nom}`}
            >
              <span
                className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ backgroundColor: projet.couleur }}
              />
              {projet.nom}
            </p>
          )}
        </div>
        <div className="mt-2 flex items-center justify-end gap-0.5 border-t border-airzen-neutral/20 pt-1.5">
          {actions}
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
            {tache.recurrenceRegle && <span title="Tâche récurrente">↻</span>}
            {tache.rappel && (
              <span title="Rappel activé" className="inline-flex text-airzen-neutral">
                <IconeCloche className="h-3 w-3" />
              </span>
            )}
            <IndicateurPlaisir tache={tache} />
            {projet && (
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: projet.couleur }}
                title={`Projet : ${projet.nom}`}
              />
            )}
          </div>
        ) : (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-airzen-secondary">
            <BadgeQuadrant quadrant={tache.quadrantEisenhower} avecLabel={false} />
            <IndicateurEpingle tache={tache} />
            <span>{formatDuree(tache.dureeEstimeeMinutes)}</span>
            <span title="Énergie requise">{libelleNiveau(tache.niveauEnergieRequis).toLowerCase()}</span>
            {echeance && <span>{echeance}</span>}
            {tache.recurrenceRegle && <span title="Tâche récurrente">↻</span>}
            {tache.rappel && (
              <span title="Rappel activé" className="inline-flex text-airzen-neutral">
                <IconeCloche className="h-3 w-3" />
              </span>
            )}
            <IndicateurPlaisir tache={tache} />
            {projet && (
              <span className="inline-flex items-center gap-1.5" title={`Projet : ${projet.nom}`}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: projet.couleur }} />
                {projet.nom}
              </span>
            )}
          </div>
        )}
        {raison && <p className="mt-1 text-xs font-light text-airzen-secondary">{raison}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
    </article>
  );
}
