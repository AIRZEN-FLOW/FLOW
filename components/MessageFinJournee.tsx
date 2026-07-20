"use client";

// Message partagé, affiché sur Aujourd'hui ET Planning une fois l'heure de fin
// de journée (Réglages → Fin de journée) dépassée — même formulation aux deux
// endroits pour rester cohérent.
export function MessageFinJournee({ onVoirQuandMeme }: { onVoirQuandMeme: () => void }) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
      <p className="text-lg font-medium text-airzen-primary">
        🌙 La journée de travail est terminée
      </p>
      <p className="mt-2 font-light text-airzen-secondary">
        Un bon moment pour souffler. À demain !
      </p>
      <button
        type="button"
        onClick={onVoirQuandMeme}
        className="mt-4 text-sm font-medium text-airzen-secondary underline underline-offset-2 hover:text-airzen-primary"
      >
        Afficher quand même
      </button>
    </div>
  );
}
