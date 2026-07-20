"use client";

// En-tête chaleureux de l'écran "Aujourd'hui" : salutation selon l'heure,
// météo optionnelle, citation du jour (voir lib/citations.ts — uniquement des
// citations réelles et vérifiées). Une touche de jaune AIR ZEN en décoration
// (bordure de la citation), sans surcharger l'écran.
import { useMemo } from "react";
import { citationDuJour } from "@/lib/citations";
import { MeteoWidget } from "@/components/MeteoWidget";

function salutation(heure: number): string {
  if (heure >= 5 && heure < 12) return "Bonjour";
  if (heure >= 12 && heure < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function EnTeteAccueil({
  prenom,
  maintenant,
}: {
  prenom?: string;
  maintenant: Date;
}) {
  const citation = useMemo(() => citationDuJour(maintenant), [maintenant]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold text-airzen-primary">
          {salutation(maintenant.getHours())}
          {prenom ? `, ${prenom}` : ""} <span aria-hidden>🌿</span>
        </p>
        <MeteoWidget />
      </div>
      <p className="mt-3 border-l-2 border-airzen-accent pl-3 text-sm font-light italic text-airzen-secondary">
        <span className="mr-1 text-airzen-accent">❝</span>
        {citation.texte}
      </p>
      <p className="mt-1 pl-3 text-xs text-airzen-neutral">— {citation.auteur}</p>
    </div>
  );
}
