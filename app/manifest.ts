// Étape 9 — Manifest PWA (servi automatiquement par Next sur /manifest.webmanifest).
// Rend l'app installable sur l'écran d'accueil (Android/iOS), sans store.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AIR ZEN Flow",
    short_name: "AIR ZEN Flow",
    description:
      "La bonne tâche, au bon moment — selon votre urgence, votre énergie et votre temps disponible.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F7F8",
    theme_color: "#596D85",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
