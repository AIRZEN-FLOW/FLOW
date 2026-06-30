"use client";

// Garde de route : redirige vers /login si l'utilisatrice n'est pas connectée.
// Affiche un état de chargement discret pendant la vérification.
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LogoAirZen } from "@/components/LogoAirZen";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, chargement } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!chargement && !user) router.replace("/login");
  }, [chargement, user, router]);

  if (chargement || !user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <LogoAirZen className="animate-pulse" />
        <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
      </main>
    );
  }

  return <>{children}</>;
}
