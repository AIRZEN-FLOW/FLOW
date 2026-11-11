"use client";

// Vue "Semaine" du calendrier — 7 colonnes × grille horaire (7h-21h). Les
// créneaux Google Agenda apparaissent en gris (lecture seule, useOccupations),
// les événements personnels en couleur (clic = éditer), et les tâches dont
// l'échéance tombe ce jour-là en petite tuile en haut de la colonne (elles
// n'ont pas d'heure précise, contrairement aux événements). Clic sur une zone
// vide de la grille = proposer de créer un événement à l'heure approchée.
import { useMemo, type MouseEvent } from "react";
import { useOccupations } from "@/lib/hooks/useOccupations";
import { QUADRANTS } from "@/lib/eisenhower";
import { tsEnDate } from "@/lib/format";
import type { EvenementCalendrier, Tache } from "@/lib/types";
import { ajouterJours, estMemeJour, NOMS_JOURS_COURTS } from "@/components/calendrier/utils";

const HEURE_DEBUT = 7;
const HEURE_FIN = 21;
const PX_PAR_HEURE = 48;

interface BlocPositionne {
  top: number;
  hauteur: number;
}

function positionner(debut: Date, fin: Date): BlocPositionne | null {
  const minutesFenetre = (HEURE_FIN - HEURE_DEBUT) * 60;
  const debutFenetre = new Date(debut).setHours(HEURE_DEBUT, 0, 0, 0);
  const m1 = Math.max(0, (debut.getTime() - debutFenetre) / 60000);
  const m2 = Math.min(minutesFenetre, (fin.getTime() - debutFenetre) / 60000);
  if (m2 <= m1) return null;
  return { top: (m1 / minutesFenetre) * 100, hauteur: ((m2 - m1) / minutesFenetre) * 100 };
}

function JourColonne({
  date,
  evenements,
  taches,
  onEvenementClic,
  onTacheClic,
  onCreerEvenement,
}: {
  date: Date;
  evenements: EvenementCalendrier[];
  taches: Tache[];
  onEvenementClic?: (e: EvenementCalendrier) => void;
  onTacheClic?: (t: Tache) => void;
  onCreerEvenement?: (date: Date) => void;
}) {
  const { occupations } = useOccupations(date);
  const aujourdhui = estMemeJour(date, new Date());

  const evenementsJour = evenements.filter((e) => estMemeJour(e.dateDebut.toDate(), date));
  const tachesJour = taches.filter((t) => {
    const echeance = tsEnDate(t.dateEcheance);
    return echeance && estMemeJour(echeance, date);
  });

  function surClicGrille(e: MouseEvent<HTMLDivElement>) {
    if (!onCreerEvenement) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const minutes = HEURE_DEBUT * 60 + ratio * (HEURE_FIN - HEURE_DEBUT) * 60;
    const heureCliquee = new Date(date);
    heureCliquee.setHours(0, Math.round(minutes / 15) * 15, 0, 0);
    onCreerEvenement(heureCliquee);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div
        className={`mb-1 rounded-lg py-1 text-center text-xs font-medium ${
          aujourdhui ? "bg-airzen-primary text-white" : "text-airzen-secondary"
        }`}
      >
        {NOMS_JOURS_COURTS[(date.getDay() + 6) % 7]} {date.getDate()}
      </div>

      {tachesJour.length > 0 && (
        <div className="mb-1 flex flex-col gap-0.5">
          {tachesJour.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTacheClic?.(t)}
              title={t.titre}
              className="truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium text-airzen-primary"
              style={{ backgroundColor: `${QUADRANTS[t.quadrantEisenhower].couleur}35` }}
            >
              {t.titre}
            </button>
          ))}
        </div>
      )}

      <div
        onClick={surClicGrille}
        className="relative rounded-lg bg-airzen-bg"
        style={{ height: (HEURE_FIN - HEURE_DEBUT) * PX_PAR_HEURE }}
      >
        {Array.from({ length: HEURE_FIN - HEURE_DEBUT }, (_, i) => (
          <div
            key={i}
            className="absolute inset-x-0 border-t border-airzen-neutral/20"
            style={{ top: i * PX_PAR_HEURE }}
          />
        ))}

        {(occupations ?? []).map((o, i) => {
          const pos = positionner(o.debut, o.fin);
          if (!pos) return null;
          return (
            <div
              key={`occ-${i}`}
              className="absolute inset-x-0.5 rounded bg-airzen-neutral/50 px-1 py-0.5 text-[9px] text-white"
              style={{ top: `${pos.top}%`, height: `${pos.hauteur}%` }}
              title="Occupé (agenda)"
            >
              Occupé
            </div>
          );
        })}

        {evenementsJour.map((e) => {
          const pos = positionner(e.dateDebut.toDate(), e.dateFin.toDate());
          if (!pos) return null;
          return (
            <button
              key={e.id}
              type="button"
              onClick={(ev) => {
                ev.stopPropagation();
                onEvenementClic?.(e);
              }}
              className="absolute inset-x-0.5 overflow-hidden rounded bg-airzen-secondary px-1 py-0.5 text-left text-[9px] font-medium text-white hover:opacity-90"
              style={{ top: `${pos.top}%`, height: `${Math.max(pos.hauteur, 3)}%` }}
              title={e.titre}
            >
              {e.titre}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendrierSemaine({
  lundi,
  evenements = [],
  taches = [],
  onEvenementClic,
  onTacheClic,
  onCreerEvenement,
}: {
  lundi: Date;
  evenements?: EvenementCalendrier[];
  taches?: Tache[];
  onEvenementClic?: (e: EvenementCalendrier) => void;
  onTacheClic?: (t: Tache) => void;
  onCreerEvenement?: (date: Date) => void;
}) {
  const jours = useMemo(() => Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i)), [lundi]);
  const heures = useMemo(
    () => Array.from({ length: HEURE_FIN - HEURE_DEBUT }, (_, i) => HEURE_DEBUT + i),
    [],
  );

  return (
    <div className="flex gap-1.5 overflow-x-auto">
      <div className="flex shrink-0 flex-col pt-[42px]">
        {heures.map((h) => (
          <div
            key={h}
            className="text-right text-[10px] text-airzen-neutral"
            style={{ height: PX_PAR_HEURE }}
          >
            {h}h
          </div>
        ))}
      </div>
      {jours.map((date) => (
        <JourColonne
          key={date.toISOString()}
          date={date}
          evenements={evenements}
          taches={taches}
          onEvenementClic={onEvenementClic}
          onTacheClic={onTacheClic}
          onCreerEvenement={onCreerEvenement}
        />
      ))}
    </div>
  );
}
