"use client";

// Écran principal "Aujourd'hui".
// Étape 2 : accueil connecté (l'écran sera enrichi avec le fil de suggestions à l'Étape 4).
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";

function Accueil() {
  const { utilisateur } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-airzen-primary">
          Bonjour {utilisateur?.nomAffiche} 🌿
        </h1>
        <p className="mt-2 font-light leading-relaxed text-airzen-secondary">
          Votre espace est prêt. On va construire, étape par étape, l&apos;outil qui
          décide avec vous quoi faire et quand.
        </p>
      </div>

      <Link
        href="/taches"
        className="self-start rounded-full bg-airzen-accent px-5 py-3 font-semibold text-airzen-primary transition-opacity hover:opacity-90"
      >
        Voir mes tâches
      </Link>
    </div>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <AppShell>
        <Accueil />
      </AppShell>
    </RequireAuth>
  );
}
