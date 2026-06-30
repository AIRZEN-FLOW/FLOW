export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      {/* Logo : cercle gris-bleu avec une touche jaune (rappel de l'identité AIR ZEN) */}
      <div className="relative mb-10 h-24 w-24">
        <div className="h-24 w-24 rounded-full bg-airzen-primary" />
        <div className="absolute -right-1 top-2 h-7 w-7 rounded-full bg-airzen-accent" />
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-airzen-primary sm:text-5xl">
        AIR ZEN Flow
      </h1>

      <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-airzen-secondary">
        La bonne tâche, au bon moment. On croise l&apos;urgence, votre énergie,
        votre temps disponible et la durée — pour décider quoi faire maintenant.
      </p>

      {/* Aperçu des couleurs des quadrants Eisenhower : confirme que la charte est bien chargée */}
      <div className="mt-14 flex items-center gap-4">
        <span className="h-4 w-4 rounded-full bg-q1" title="Q1 — Faire maintenant" />
        <span className="h-4 w-4 rounded-full bg-q2" title="Q2 — Planifier" />
        <span className="h-4 w-4 rounded-full bg-q3" title="Q3 — Déléguer / minimiser" />
        <span className="h-4 w-4 rounded-full bg-q4" title="Q4 — Éliminer / différer" />
      </div>

      <p className="mt-16 text-sm font-light text-airzen-neutral">
        air-zen.bzh — installation en cours
      </p>
    </main>
  );
}
