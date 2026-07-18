"use client";

// Monté une fois dans AppShell : surveille les tâches en tâche de fond et
// déclenche les notifications de rappel (voir lib/hooks/useRappels.ts).
// Ne rend rien à l'écran.
import { useTaches } from "@/lib/hooks/useTaches";
import { useRappels } from "@/lib/hooks/useRappels";

export function GestionnaireRappels() {
  const { taches } = useTaches();
  useRappels(taches);
  return null;
}
