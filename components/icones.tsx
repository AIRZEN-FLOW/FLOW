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
