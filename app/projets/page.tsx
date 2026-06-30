"use client";

// Projets — sera construit à l'Étape 5.
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";

export default function PageProjets() {
  return (
    <RequireAuth>
      <AppShell>
        <h1 className="text-2xl font-bold text-airzen-primary">Mes projets</h1>
        <p className="mt-3 font-light text-airzen-secondary">
          Cette section arrive bientôt.
        </p>
      </AppShell>
    </RequireAuth>
  );
}
