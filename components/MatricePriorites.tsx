"use client";

// Matrice d'Eisenhower en grille 2×2 (IU en haut à gauche, Iu en haut à droite,
// iU en bas à gauche, iu en bas à droite), avec déplacement manuel : on attrape
// une tâche (la main se ferme) et on l'emmène dans une autre case.
//
// Le glisser-déposer est fait "à la main" avec les événements de pointeur
// (souris, doigt ou stylet) plutôt qu'avec le glisser-déposer natif du
// navigateur : cela marche pareil sur téléphone et permet d'afficher la tâche
// qui suit la main. Sur écran tactile, on attrape la tâche par sa poignée (les
// six points à gauche) pour ne pas gêner le défilement de la page.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BadgeQuadrant } from "@/components/BadgeQuadrant";
import { IconeGlisser } from "@/components/icones";
import { QUADRANTS } from "@/lib/eisenhower";
import { formatDuree } from "@/lib/format";
import type { Quadrant, Tache } from "@/lib/types";

const ORDRE_QUADRANTS: Quadrant[] = ["q1", "q2", "q3", "q4"];
const SOUS_TITRE_QUADRANT: Record<Quadrant, string> = {
  q1: "important et urgent",
  q2: "important, pas urgent",
  q3: "urgent, pas important",
  q4: "ni important ni urgent",
};

// Distance (en pixels) à parcourir avant de considérer qu'on déplace la tâche :
// en dessous, c'est un simple clic (ouvrir, terminer…).
const SEUIL_DEPLACEMENT = 6;
// Près du haut ou du bas de l'écran, la page défile toute seule pendant qu'on
// tient une tâche (utile sur téléphone, où les 4 cases sont l'une sous l'autre).
const ZONE_DEFILEMENT = 70;

interface Prise {
  tache: Tache;
  origine: Quadrant;
  departX: number;
  departY: number;
  decalageX: number; // position de la main à l'intérieur de la carte
  decalageY: number;
  largeur: number;
}

interface Props {
  parQuadrant: Record<Quadrant, Tache[]>;
  rendreCarte: (tache: Tache) => ReactNode;
  onDeplacer: (tache: Tache, vers: Quadrant) => void;
}

function quadrantSous(x: number, y: number): Quadrant | null {
  const zone = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-quadrant]");
  return (zone?.dataset.quadrant as Quadrant | undefined) ?? null;
}

export function MatricePriorites({ parQuadrant, rendreCarte, onDeplacer }: Props) {
  // Tâche "saisie" (bouton enfoncé), pas forcément encore déplacée.
  const [prise, setPrise] = useState<Prise | null>(null);
  // Position de la main une fois le déplacement réellement commencé.
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [survol, setSurvol] = useState<Quadrant | null>(null);
  // Vrai juste après un déplacement : évite que le relâchement soit pris pour un clic.
  const vientDeGlisser = useRef(false);

  // Toujours la dernière version de onDeplacer, sans relancer l'effet ci-dessous
  // (ce qui interromprait un déplacement en cours si l'écran se rafraîchit).
  const onDeplacerRef = useRef(onDeplacer);
  useEffect(() => {
    onDeplacerRef.current = onDeplacer;
  }, [onDeplacer]);

  const enDeplacement = prise !== null && position !== null;

  useEffect(() => {
    if (!prise) return;
    const p = prise;
    let actif = false;
    let dernier = { x: p.departX, y: p.departY };
    let image = 0;

    function defilementAuto() {
      if (dernier.y < ZONE_DEFILEMENT) window.scrollBy(0, -10);
      else if (dernier.y > window.innerHeight - ZONE_DEFILEMENT) window.scrollBy(0, 10);
      setSurvol(quadrantSous(dernier.x, dernier.y));
      image = requestAnimationFrame(defilementAuto);
    }

    function bouger(e: PointerEvent) {
      dernier = { x: e.clientX, y: e.clientY };
      if (!actif) {
        const distance = Math.hypot(e.clientX - p.departX, e.clientY - p.departY);
        if (distance < SEUIL_DEPLACEMENT) return;
        actif = true;
        // La main fermée reste affichée partout tant qu'on tient la tâche.
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
        image = requestAnimationFrame(defilementAuto);
      }
      e.preventDefault();
      setPosition(dernier);
    }

    function terminer(deposer: boolean) {
      if (actif) {
        vientDeGlisser.current = true;
        // Le clic éventuel arrive juste après le relâchement : on le laisse
        // passer (et être ignoré), puis on réarme.
        setTimeout(() => (vientDeGlisser.current = false), 0);
        const cible = deposer ? quadrantSous(dernier.x, dernier.y) : null;
        if (cible && cible !== p.origine) onDeplacerRef.current(p.tache, cible);
      }
      setPrise(null);
      setPosition(null);
      setSurvol(null);
    }

    const relacher = () => terminer(true);
    const annuler = () => terminer(false);
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") terminer(false);
    };

    window.addEventListener("pointermove", bouger, { passive: false });
    window.addEventListener("pointerup", relacher);
    window.addEventListener("pointercancel", annuler);
    window.addEventListener("keydown", echap);
    return () => {
      window.removeEventListener("pointermove", bouger);
      window.removeEventListener("pointerup", relacher);
      window.removeEventListener("pointercancel", annuler);
      window.removeEventListener("keydown", echap);
      cancelAnimationFrame(image);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [prise]);

  function saisir(e: React.PointerEvent<HTMLDivElement>, tache: Tache, origine: Quadrant) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const cible = e.target as HTMLElement;
    // Au doigt, seule la poignée attrape la tâche (le reste sert à faire défiler).
    if (e.pointerType !== "mouse" && !cible.closest("[data-poignee]")) return;
    const cadre = e.currentTarget.getBoundingClientRect();
    setPrise({
      tache,
      origine,
      departX: e.clientX,
      departY: e.clientY,
      decalageX: e.clientX - cadre.left,
      decalageY: e.clientY - cadre.top,
      largeur: cadre.width,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-light text-airzen-secondary">
        Attrapez une tâche et déposez-la dans une autre case pour changer sa priorité.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ORDRE_QUADRANTS.map((q) => {
          const liste = parQuadrant[q];
          const duree = liste.reduce((s, t) => s + t.dureeEstimeeMinutes, 0);
          const cibleActive = enDeplacement && survol === q && prise.origine !== q;
          return (
            <section
              key={q}
              data-quadrant={q}
              className={`flex flex-col gap-2.5 rounded-2xl p-1.5 transition-colors ${
                cibleActive
                  ? "bg-white outline-2 outline-airzen-accent"
                  : enDeplacement
                    ? "outline-1 outline-dashed outline-airzen-neutral"
                    : ""
              }`}
            >
              <div
                className="rounded-xl px-3 py-2"
                style={{ backgroundColor: `${QUADRANTS[q].couleur}40` }}
              >
                <p className="text-sm font-semibold text-airzen-primary">
                  {QUADRANTS[q].court} · {QUADRANTS[q].label}
                </p>
                <p className="text-xs text-airzen-secondary">
                  {SOUS_TITRE_QUADRANT[q]} · {liste.length} tâche
                  {liste.length > 1 ? "s" : ""}
                  {liste.length > 0 && ` · ${formatDuree(duree)}`}
                </p>
              </div>
              <div className="flex min-h-12 flex-col gap-2">
                {liste.length === 0 && (
                  <p className="px-1 text-xs font-light text-airzen-neutral">
                    {cibleActive ? "Déposez ici." : "Rien ici pour l'instant."}
                  </p>
                )}
                {liste.map((t) => {
                  const tenue = enDeplacement && prise.tache.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onPointerDown={(e) => saisir(e, t, q)}
                      onDragStart={(e) => e.preventDefault()}
                      onClickCapture={(e) => {
                        if (vientDeGlisser.current) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      className={`flex cursor-grab items-stretch gap-1 transition-opacity ${
                        tenue ? "opacity-30" : ""
                      }`}
                    >
                      <span
                        data-poignee
                        title="Attraper pour déplacer"
                        className="flex w-5 shrink-0 touch-none items-center justify-center text-airzen-neutral"
                      >
                        <IconeGlisser className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">{rendreCarte(t)}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* La tâche "en main" : une copie légère qui suit la souris ou le doigt. */}
      {enDeplacement && (
        <div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-50 rounded-xl bg-white px-3 py-2 shadow-xl ring-1 ring-airzen-neutral/40"
          style={{
            width: prise.largeur,
            transform: `translate(${position.x - prise.decalageX}px, ${
              position.y - prise.decalageY
            }px) rotate(-2deg)`,
            borderLeft: `4px solid ${QUADRANTS[survol ?? prise.origine].couleur}`,
          }}
        >
          <p className="line-clamp-2 text-xs font-medium leading-snug text-airzen-primary">
            {prise.tache.titre}
          </p>
          <div className="mt-1">
            <BadgeQuadrant quadrant={survol ?? prise.origine} />
          </div>
        </div>
      )}
    </div>
  );
}
