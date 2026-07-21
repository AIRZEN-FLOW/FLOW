"use client";

// En-tête discret de l'écran "Aujourd'hui" : salutation selon l'heure, météo
// optionnelle, citation du jour (voir lib/citations.ts — uniquement des
// citations réelles et vérifiées). Tient sur une seule ligne pour ne pas
// prendre le pas sur les tâches — masquable dans Réglages > Accueil.
import { useMemo } from "react";
import { citationDuJour } from "@/lib/citations";
import { MeteoWidget } from "@/components/MeteoWidget";
import { usePreferenceLocale } from "@/lib/hooks/usePreferenceLocale";

export const CLE_CITATION_VISIBLE = "airzen-citation-visible";

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
  const [citationVisible] = usePreferenceLocale(CLE_CITATION_VISIBLE, true);
  const citation = useMemo(() => citationDuJour(maintenant), [maintenant]);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
      <span className="shrink-0 font-medium text-airzen-primary">
        {salutation(maintenant.getHours())}
        {prenom ? `, ${prenom}` : ""} <span aria-hidden>🌿</span>
      </span>
      {citationVisible && (
        <>
          <span className="shrink-0 text-airzen-accent" aria-hidden>
            ·
          </span>
          <span
            className="min-w-0 flex-1 truncate font-light italic text-airzen-secondary"
            title={`${citation.texte} — ${citation.auteur}`}
          >
            « {citation.texte} » — {citation.auteur}
          </span>
        </>
      )}
      <MeteoWidget />
    </div>
  );
}
