import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // En mode dev, Next.js n'accepte que localhost : ouvrir le site sur 127.0.0.1 bloque le rechargement
  // automatique (HMR) et les fichiers de dev, donc le widget ne démarre pas. On autorise donc 127.0.0.1.
  // Ça ne sert qu'au serveur de développement (npm run dev), ça ne change rien à la production.
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
