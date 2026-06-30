"use client";

// Étape 4 — Réglages : créneaux d'énergie de la journée + seuil d'urgence.
import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { libelleNiveau } from "@/lib/energie";
import { majProfilEnergie, majUtilisateur } from "@/lib/data/profil";
import type { NiveauEnergie, ProfilEnergie } from "@/lib/types";

const NIVEAUX: NiveauEnergie[] = ["haute", "moyenne", "basse"];

function Reglages() {
  const { user, utilisateur, profilsEnergie, rafraichir } = useAuth();
  // Copie locale éditable (initialisée depuis le profil déjà chargé par l'auth).
  const [creneaux, setCreneaux] = useState<ProfilEnergie[]>(() =>
    [...profilsEnergie].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
  );
  const [seuil, setSeuil] = useState(() => utilisateur?.seuilUrgenceJours ?? 3);
  const [enregistrement, setEnregistrement] = useState(false);
  const [messageOk, setMessageOk] = useState(false);

  function modifierCreneau(id: string, champs: Partial<ProfilEnergie>) {
    setCreneaux((prev) => prev.map((c) => (c.id === id ? { ...c, ...champs } : c)));
    setMessageOk(false);
  }

  async function enregistrer() {
    if (!user) return;
    setEnregistrement(true);
    setMessageOk(false);
    try {
      await Promise.all(
        creneaux.map((c) =>
          majProfilEnergie(c.id, {
            heureDebut: c.heureDebut,
            heureFin: c.heureFin,
            niveauEnergie: c.niveauEnergie,
          }),
        ),
      );
      await majUtilisateur(user.uid, { seuilUrgenceJours: seuil });
      await rafraichir();
      setMessageOk(true);
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-airzen-primary">Réglages</h1>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-airzen-primary">Mes créneaux d&apos;énergie</h2>
          <p className="mt-1 text-sm font-light text-airzen-secondary">
            L&apos;app déduit votre énergie du moment à partir de ces plages. Ajustez-les à
            votre rythme.
          </p>
        </div>

        {creneaux.map((c) => (
          <div key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-medium text-airzen-primary">{c.nomCreneau}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm text-airzen-secondary">
                de
                <input
                  type="time"
                  value={c.heureDebut}
                  onChange={(e) => modifierCreneau(c.id, { heureDebut: e.target.value })}
                  className="rounded-lg border border-airzen-neutral/60 px-2 py-1 text-airzen-primary outline-none focus:border-airzen-secondary"
                />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-airzen-secondary">
                à
                <input
                  type="time"
                  value={c.heureFin}
                  onChange={(e) => modifierCreneau(c.id, { heureFin: e.target.value })}
                  className="rounded-lg border border-airzen-neutral/60 px-2 py-1 text-airzen-primary outline-none focus:border-airzen-secondary"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-airzen-neutral">Énergie :</span>
              {NIVEAUX.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => modifierCreneau(c.id, { niveauEnergie: n })}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    c.niveauEnergie === n
                      ? "bg-airzen-primary font-medium text-white"
                      : "bg-airzen-bg text-airzen-secondary hover:bg-airzen-neutral/30"
                  }`}
                >
                  {libelleNiveau(n)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-airzen-primary">Seuil d&apos;urgence</h2>
        <p className="text-sm font-light text-airzen-secondary">
          Une tâche est « urgente » si son échéance est dans ce nombre de jours ou moins.
        </p>
        <label className="mt-1 flex items-center gap-2 text-sm text-airzen-secondary">
          <input
            type="number"
            min={1}
            max={30}
            value={seuil}
            onChange={(e) => {
              setSeuil(Math.max(1, Number(e.target.value)));
              setMessageOk(false);
            }}
            className="w-20 rounded-lg border border-airzen-neutral/60 px-2 py-1.5 text-airzen-primary outline-none focus:border-airzen-secondary"
          />
          jours
        </label>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={enregistrement}
          className="rounded-full bg-airzen-accent px-5 py-2.5 font-semibold text-airzen-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enregistrement ? "Enregistrement…" : "Enregistrer"}
        </button>
        {messageOk && <span className="text-sm text-airzen-secondary">Enregistré ✓</span>}
      </div>
    </div>
  );
}

export default function PageParametres() {
  return (
    <RequireAuth>
      <AppShell>
        <Reglages />
      </AppShell>
    </RequireAuth>
  );
}
