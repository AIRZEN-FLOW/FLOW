"use client";

// Petit "système de récompense" pour le cerveau : quand une tâche est
// terminée, un toast apparaît quelques secondes avec une phrase encourageante
// différente à chaque fois (voir docs/04-design-system.md §2 pour l'ambiance
// "zen" générale de l'app). L'intensité s'adapte à la tâche accomplie :
// - une petite tâche → un toast doux, comme avant ;
// - une tâche longue OU importante → un ton plus vif ;
// - une tâche longue ET importante → la totale, feux d'artifice compris.
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { NiveauImportance } from "@/lib/types";

type Palier = "doux" | "vif" | "grand";

interface OptionsCelebration {
  dureeEstimeeMinutes?: number;
  niveauImportance?: NiveauImportance;
}

// Une tâche "longue" dépasse le seuil par défaut de découpage automatique
// (90 min, voir lib/eisenhower.ts / docs/02-specifications-fonctionnelles.md) —
// un repère déjà connu de l'app pour "ça, c'est du gros morceau".
const SEUIL_LONGUE_MINUTES = 90;

function determinerPalier({
  dureeEstimeeMinutes = 0,
  niveauImportance,
}: OptionsCelebration): Palier {
  const longue = dureeEstimeeMinutes >= SEUIL_LONGUE_MINUTES;
  const importante = niveauImportance === "haute";
  if (longue && importante) return "grand";
  if (longue || importante) return "vif";
  return "doux";
}

const PHRASES: Record<Palier, string[]> = {
  doux: [
    "Bien joué ✨",
    "Une de faite, respirez 🌿",
    "Ça avance, bravo",
    "Petit pas, grand mérite",
    "C'est fait, et c'est bien fait 🌸",
    "Un peu de légèreté en plus",
    "Voilà, une de moins sur les épaules",
  ],
  vif: [
    "Belle avancée, ça se sent 💪",
    "Une tâche corsée en moins, chapeau 🔥",
    "Vous tenez le rythme, bravo",
    "Ça, c'est du concret ! ⚡",
    "Sacrée étape franchie ✨",
    "Du solide, continuez comme ça 🌟",
  ],
  grand: [
    "ÉNORME. Une tâche longue et complexe, pliée 🎆",
    "Feu d'artifice mérité : quelle victoire ! 🎇",
    "Un accomplissement majeur, vraiment 🎉",
    "Chapeau bas — un travail de fond qui paie ✨",
    "Standing ovation pour celle-là 👏🎆",
    "Ça, ça mérite d'être célébré très fort 🎊",
  ],
};

const EMOJIS_FEUX = ["🎆", "🎇", "✨", "🎉", "🎊", "⭐"];

const NB_PARTICULES: Record<Palier, number> = { doux: 0, vif: 7, grand: 16 };
const DUREE_TOAST_MS: Record<Palier, number> = { doux: 2400, vif: 3000, grand: 3800 };
const CLASSES_TOAST: Record<Palier, string> = {
  doux: "bg-airzen-accent px-5 py-2.5 text-sm font-semibold text-airzen-primary shadow-lg",
  vif: "bg-airzen-accent px-6 py-3 text-base font-bold text-airzen-primary shadow-xl",
  grand:
    "bg-airzen-accent px-7 py-3.5 text-lg font-extrabold text-airzen-primary shadow-2xl ring-4 ring-airzen-accent/40",
};

interface Particule {
  id: number;
  emoji: string;
  style: CSSProperties;
}

function genererParticules(n: number): Particule[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const distance = 60 + Math.random() * 70;
    return {
      id: i,
      emoji: EMOJIS_FEUX[Math.floor(Math.random() * EMOJIS_FEUX.length)],
      style: {
        ["--fw-x" as string]: `${Math.cos(angle) * distance}px`,
        ["--fw-y" as string]: `${Math.sin(angle) * distance - 30}px`,
        animationDelay: `${Math.random() * 0.25}s`,
      },
    };
  });
}

interface CelebrationValeur {
  celebrer: (options?: OptionsCelebration) => void;
}

const CelebrationContexte = createContext<CelebrationValeur | undefined>(undefined);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [palier, setPalier] = useState<Palier>("doux");
  const [particules, setParticules] = useState<Particule[]>([]);
  const [visible, setVisible] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const celebrer = useCallback((options: OptionsCelebration = {}) => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));

    const p = determinerPalier(options);
    const phrases = PHRASES[p];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const dureeToast = DUREE_TOAST_MS[p];

    setPalier(p);
    setMessage(phrase);
    setParticules(genererParticules(NB_PARTICULES[p]));
    setVisible(false);
    // Un cycle avant d'afficher, pour laisser la transition CSS s'appliquer.
    const apparition = window.setTimeout(() => setVisible(true), 20);
    const disparition = window.setTimeout(() => setVisible(false), dureeToast);
    const nettoyage = window.setTimeout(() => {
      setMessage(null);
      setParticules([]);
    }, dureeToast + 400);
    timeoutsRef.current = [apparition, disparition, nettoyage];
  }, []);

  return (
    <CelebrationContexte.Provider value={{ celebrer }}>
      {children}
      {message && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="relative flex justify-center">
            {particules.map((part) => (
              <span
                key={part.id}
                aria-hidden
                className="absolute left-1/2 top-1/2 animate-firework text-xl"
                style={part.style}
              >
                {part.emoji}
              </span>
            ))}
            <div
              className={`rounded-full transition-all duration-300 ${CLASSES_TOAST[palier]} ${
                visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"
              }`}
            >
              {message}
            </div>
          </div>
        </div>
      )}
    </CelebrationContexte.Provider>
  );
}

export function useCelebration(): CelebrationValeur {
  const ctx = useContext(CelebrationContexte);
  if (!ctx) {
    throw new Error("useCelebration doit être utilisé dans un <CelebrationProvider>");
  }
  return ctx;
}
