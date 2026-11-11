"use client";

// Coque des écrans connectés. La navigation tient en 3 entrées (Maintenant,
// Mes tâches, Projets) : barre latérale sur ordinateur, barre fixe en bas sur
// téléphone (toujours visible, pas de menu caché). Réglages est une icône ;
// Planning, Mon bilan et Tâches terminées s'ouvrent par des liens dans les écrans.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LogoAirZen } from "@/components/LogoAirZen";
import { GestionnaireRappels } from "@/components/GestionnaireRappels";
import { useProjets } from "@/lib/hooks/useProjets";
import { useEnergieMoment } from "@/lib/hooks/useEnergieMoment";
import {
  minutesAvantProchaineOccupation,
  useOccupations,
} from "@/lib/hooks/useOccupations";
import { libelleNiveau } from "@/lib/energie";
import { formatDuree } from "@/lib/format";
import {
  IconeAujourdhui,
  IconeMail,
  IconeProjetsNav,
  IconeReglagesNav,
  IconeTachesNav,
} from "@/components/icones";

export const LIEN_BETA_TESTEUR =
  "mailto:contact.airzen@free.fr?subject=" +
  encodeURIComponent("Retour bêta test AIR ZEN Flow");

interface LienNav {
  href: string;
  label: string;
  icone: (props: { className?: string }) => ReactNode;
}

const NAVIGATION: LienNav[] = [
  { href: "/", label: "Maintenant", icone: IconeAujourdhui },
  { href: "/taches", label: "Mes tâches", icone: IconeTachesNav },
  { href: "/projets", label: "Projets", icone: IconeProjetsNav },
];

// "/" n'est actif que sur l'accueil ; les autres le sont aussi sur leurs sous-pages.
function estActif(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// Bandeau discret : énergie du moment + temps avant le prochain rendez-vous,
// pour un repère permanent sans avoir à revenir sur "Maintenant".
function BentoEnergie() {
  const { energieEffective } = useEnergieMoment();
  const { occupations, connecte } = useOccupations();

  const tempsTexte = useMemo(() => {
    if (!connecte || !occupations) return null;
    const creneau = minutesAvantProchaineOccupation(occupations);
    if (creneau === null) return "journée libre";
    if (creneau.minutes === 0) return "en rendez-vous";
    return `${formatDuree(creneau.minutes)} dispo`;
  }, [connecte, occupations]);

  if (!energieEffective) return null;

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-airzen-bg px-3.5 py-2.5">
      <span className="h-2 w-2 shrink-0 rounded-full bg-airzen-accent" aria-hidden />
      <span className="text-[11px] text-airzen-secondary">
        Énergie {libelleNiveau(energieEffective).toLowerCase()}
        {tempsTexte ? ` · ${tempsTexte}` : ""}
      </span>
    </div>
  );
}

function ContenuSidebar() {
  const pathname = usePathname();
  const { utilisateur, seDeconnecter } = useAuth();
  const { projets } = useProjets();

  const projetsActifs = projets.filter((p) => p.statut === "actif");
  const surEcranProjets = pathname.startsWith("/projets");

  return (
    <div className="flex h-full flex-col justify-between gap-5 overflow-y-auto p-4">
      <div className="flex flex-col gap-5">
        <Link href="/" className="flex items-center gap-2.5 px-2 py-0.5">
          <LogoAirZen taille={32} />
          <span className="text-[15px] font-semibold text-airzen-primary">AIR ZEN Flow</span>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAVIGATION.map((lien) => {
            const actif = estActif(pathname, lien.href);
            const Icone = lien.icone;
            return (
              <Link
                key={lien.href}
                href={lien.href}
                className={`flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm transition-colors ${
                  actif
                    ? "bg-airzen-accent/25 font-semibold text-airzen-primary"
                    : "font-medium text-airzen-secondary hover:bg-airzen-bg hover:text-airzen-primary"
                }`}
              >
                <Icone className={`h-[19px] w-[19px] shrink-0 ${actif ? "text-airzen-primary" : "text-airzen-secondary"}`} />
                {lien.label}
              </Link>
            );
          })}

          {/* Raccourcis vers les projets actifs, seulement quand on est dans Projets. */}
          {surEcranProjets && projetsActifs.length > 0 && (
            <div className="mt-0.5 flex flex-col gap-0.5 pl-[30px]">
              {projetsActifs.map((p) => {
                const actif = pathname.startsWith(`/projets/${p.id}`);
                return (
                  <Link
                    key={p.id}
                    href={`/projets/${p.id}`}
                    className={`flex min-w-0 items-center gap-2.5 rounded-full px-3 py-2 text-[13px] transition-colors ${
                      actif
                        ? "bg-airzen-accent/20 font-semibold text-airzen-primary"
                        : "text-airzen-secondary hover:bg-airzen-bg"
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: p.couleur }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate" title={p.nom}>
                      {p.nom}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-2.5">
        <BentoEnergie />
        <Link
          href="/parametres"
          className={`flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm transition-colors ${
            pathname.startsWith("/parametres")
              ? "bg-airzen-accent/25 font-semibold text-airzen-primary"
              : "font-medium text-airzen-secondary hover:bg-airzen-bg hover:text-airzen-primary"
          }`}
        >
          <IconeReglagesNav
            className={`h-[19px] w-[19px] shrink-0 ${
              pathname.startsWith("/parametres") ? "text-airzen-primary" : "text-airzen-secondary"
            }`}
          />
          Réglages
        </Link>
        <a
          href={LIEN_BETA_TESTEUR}
          className="flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium text-airzen-secondary transition-colors hover:bg-airzen-bg hover:text-airzen-primary"
        >
          <IconeMail className="h-[19px] w-[19px] shrink-0 text-airzen-secondary" />
          Commentaire bêta testeur
        </a>
        <div className="flex items-center justify-between gap-2 px-3.5 pt-1">
          {utilisateur && (
            <span className="min-w-0 truncate text-xs text-airzen-neutral" title={utilisateur.nomAffiche}>
              {utilisateur.nomAffiche}
            </span>
          )}
          <button
            type="button"
            onClick={seDeconnecter}
            className="shrink-0 text-xs font-medium text-airzen-secondary transition-colors hover:text-airzen-primary"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const surReglages = pathname.startsWith("/parametres");

  return (
    <div className="flex min-h-svh w-full flex-1 bg-airzen-bg">
      {/* Barre latérale — ordinateur uniquement (à partir de md). */}
      <aside className="hidden shrink-0 border-r border-airzen-neutral/30 bg-white md:sticky md:top-0 md:flex md:h-svh md:w-[236px]">
        <ContenuSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre du haut — téléphone uniquement : logo + icône Réglages. */}
        <header className="flex items-center justify-between border-b border-airzen-neutral/30 bg-white px-4 py-2.5 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <LogoAirZen taille={26} />
            <span className="text-sm font-semibold text-airzen-primary">AIR ZEN Flow</span>
          </Link>
          <Link
            href="/parametres"
            aria-label="Réglages"
            title="Réglages"
            className={`rounded-full p-2 transition-colors ${
              surReglages
                ? "bg-airzen-accent/25 text-airzen-primary"
                : "text-airzen-secondary hover:bg-airzen-bg"
            }`}
          >
            <IconeReglagesNav className="h-5 w-5" />
          </Link>
        </header>

        {/* pb-24 sur téléphone : laisse la place à la barre du bas. */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-11 md:py-9">
          {children}
        </main>
      </div>

      {/* Barre du bas — téléphone uniquement : les 3 écrans, toujours sous le pouce. */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-airzen-neutral/30 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAVIGATION.map((lien) => {
          const actif = estActif(pathname, lien.href);
          const Icone = lien.icone;
          return (
            <Link
              key={lien.href}
              href={lien.href}
              aria-current={actif ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] transition-colors ${
                actif ? "font-semibold text-airzen-primary" : "font-medium text-airzen-secondary"
              }`}
            >
              <span
                className={`flex h-7 w-14 items-center justify-center rounded-full ${
                  actif ? "bg-airzen-accent/30" : ""
                }`}
              >
                <Icone className="h-5 w-5" />
              </span>
              {lien.label}
            </Link>
          );
        })}
      </nav>
      <GestionnaireRappels />
    </div>
  );
}
