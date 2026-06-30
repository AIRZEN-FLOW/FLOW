"use client";

// Coque des écrans connectés : en-tête (logo + déconnexion) et navigation.
// La navigation s'enrichit au fil des étapes du plan de développement.
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LogoAirZen } from "@/components/LogoAirZen";

interface LienNav {
  href: string;
  label: string;
}

const NAVIGATION: LienNav[] = [
  { href: "/", label: "Aujourd'hui" },
  { href: "/taches", label: "Tâches" },
  { href: "/projets", label: "Projets" },
  { href: "/parametres", label: "Réglages" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { utilisateur, seDeconnecter } = useAuth();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-airzen-neutral/30 bg-white">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoAirZen taille={32} />
            <span className="font-semibold text-airzen-primary">AIR ZEN Flow</span>
          </Link>
          <div className="flex items-center gap-3">
            {utilisateur && (
              <span className="hidden text-sm text-airzen-secondary sm:inline">
                {utilisateur.nomAffiche}
              </span>
            )}
            <button
              type="button"
              onClick={seDeconnecter}
              className="text-sm font-medium text-airzen-secondary transition-colors hover:text-airzen-primary"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        <nav className="mx-auto w-full max-w-2xl px-5">
          <ul className="flex gap-1 overflow-x-auto">
            {NAVIGATION.map((lien) => {
              const actif =
                lien.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(lien.href);
              return (
                <li key={lien.href}>
                  <Link
                    href={lien.href}
                    className={`inline-block border-b-2 px-3 py-2.5 text-sm transition-colors ${
                      actif
                        ? "border-airzen-accent font-semibold text-airzen-primary"
                        : "border-transparent font-medium text-airzen-secondary hover:text-airzen-primary"
                    }`}
                  >
                    {lien.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
