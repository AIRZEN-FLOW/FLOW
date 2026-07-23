// Petites icônes SVG, sans dépendance externe (traits simples, cohérents avec
// l'esprit "zen" — pas de style chargé). Taille contrôlée par la classe passée.
type PropsIcone = { className?: string };

export function IconeCrayon({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeCorbeille({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7m2 0-.7 12.1a1.5 1.5 0 0 1-1.5 1.4H9.2a1.5 1.5 0 0 1-1.5-1.4L7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeCoche({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 12.5 9.5 18 20 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeRouvrir({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 10a8 8 0 1 1 2.1 6.6M4 10V4m0 6h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeCloche({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3a5 5 0 0 0-5 5v3.4c0 .6-.2 1.2-.6 1.7L5 15.5c-.5.6 0 1.5.8 1.5h12.4c.8 0 1.3-.9.8-1.5l-1.4-2.4a2.7 2.7 0 0 1-.6-1.7V8a5 5 0 0 0-5-5ZM9.5 19a2.5 2.5 0 0 0 5 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Durée estimée — utilisée en remplacement du mot "min"/"h" quand la place manque. */
export function IconeHorloge({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Énergie requise — utilisée en remplacement du mot "Haute/Moyenne/Basse". */
export function IconeEclair({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Échéance — utilisée en remplacement du texte "dans X jours". */
export function IconeCalendrier({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="4" y="5.5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 10h16M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ─── Icônes de la navigation principale (sidebar) ───

export function IconeTableauDeBord({ className = "h-[19px] w-[19px]" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconeAujourdhui({ className = "h-[19px] w-[19px]" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.1 5.9l-1.5 1.5M7.4 16.6l-1.5 1.5M18.1 18.1l-1.5-1.5M7.4 7.4 5.9 5.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconeTachesNav({ className = "h-[19px] w-[19px]" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 12.5l2.3 2.3L15.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeProjetsNav({ className = "h-[19px] w-[19px]" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 7.5a1.5 1.5 0 0 1 1.5-1.5h4l1.5 2h7A1.5 1.5 0 0 1 19.5 9.5V17a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 17V7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeReglagesNav({ className = "h-[19px] w-[19px]" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19 12a7 7 0 0 0-.1-1.2l1.9-1.5-2-3.4-2.2.9a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.4a7 7 0 0 0-2 1.2l-2.2-.9-2 3.4L5.1 10.8A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2L3.2 14.9l2 3.4 2.2-.9a7 7 0 0 0 2 1.2l.4 2.4h4.4l.4-2.4a7 7 0 0 0 2-1.2l2.2.9 2-3.4-1.9-1.5c.06-.4.1-.8.1-1.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeChevronDroite({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeMenu({ className = "h-5 w-5" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconeFermer({ className = "h-5 w-5" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 5l14 14M19 5 5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Icônes ajoutées pour les Réglages en tuiles, le chronomètre, le
// calendrier personnel et la sidebar ───

/** Pause déjeuner (tuile Réglages). */
export function IconeDejeuner({ className = "h-5 w-5" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 10.5a7 7 0 0 1 14 0v6.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M3.5 10.5h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Seuil d'urgence (tuile Réglages) — sablier. */
export function IconeSablier({ className = "h-5 w-5" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 3.5h10M7 20.5h10M7.5 3.5v3.2c0 1.3.6 2.5 1.6 3.3l1.9 1.5v.1l-1.9 1.5a4.2 4.2 0 0 0-1.6 3.3v3.6M16.5 3.5v3.2c0 1.3-.6 2.5-1.6 3.3L13 11.5v.1l1.9 1.5c1 .8 1.6 2 1.6 3.3v3.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Lien mail "Commentaire bêta testeur" (sidebar). */
export function IconeMail({ className = "h-[19px] w-[19px]" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 7l7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Démarrer le chronomètre d'une tâche. */
export function IconeLecture({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 4.5v15l14-7.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/** Mettre le chronomètre d'une tâche en pause. */
export function IconePause({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
    </svg>
  );
}

/** Poignée de glisser-déposer (réordonnancement Gantt). */
export function IconeGlisser({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  );
}

/** Une case du calendrier / vue calendrier. */
export function IconePlus({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
