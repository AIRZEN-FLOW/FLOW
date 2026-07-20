"use client";

// Petite pastille météo, optionnelle (voir lib/hooks/useMeteo.ts). Un simple clic
// pour l'activer ou la masquer — pas de réglage caché dans un menu.
import { useMeteo } from "@/lib/hooks/useMeteo";

// Codes météo OMM (norme utilisée par Open-Meteo) → pictogramme simple.
function emojiMeteo(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

export function MeteoWidget() {
  const { actif, meteo, erreur, chargement, activer, desactiver } = useMeteo();

  if (!actif) {
    return (
      <button
        type="button"
        onClick={activer}
        className="shrink-0 whitespace-nowrap text-xs font-light text-airzen-neutral underline underline-offset-2 hover:text-airzen-secondary"
      >
        Afficher la météo
      </button>
    );
  }

  if (chargement) {
    return <span className="shrink-0 text-xs font-light text-airzen-neutral">Météo…</span>;
  }

  if (erreur) {
    return (
      <button
        type="button"
        onClick={desactiver}
        title={erreur}
        className="shrink-0 text-xs font-light text-airzen-neutral underline underline-offset-2"
      >
        Météo indisponible
      </button>
    );
  }

  if (!meteo) return null;

  return (
    <button
      type="button"
      onClick={desactiver}
      title="Cliquer pour masquer la météo"
      className="shrink-0 whitespace-nowrap rounded-full bg-airzen-bg px-3 py-1 text-sm text-airzen-secondary"
    >
      {emojiMeteo(meteo.code)} {meteo.temperature}°C
    </button>
  );
}
