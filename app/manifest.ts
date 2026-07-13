import type { MetadataRoute } from "next";

/** Manifest PWA — permet "Ajouter à l'écran d'accueil" (Android + iOS). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Luma — Dashboard agents",
    short_name: "Luma",
    description: "Pilotage des agents IA de Luma (Montpellier).",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0D1117",
    theme_color: "#0D1117",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
