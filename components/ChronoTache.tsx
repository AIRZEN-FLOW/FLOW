"use client";

// Chronomètre par tâche : temps réellement passé, avec pause/reprise
// persistante (voir lib/data/taches.ts — demarrerChrono/mettreEnPauseChrono).
// Le temps affiché se met à jour chaque seconde pendant que le chrono tourne ;
// à la pause, il reste figé jusqu'à la prochaine reprise.
import { useEffect, useState } from "react";
import type { Tache } from "@/lib/types";
import { tsEnDate } from "@/lib/format";
import { IconeLecture, IconePause } from "@/components/icones";

function minutesEcoulees(tache: Tache, maintenant: number): number {
  const base = tache.tempsPasseMinutes ?? 0;
  const debut = tsEnDate(tache.chronoDemarreLe ?? null);
  if (!debut) return base;
  return base + Math.max(0, (maintenant - debut.getTime()) / 60000);
}

function formatChrono(minutesTotal: number): string {
  const totalSecondes = Math.round(minutesTotal * 60);
  const h = Math.floor(totalSecondes / 3600);
  const m = Math.floor((totalSecondes % 3600) / 60);
  const s = totalSecondes % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function ChronoTache({
  tache,
  onDemarrer,
  onPause,
}: {
  tache: Tache;
  onDemarrer: () => void;
  onPause: () => void;
}) {
  const enCours = Boolean(tache.chronoDemarreLe);
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    if (!enCours) return;
    const intervalle = window.setInterval(() => setMaintenant(Date.now()), 1000);
    return () => window.clearInterval(intervalle);
  }, [enCours]);

  const minutes = minutesEcoulees(tache, enCours ? maintenant : Date.now());

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          enCours ? onPause() : onDemarrer();
        }}
        aria-label={enCours ? "Mettre le chronomètre en pause" : "Démarrer le chronomètre"}
        title={enCours ? "Mettre en pause" : "Démarrer le chronomètre"}
        className={`shrink-0 rounded-full p-1.5 transition-colors hover:bg-airzen-bg ${
          enCours ? "text-airzen-primary" : "text-airzen-secondary"
        }`}
      >
        {enCours ? <IconePause /> : <IconeLecture />}
      </button>
      {(enCours || minutes >= 1) && (
        <span className="text-[11px] tabular-nums text-airzen-secondary" title="Temps réellement passé">
          {formatChrono(minutes)}
        </span>
      )}
    </div>
  );
}
