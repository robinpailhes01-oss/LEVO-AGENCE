/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
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
