"use client";

// Vue "Année" — 12 mini-mois façon Google Calendar, uniquement pour naviguer :
// cliquer un jour ouvre la vue Mois correspondante. Pas de création
// d'événement à ce niveau de zoom (une seule action mise en avant par écran,
// voir docs/04-design-system.md §2).
import { useMemo } from "react";
import { tsEnDate } from "@/lib/format";
import type { EvenementCalendrier, Tache } from "@/lib/types";
import { estMemeJour, grilleMois } from "@/components/calendrier/utils";

interface CalendrierAnneeProps {
  annee: number;
  taches?: Tache[];
  evenements?: EvenementCalendrier[];
  onJourClic: (date: Date) => void;
}

function MiniMois({
  mois,
  aDesElements,
  onJourClic,
}: {
  mois: Date;
  aDesElements: (date: Date) => boolean;
  onJourClic: (date: Date) => void;
}) {
  const jours = useMemo(() => grilleMois(mois), [mois]);
  const aujourdhui = new Date();
  const nom = mois.toLocaleDateString("fr-FR", { month: "long" });

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold capitalize text-airzen-primary">{nom}</p>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {jours.map((date) => {
          const horsMois = date.getMonth() !== mois.getMonth();
          const estAujourdhui = estMemeJour(date, aujourdhui);
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onJourClic(date)}
              className={`flex h-5 w-5 flex-col items-center justify-center rounded-full text-[9px] transition-colors ${
                horsMois
                  ? "text-airzen-neutral/40"
                  : estAujourdhui
                    ? "bg-airzen-primary font-semibold text-white"
                    : "text-airzen-secondary hover:bg-airzen-bg"
              }`}
            >
              {date.getDate()}
              {!horsMois && aDesElements(date) && !estAujourdhui && (
                <span className="-mt-0.5 h-1 w-1 rounded-full bg-airzen-accent" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendrierAnnee({ annee, taches = [], evenements = [], onJourClic }: CalendrierAnneeProps) {
  const mois = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(annee, i, 1)),
    [annee],
  );

  function aDesElements(date: Date): boolean {
    return (
      taches.some((t) => {
        const echeance = tsEnDate(t.dateEcheance);
        return echeance && estMemeJour(echeance, date);
      }) || evenements.some((e) => estMemeJour(e.dateDebut.toDate(), date))
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {mois.map((m) => (
        <MiniMois key={m.getMonth()} mois={m} aDesElements={aDesElements} onJourClic={onJourClic} />
      ))}
    </div>
  );
}
