// Point d'entrée du widget : il trouve la boîte sur la page, crée le Shadow DOM
// (la boîte isolée) et y lance l'application.

import { render } from "preact"; // la fonction qui dessine un composant Preact dans un élément
import { App } from "./App"; // notre application (les 4 écrans)
import { css } from "./styles"; // tout le CSS du widget, sous forme de texte

// Adresse de l'API par défaut. L'artisan peut la changer avec l'attribut data-api sur sa boîte.
// On la devine à partir de l'adresse d'où vient v1.js : si le script vient de https://mon-site.vercel.app/v1.js,
// l'API est sur https://mon-site.vercel.app/api/public/v1. Comme ça, ça marche en local ET une fois déployé.
// document.currentScript n'existe que PENDANT l'exécution du script (après, il vaut null),
// c'est pour ça qu'on le lit ici, tout en haut, et pas dans start() qui peut tourner plus tard.
const script = document.currentScript;
const API_BASE =
  script instanceof HTMLScriptElement && script.src
    ? new URL(script.src).origin + "/api/public/v1" // l'origine = protocole + domaine + port, sans le chemin
    : "http://localhost:3000/api/public/v1"; // valeur de secours si on n'a pas pu lire l'adresse du script

// Installe le widget dans la boîte "container".
function mount(container: HTMLElement) {
  // Si la boîte isolée existe déjà, on s'arrête (sinon charger le script deux fois ferait une erreur).
  if (container.shadowRoot) return;

  // On crée la boîte isolée (Shadow DOM) : le CSS du site n'y entre pas, et le nôtre n'en sort pas.
  const shadow = container.attachShadow({ mode: "open" });

  // On crée une balise <style> et on y met notre CSS.
  const style = document.createElement("style");
  style.textContent = css;
  shadow.appendChild(style); // on la range dans la boîte isolée

  // On crée l'élément qui contiendra l'application.
  const root = document.createElement("div");
  root.className = "dw-root";
  shadow.appendChild(root);

  // On dessine l'application dans cet élément.
  // L'adresse de l'API vient de data-api si elle existe, sinon on prend l'adresse par défaut.
  render(<App apiBase={container.dataset.api ?? API_BASE} />, root);
}

// Cherche la boîte "daisy-booking" sur la page et lance le widget dedans.
function start() {
  const el = document.getElementById("daisy-booking");
  if (el) mount(el); // si la boîte existe, on installe le widget
}

// Le script est chargé en "async" : il peut s'exécuter AVANT que la page ait fini de se dessiner.
if (document.readyState === "loading") {
  // la page charge encore : on attend qu'elle soit prête
  document.addEventListener("DOMContentLoaded", start);
} else {
  // la page est déjà prête : on démarre tout de suite
  start();
}
