"use client";

// Bandeau "énergie du moment" en haut de l'écran principal (docs/04-design-system.md §3).
import type { NiveauEnergie } from "@/lib/types";
import { libelleNiveau } from "@/lib/energie";

const NIVEAUX: NiveauEnergie[] = ["haute", "moyenne", "basse"];

const COULEUR_NIVEAU: Record<NiveauEnergie, string> = {
  haute: "#76939D",
  moyenne: "#EDC426",
  basse: "#B3BEC4",
};

interface BandeauEnergieProps {
  energieEffective: NiveauEnergie | null;
  ajustementManuel: NiveauEnergie | null;
  onDefinir: (n: NiveauEnergie) => void;
  onReinitialiser: () => void;
}

export function BandeauEnergie({
  energieEffective,
  ajustementManuel,
  onDefinir,
  onReinitialiser,
}: BandeauEnergieProps) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: energieEffective ? COULEUR_NIVEAU[energieEffective] : "#D9D9D9" }}
          />
          <p className="text-sm text-airzen-secondary">
            Votre énergie maintenant :{" "}
            <span className="font-semibold text-airzen-primary">
              {energieEffective ? libelleNiveau(energieEffective) : "à préciser"}
            </span>
          </p>
        </div>
        {ajustementManuel && (
          <button
            type="button"
            onClick={onReinitialiser}
            className="text-xs text-airzen-neutral hover:text-airzen-secondary"
          >
            revenir à l&apos;automatique
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-airzen-neutral">Aujourd&apos;hui je me sens :</span>
        {NIVEAUX.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onDefinir(n)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              energieEffective === n
                ? "bg-airzen-primary font-medium text-white"
                : "bg-airzen-bg text-airzen-secondary hover:bg-airzen-neutral/30"
            }`}
          >
            {libelleNiveau(n)}
          </button>
        ))}
      </div>
    </section>
  );
}
