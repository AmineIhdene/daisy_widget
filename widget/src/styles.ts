// Tout le CSS du widget, écrit sous forme de texte.
// On ne peut pas utiliser un fichier .css normal : il s'appliquerait à la page de l'artisan.
// Ce texte est injecté dans le Shadow DOM (la boîte isolée) par main.tsx.
export const css = `
/* La boîte elle-même : on remet à zéro ce que le site hôte pourrait transmettre, et on la rend en bloc */
:host { all: initial; display: block; }
/* Les largeurs comptent la bordure et le padding : plus facile à calculer */
*, *::before, *::after { box-sizing: border-box; }

/* Premier élément à l'intérieur de la boîte. La page ne peut pas le cibler. */
.dw-root {
  all: initial; /* remet TOUT à zéro (majuscules, couleur, police héritées...). Doit rester en premier. */
  display: block; /* all: initial l'avait mis "en ligne", on le remet en bloc */
  --dw-primary: #374151; /* couleur principale par défaut, remplacée par celle de l'atelier */
  container-type: inline-size; /* permet de réagir à la largeur du conteneur (voir @container en bas) */
  font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; /* police en px, pas en rem */
  color: #1f2937; /* couleur du texte */
}

/* La carte blanche qui entoure chaque écran */
.dw { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
.dw h2 { font-size: 20px; margin: 0 0 4px; } /* les titres */
.dw p { margin: 0 0 12px; } /* les paragraphes */
.dw-muted { color: #6b7280; font-size: 14px; } /* texte secondaire, plus petit et gris */

/* La grille des cours. Chaque carte fait au moins 220 px, mais jamais plus que la place disponible. */
.dw-cards { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr)); }
/* Une carte de cours (c'est un bouton sur lequel on clique) */
.dw-card {
  display: flex; flex-direction: column; gap: 6px; text-align: left; cursor: pointer; /* éléments empilés, curseur main */
  background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px;
  font: inherit; color: inherit; /* un bouton n'hérite pas de la police par défaut, on la lui donne */
}
.dw-card:hover { border-color: var(--dw-primary); } /* au survol, bordure aux couleurs de l'atelier */
/* L'image du cours, ou la pastille avec l'initiale quand il n'y a pas d'image */
.dw-thumb {
  width: 100%; height: 110px; object-fit: cover; border-radius: 8px; /* l'image remplit la zone sans se déformer */
  display: flex; align-items: center; justify-content: center; /* initiale centrée */
  background: color-mix(in srgb, var(--dw-primary) 15%, #fff); /* fond = couleur de l'atelier très éclaircie */
  color: var(--dw-primary); font-size: 36px; font-weight: 700;
}
.dw-title { font-weight: 700; } /* nom du cours en gras */

/* Un créneau dans la liste (c'est aussi un bouton) */
.dw-slot {
  display: flex; justify-content: space-between; gap: 8px; width: 100%; /* date à gauche, places et prix à droite */
  min-height: 44px; padding: 10px 12px; margin-bottom: 8px; cursor: pointer; /* 44 px minimum pour taper facilement au doigt */
  background: #fff; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; color: inherit; text-align: left;
}
.dw-slot:hover:not(:disabled) { border-color: var(--dw-primary); } /* survol, sauf si le créneau est complet */
.dw-slot:disabled { color: #9ca3af; background: #f3f4f6; cursor: not-allowed; } /* créneau complet : grisé */

/* Un champ du formulaire (libellé + saisie) */
.dw-field { display: block; margin-bottom: 12px; font-size: 14px; font-weight: 600; }
.dw-field input, .dw-field select, .dw-field textarea {
  display: block; width: 100%; margin-top: 4px; min-height: 44px; padding: 8px 10px; /* grands champs, faciles à toucher */
  font: 16px system-ui, sans-serif; color: #1f2937; background: #fff; /* 16 px évite le zoom automatique sur iPhone */
  border: 1px solid #d1d5db; border-radius: 8px;
}

/* Le bouton principal */
.dw-btn {
  min-height: 44px; padding: 0 16px; cursor: pointer; border: 0; border-radius: 8px;
  background: var(--dw-primary); color: #fff; font: inherit; font-weight: 600; /* couleur de l'atelier */
}
.dw-btn:disabled { opacity: 0.6; cursor: not-allowed; } /* bouton désactivé : plus pâle */
/* Un bouton qui ressemble à un lien (retour, réessayer...) */
.dw-link { background: none; border: 0; padding: 8px 0; cursor: pointer; font: inherit; color: var(--dw-primary); text-decoration: underline; }

/* Le cadre jaune des messages (place prise, erreur...) */
.dw-alert { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
.dw-alert p { margin-bottom: 8px; }

/* Contour visible quand on navigue au clavier */
.dw button:focus-visible, .dw input:focus-visible, .dw select:focus-visible, .dw textarea:focus-visible {
  outline: 2px solid var(--dw-primary); outline-offset: 2px;
}

/* Quand le conteneur du widget fait moins de 420 px de large (même sur un grand écran) */
@container (max-width: 420px) {
  .dw { padding: 12px; } /* moins de marge intérieure */
  .dw-slot { flex-direction: column; gap: 0; } /* date et prix l'un sous l'autre */
}
`;
