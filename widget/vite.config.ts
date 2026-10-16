// La "recette" de Vite : comment fabriquer le fichier v1.js à partir du code du widget.

import { defineConfig } from "vite";
import preact from "@preact/preset-vite"; // permet à Vite de comprendre le code Preact

export default defineConfig({
  plugins: [preact()], // on active le support de Preact
  // Preact cherche cette variable, qui n'existe pas dans un navigateur : on lui donne une valeur.
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    lib: {
      entry: "src/main.tsx", // le fichier de départ du widget
      formats: ["iife"], // un fichier qui s'exécute tout seul dès qu'on le charge, sans rien installer d'autre
      name: "DaisyWidget", // nom interne du paquet
      fileName: () => "v1.js", // le fichier final s'appelle v1.js, comme dans l'énoncé
    },
    outDir: "../public", // on le dépose dans le dossier public de Next.js, donc il sera sur /v1.js
    emptyOutDir: false, // on ne vide pas le dossier public avant d'écrire (sinon on perdrait les autres fichiers)
  },
});
