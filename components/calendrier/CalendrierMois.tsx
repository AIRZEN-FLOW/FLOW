"use client";

// Vue "Mois" du calendrier — grille de semaines, chaque case affiche les
// événements personnels et les tâches dont l'échéance tombe ce jour-là.
// Réutilisable en mode simple lecture seule (fiche projet, voir Lot 7) en ne
// passant que `taches` et aucun handler d'événement.
import { useMemo } from "react";
import { QUADRANTS } from "@/lib/eisenhower";
import { tsEnDate } from "@/lib/format";
import type { EvenementCalendrier, Tache } from "@/lib/types";
import { NOMS_JOURS_COURTS, estMemeJour, grilleMois, nomMoisAnnee } from "@/components/calendrier/utils";
import { IconePlus } from "@/components/icones";

interface CalendrierMoisProps {
  mois: Date;
  taches?: Tache[];
  evenements?: EvenementCalendrier[];
  onTacheClic?: (t: Tache) => void;
  onEvenementClic?: (e: EvenementCalendrier) => void;
  onJourClic?: (date: Date) => void;
  onAjouterEvenement?: (date: Date) => void;
}

export function CalendrierMois({
  mois,
  taches = [],
  evenements = [],
  onTacheClic,
  onEvenementClic,
  onJourClic,
  onAjouterEvenement,
}: CalendrierMoisProps) {
  const jours = useMemo(() => grilleMois(mois), [mois]);
  const aujourdhui = new Date();

  function tachesDuJour(date: Date): Tache[] {
    return taches.filter((t) => {
      const echeance = tsEnDate(t.dateEcheance);
      return echeance && estMemeJour(echeance, date);
    });
  }

  function evenementsDuJour(date: Date): EvenementCalendrier[] {
    return evenements.filter((e) => estMemeJour(e.dateDebut.toDate(), date));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-airzen-primary">{nomMoisAnnee(mois)}</p>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-medium text-airzen-neutral">
        {NOMS_JOURS_COURTS.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {jours.map((date) => {
          const horsMois = date.getMonth() !== mois.getMonth();
          const estAujourdhui = estMemeJour(date, aujourdhui);
          const tachesJour = tachesDuJour(date);
          const evenementsJour = evenementsDuJour(date);
          const elements = [
            ...evenementsJour.map((e) => ({ type: "evenement" as const, e })),
            ...tachesJour.map((t) => ({ type: "tache" as const, t })),
          ];
          const visibles = elements.slice(0, 3);
          const reste = elements.length - visibles.length;

          return (
            <div
              key={date.toISOString()}
              className={`group flex min-h-[74px] flex-col gap-0.5 rounded-lg p-1 ${
                horsMois ? "bg-transparent" : "bg-airzen-bg"
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onJourClic?.(date)}
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] transition-colors ${
                    estAujourdhui
                      ? "bg-airzen-primary font-semibold text-white"
                      : horsMois
                        ? "text-airzen-neutral/50"
                        : "text-airzen-primary hover:bg-airzen-neutral/20"
                  }`}
                >
                  {date.getDate()}
                </button>
                {onAjouterEvenement && !horsMois && (
                  <button
                    type="button"
                    onClick={() => onAjouterEvenement(date)}
                    aria-label="Ajouter un événement"
                    className="hidden h-5 w-5 items-center justify-center rounded-full text-airzen-neutral hover:bg-airzen-neutral/20 group-hover:flex"
                  >
                    <IconePlus className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {visibles.map((el, i) =>
                  el.type === "evenement" ? (
                    <button
                      key={`e-${i}`}
                      type="button"
                      onClick={() => onEvenementClic?.(el.e)}
                      title={el.e.titre}
                      className="truncate rounded bg-airzen-secondary/25 px-1 py-0.5 text-left text-[10px] font-medium text-airzen-primary hover:bg-airzen-secondary/40"
                    >
                      {el.e.titre}
                    </button>
                  ) : (
                    <button
                      key={`t-${i}`}
                      type="button"
                      onClick={() => onTacheClic?.(el.t)}
                      title={el.t.titre}
                      className="truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-airzen-primary"
                      style={{ backgroundColor: `${QUADRANTS[el.t.quadrantEisenhower].couleur}35` }}
                    >
                      {el.t.titre}
                    </button>
                  ),
                )}
                {reste > 0 && (
                  <span className="px-1 text-[10px] text-airzen-neutral">+{reste}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
