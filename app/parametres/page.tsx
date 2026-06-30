"use client";

// Réglages (profils d'énergie, seuils) — sera construit à l'Étape 4.
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";

export default function PageParametres() {
  return (
    <RequireAuth>
      <AppShell>
        <h1 className="text-2xl font-bold text-airzen-primary">Réglages</h1>
        <p className="mt-3 font-light text-airzen-secondary">
          Cette section arrive bientôt.
        </p>
      </AppShell>
    </RequireAuth>
  );
}
