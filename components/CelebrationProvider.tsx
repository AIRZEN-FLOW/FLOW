"use client";

// Petit "système de récompense" pour le cerveau : quand une tâche est
// terminée, un toast doux apparaît quelques secondes avec une phrase
// encourageante différente à chaque fois. Rien d'anxiogène ni de bruyant
// (cohérent avec l'ambiance "zen" — voir docs/04-design-system.md §2) :
// pas de son, pas de confettis plein écran, juste une petite reconnaissance.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const PHRASES = [
  "Bien joué ✨",
  "Une de faite, respirez 🌿",
  "Ça avance, bravo",
  "Petit pas, grand mérite",
  "C'est fait, et c'est bien fait 🌸",
  "Un peu de légèreté en plus",
  "Voilà, une de moins sur les épaules",
];

interface CelebrationValeur {
  celebrer: () => void;
}

const CelebrationContexte = createContext<CelebrationValeur | undefined>(undefined);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const celebrer = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));

    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    setMessage(phrase);
    setVisible(false);
    // Un cycle avant d'afficher, pour laisser la transition CSS s'appliquer.
    const apparition = window.setTimeout(() => setVisible(true), 20);
    const disparition = window.setTimeout(() => setVisible(false), 2400);
    const nettoyage = window.setTimeout(() => setMessage(null), 2800);
    timeoutsRef.current = [apparition, disparition, nettoyage];
  }, []);

  return (
    <CelebrationContexte.Provider value={{ celebrer }}>
      {children}
      {message && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div
            className={`rounded-full bg-airzen-accent px-5 py-2.5 text-sm font-semibold text-airzen-primary shadow-lg transition-all duration-300 ${
              visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            {message}
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
