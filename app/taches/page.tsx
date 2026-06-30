"use client";

// Gestion des tâches — sera construite à l'Étape 3.
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";

export default function PageTaches() {
  return (
    <RequireAuth>
      <AppShell>
        <h1 className="text-2xl font-bold text-airzen-primary">Mes tâches</h1>
        <p className="mt-3 font-light text-airzen-secondary">
          Cette section arrive très bientôt.
        </p>
      </AppShell>
    </RequireAuth>
  );
}
