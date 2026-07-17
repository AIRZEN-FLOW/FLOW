"use client";

// Sélecteur "Liste / Tuiles" — deux boutons compacts, sans jargon.
import type { ModeAffichage } from "@/lib/hooks/useModeAffichage";

export function SelecteurAffichage({
  mode,
  onChange,
}: {
  mode: ModeAffichage;
  onChange: (m: ModeAffichage) => void;
}) {
  const options: { valeur: ModeAffichage; label: string }[] = [
    { valeur: "liste", label: "Liste" },
    { valeur: "tuile", label: "Tuiles" },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          onClick={() => onChange(o.valeur)}
          aria-pressed={mode === o.valeur}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            mode === o.valeur
              ? "bg-airzen-primary text-white"
              : "text-airzen-secondary hover:bg-airzen-bg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
