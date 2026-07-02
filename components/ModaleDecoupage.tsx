"use client";

// Étape 6 — Modale de proposition de découpage par l'IA.
// Affiche les sous-tâches proposées avec cases à cocher ; l'utilisatrice peut
// modifier titres/durées, accepter, ou refuser et garder la tâche entière.
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { SaisieTache } from "@/lib/types";

export interface SousTacheChoisie {
  titre: string;
  dureeEstimeeMinutes: number;
}

interface LigneProposition extends SousTacheChoisie {
  retenue: boolean;
}

interface ModaleDecoupageProps {
  saisie: SaisieTache; // la tâche longue en cours de création
  onCreerEntiere: () => void; // refuser le découpage
  onCreerAvecSousTaches: (sousTaches: SousTacheChoisie[]) => void;
  onAnnuler: () => void;
}

export function ModaleDecoupage({
  saisie,
  onCreerEntiere,
  onCreerAvecSousTaches,
  onAnnuler,
}: ModaleDecoupageProps) {
  const { user } = useAuth();
  const [lignes, setLignes] = useState<LigneProposition[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [creation, setCreation] = useState(false);

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const jeton = await user?.getIdToken();
        const reponse = await fetch("/api/decoupage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jeton}`,
          },
          body: JSON.stringify({
            titre: saisie.titre,
            description: saisie.description,
            dureeEstimeeMinutes: saisie.dureeEstimeeMinutes,
          }),
        });
        const donnees = await reponse.json();
        if (!actif) return;
        if (!reponse.ok) {
          setErreur(donnees?.erreur ?? "Le découpage n'a pas abouti.");
        } else {
          setLignes(
            donnees.sousTaches.map((s: SousTacheChoisie) => ({ ...s, retenue: true })),
          );
        }
      } catch {
        if (actif) setErreur("Impossible de joindre le service de découpage.");
      }
    })();
    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function modifier(index: number, champs: Partial<LigneProposition>) {
    setLignes((prev) =>
      prev ? prev.map((l, i) => (i === index ? { ...l, ...champs } : l)) : prev,
    );
  }

  const retenues = (lignes ?? []).filter((l) => l.retenue && l.titre.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-airzen-primary/30 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-airzen-primary">
          Cette tâche est longue — on la découpe ?
        </h2>
        <p className="mt-1 text-sm font-light text-airzen-secondary">
          « {saisie.titre} » ({saisie.dureeEstimeeMinutes} min). Voici une proposition
          de découpage — modifiable, et vous gardez la décision finale.
        </p>

        <div className="mt-5">
          {erreur ? (
            <p className="rounded-lg bg-q1/10 px-3 py-2 text-sm text-q1">{erreur}</p>
          ) : lignes === null ? (
            <p className="animate-pulse text-sm font-light text-airzen-secondary">
              L&apos;IA prépare une proposition…
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {lignes.map((l, i) => (
                <li key={i} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={l.retenue}
                    onChange={(e) => modifier(i, { retenue: e.target.checked })}
                    className="h-4 w-4 shrink-0 accent-airzen-primary"
                    aria-label={`Retenir « ${l.titre} »`}
                  />
                  <input
                    type="text"
                    value={l.titre}
                    onChange={(e) => modifier(i, { titre: e.target.value })}
                    className={`min-w-0 flex-1 rounded-lg border border-airzen-neutral/60 px-2.5 py-1.5 text-sm text-airzen-primary outline-none focus:border-airzen-secondary ${
                      l.retenue ? "" : "opacity-50"
                    }`}
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-airzen-secondary">
                    <input
                      type="number"
                      min={1}
                      value={l.dureeEstimeeMinutes}
                      onChange={(e) =>
                        modifier(i, { dureeEstimeeMinutes: Math.max(1, Number(e.target.value)) })
                      }
                      className={`w-16 rounded-lg border border-airzen-neutral/60 px-2 py-1.5 text-airzen-primary outline-none focus:border-airzen-secondary ${
                        l.retenue ? "" : "opacity-50"
                      }`}
                    />
                    min
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {lignes !== null && retenues.length >= 1 && (
            <button
              type="button"
              disabled={creation}
              onClick={async () => {
                setCreation(true);
                try {
                  await onCreerAvecSousTaches(
                    retenues.map(({ titre, dureeEstimeeMinutes }) => ({
                      titre: titre.trim(),
                      dureeEstimeeMinutes,
                    })),
                  );
                } finally {
                  setCreation(false);
                }
              }}
              className="rounded-full bg-airzen-accent px-5 py-2.5 font-semibold text-airzen-primary transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {creation ? "Création…" : `Créer avec ${retenues.length} sous-tâche${retenues.length > 1 ? "s" : ""}`}
            </button>
          )}
          <button
            type="button"
            disabled={creation}
            onClick={onCreerEntiere}
            className="text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
          >
            Garder la tâche entière
          </button>
          <button
            type="button"
            disabled={creation}
            onClick={onAnnuler}
            className="text-sm text-airzen-neutral hover:text-airzen-secondary"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
