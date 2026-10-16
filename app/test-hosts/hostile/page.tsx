// Faux site d'artisan avec un CSS agressif. Sert à prouver que le Shadow DOM protège le widget.
// Adresse : /test-hosts/hostile

import Script from "next/script"; // l'outil de Next.js pour charger un script

// Un CSS volontairement méchant : il essaie de tout casser avec !important.
const hostileCss = `
  button, input, select, textarea, div, p, h2, span, label {
    all: revert !important;                         /* annule les styles de base */
    font-family: "Comic Sans MS", cursive !important; /* police ridicule */
    color: red !important;                          /* texte rouge */
    background: yellow !important;                  /* fond jaune */
    border: 4px dotted blue !important;             /* bordure bleue en pointillés */
    font-size: 40px !important;                     /* texte énorme */
    text-transform: uppercase !important;           /* tout en majuscules */
  }
`;

export default function HostileHost() {
  return (
    // Colonne étroite de 360 px, comme une colonne latérale de site.
    <main style={{ maxWidth: 360, margin: "40px auto", padding: 16 }}>
      {/* On injecte le CSS méchant dans la page */}
      <style>{hostileCss}</style>
      <h1>Site hostile (colonne de 360 px)</h1>
      {/* La boîte du widget : elle appartient à la page, donc elle subit le CSS hostile */}
      <div id="daisy-booking" data-studio="std_pk_7f2a9c"></div>
      {/* Le fichier du widget */}
      <Script src="/v1.js" strategy="afterInteractive" />
    </main>
  );
}
