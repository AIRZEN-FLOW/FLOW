"use client";

// Coque des écrans connectés : barre latérale de navigation (desktop) qui
// devient un tiroir coulissant sur mobile, plus le contenu de l'écran.
// Refonte visuelle (voir "AIR ZEN Flow.dc.html") : la navigation horizontale
// texte-seul a été remplacée par une sidebar avec icônes et sous-menu Projets.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
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
  IconeCalendrier,
  IconeChevronDroite,
  IconeFermer,
  IconeMenu,
  IconeProjetsNav,
  IconeReglagesNav,
  IconeTableauDeBord,
  IconeTachesNav,
} from "@/components/icones";

interface LienNav {
  href: string;
  label: string;
  icone: (props: { className?: string }) => ReactNode;
}

const NAVIGATION: LienNav[] = [
  { href: "/", label: "Tableau de bord", icone: IconeTableauDeBord },
  { href: "/aujourdhui", label: "Aujourd'hui", icone: IconeAujourdhui },
  { href: "/taches", label: "Tâches", icone: IconeTachesNav },
  { href: "/planning", label: "Planning", icone: IconeCalendrier },
];

// Bandeau discret : énergie du moment + temps avant le prochain rendez-vous,
// pour un repère permanent sans avoir à aller sur "Aujourd'hui".
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

function ContenuSidebar({ onNaviguer }: { onNaviguer?: () => void }) {
  const pathname = usePathname();
  const { utilisateur, seDeconnecter } = useAuth();
  const { projets } = useProjets();
  const [projetsOuvert, setProjetsOuvert] = useState(true);

  const projetsActifs = projets.filter((p) => p.statut === "actif");
  const surEcranProjets = pathname.startsWith("/projets");

  return (
    <div className="flex h-full flex-col justify-between gap-5 overflow-y-auto p-4">
      <div className="flex flex-col gap-5">
        <Link href="/" onClick={onNaviguer} className="flex items-center gap-2.5 px-2 py-0.5">
          <LogoAirZen taille={32} />
          <span className="text-[15px] font-semibold text-airzen-primary">AIR ZEN Flow</span>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAVIGATION.map((lien) => {
            const actif = lien.href === "/" ? pathname === "/" : pathname.startsWith(lien.href);
            const Icone = lien.icone;
            return (
              <Link
                key={lien.href}
                href={lien.href}
                onClick={onNaviguer}
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

          <div className="flex items-center gap-1">
            <Link
              href="/projets"
              onClick={onNaviguer}
              className={`flex flex-1 items-center gap-3 rounded-full px-3.5 py-2.5 text-sm transition-colors ${
                surEcranProjets
                  ? "bg-airzen-accent/25 font-semibold text-airzen-primary"
                  : "font-medium text-airzen-secondary hover:bg-airzen-bg hover:text-airzen-primary"
              }`}
            >
              <IconeProjetsNav
                className={`h-[19px] w-[19px] shrink-0 ${surEcranProjets ? "text-airzen-primary" : "text-airzen-secondary"}`}
              />
              Projets
            </Link>
            {projetsActifs.length > 0 && (
              <button
                type="button"
                onClick={() => setProjetsOuvert((v) => !v)}
                aria-label={projetsOuvert ? "Réduire la liste des projets" : "Déplier la liste des projets"}
                className="shrink-0 rounded-full p-2 text-airzen-secondary transition-colors hover:bg-airzen-bg"
              >
                <IconeChevronDroite
                  className={`h-3.5 w-3.5 transition-transform ${
                    projetsOuvert ? "rotate-90" : "rotate-0"
                  }`}
                />
              </button>
            )}
          </div>

          {projetsOuvert && projetsActifs.length > 0 && (
            <div className="mt-0.5 flex flex-col gap-0.5 pl-[30px]">
              {projetsActifs.map((p) => {
                const actif = pathname.startsWith(`/projets/${p.id}`);
                return (
                  <Link
                    key={p.id}
                    href={`/projets/${p.id}`}
                    onClick={onNaviguer}
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
          onClick={onNaviguer}
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
  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  return (
    <div className="flex min-h-svh w-full flex-1 bg-airzen-bg">
      {/* Barre latérale — visible en permanence à partir de md, tiroir avant. */}
      <aside className="hidden shrink-0 border-r border-airzen-neutral/30 bg-white md:sticky md:top-0 md:flex md:h-svh md:w-[236px]">
        <ContenuSidebar />
      </aside>

      {/* Tiroir mobile */}
      {tiroirOuvert && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-airzen-primary/30"
            onClick={() => setTiroirOuvert(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-[260px] max-w-[80vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-end p-2">
              <button
                type="button"
                onClick={() => setTiroirOuvert(false)}
                aria-label="Fermer le menu"
                className="rounded-full p-2 text-airzen-secondary hover:bg-airzen-bg"
              >
                <IconeFermer />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ContenuSidebar onNaviguer={() => setTiroirOuvert(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre du haut — mobile uniquement */}
        <header className="flex items-center justify-between border-b border-airzen-neutral/30 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setTiroirOuvert(true)}
            aria-label="Ouvrir le menu"
            className="rounded-full p-1.5 text-airzen-primary hover:bg-airzen-bg"
          >
            <IconeMenu />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <LogoAirZen taille={26} />
            <span className="text-sm font-semibold text-airzen-primary">AIR ZEN Flow</span>
          </Link>
          <span className="w-8" aria-hidden />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:px-11 md:py-9">
          {children}
        </main>
      </div>
      <GestionnaireRappels />
    </div>
  );
}
