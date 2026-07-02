"use client";

// Carte de tâche : la brique de base, visible dans les listes et les suggestions
// (voir docs/04-design-system.md §3).
import type { Tache } from "@/lib/types";
import { BadgeQuadrant } from "@/components/BadgeQuadrant";
import { libelleNiveau } from "@/lib/energie";
import { formatDuree, formatEcheance, tsEnDate } from "@/lib/format";

interface CarteTacheProps {
  tache: Tache;
  raison?: string; // "pourquoi maintenant" (suggestions)
  attenue?: boolean; // affichage en retrait (second plan / terminée)
  projet?: { nom: string; couleur: string }; // pastille projet, si rattachée
  onTerminer?: (t: Tache) => void;
  onRouvrir?: (t: Tache) => void;
  onSupprimer?: (t: Tache) => void;
}

export function CarteTache({
  tache,
  raison,
  attenue = false,
  projet,
  onTerminer,
  onRouvrir,
  onSupprimer,
}: CarteTacheProps) {
  const terminee = tache.statut === "terminee";
  const echeance = formatEcheance(tsEnDate(tache.dateEcheance));

  return (
    <article
      className={`rounded-2xl bg-white p-4 shadow-sm transition-opacity ${
        attenue || terminee ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={`font-medium text-airzen-primary ${terminee ? "line-through" : ""}`}
          >
            {tache.titre}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-airzen-secondary">
            <BadgeQuadrant quadrant={tache.quadrantEisenhower} avecLabel={false} />
            <span>{formatDuree(tache.dureeEstimeeMinutes)}</span>
            <span title="Énergie requise">
              énergie {libelleNiveau(tache.niveauEnergieRequis).toLowerCase()}
            </span>
            {echeance && <span>échéance {echeance}</span>}
            {tache.recurrenceRegle && (
              <span title="Tâche récurrente" aria-label="Tâche récurrente">
                ↻ récurrente
              </span>
            )}
            {projet && (
              <span
                className="inline-flex items-center gap-1.5"
                title={`Projet : ${projet.nom}`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: projet.couleur }}
                />
                {projet.nom}
              </span>
            )}
          </div>
          {raison && (
            <p className="mt-2 text-xs font-light text-airzen-secondary">{raison}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {!terminee && onTerminer && (
            <button
              type="button"
              onClick={() => onTerminer(tache)}
              className="rounded-full bg-airzen-bg px-3 py-1.5 text-xs font-medium text-airzen-primary transition-colors hover:bg-airzen-neutral/30"
            >
              Terminer
            </button>
          )}
          {terminee && onRouvrir && (
            <button
              type="button"
              onClick={() => onRouvrir(tache)}
              className="rounded-full bg-airzen-bg px-3 py-1.5 text-xs font-medium text-airzen-secondary transition-colors hover:bg-airzen-neutral/30"
            >
              Rouvrir
            </button>
          )}
          {onSupprimer && (
            <button
              type="button"
              onClick={() => onSupprimer(tache)}
              className="text-xs text-airzen-neutral transition-colors hover:text-q1"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
