/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @resvg/resvg-js embarque un binaire natif (.node) — à laisser tel quel,
  // pas à faire passer par webpack (rendu des visuels LUNA).
  experimental: {
    serverComponentsExternalPackages: ["@resvg/resvg-js"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Pas de cache client sur les segments dynamiques → le dashboard reflète
    // toujours l'état réel de la base (fini les vieilles cartes fantômes).
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
