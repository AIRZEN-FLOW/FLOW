"use client";

// Légende du code couleur Eisenhower — repliée par défaut pour rester "zen",
// dépliable via un simple lien pour expliquer où et comment lire les couleurs.
import { useState } from "react";
import { QUADRANTS } from "@/lib/eisenhower";
import type { Quadrant } from "@/lib/types";

const ORDRE: Quadrant[] = ["q1", "q2", "q3", "q4"];

const EXPLICATION: Record<Quadrant, string> = {
  q1: "urgent et important — à faire maintenant",
  q2: "important, pas urgent — le travail de fond à planifier",
  q3: "urgent, pas important — à déléguer ou minimiser",
  q4: "ni urgent ni important — à éliminer ou différer",
};

export function LegendeQuadrants() {
  const [ouverte, setOuverte] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOuverte((v) => !v)}
        className="text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
      >
        {ouverte ? "– Masquer la légende des couleurs" : "ⓘ Que signifient ces couleurs ?"}
      </button>

      {ouverte && (
        <div className="mt-2 flex flex-col gap-1.5 rounded-2xl bg-white p-4 text-sm shadow-sm">
          {ORDRE.map((q) => (
            <div key={q} className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: QUADRANTS[q].couleur }}
              />
              <span className="font-medium text-airzen-primary">{QUADRANTS[q].label}</span>
              <span className="text-airzen-secondary">— {EXPLICATION[q]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
