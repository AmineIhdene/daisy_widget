// Faux site d'artisan, sans particularité. Sert à tester le widget dans un cas normal.
// Adresse : /test-hosts/normal

import Script from "next/script"; // l'outil de Next.js pour charger un script

export default function NormalHost() {
  return (
    // La page : une colonne centrée de 640 px de large maximum.
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h1>Atelier Terre & Feu (site de l'artisan)</h1>
      <p>Réservez votre prochain cours directement ici :</p>
      {/* La boîte où le widget va s'afficher. C'est la 1re des deux lignes que l'artisan colle. */}
      <div id="daisy-booking" data-studio="std_pk_7f2a9c"></div>
      {/* Le fichier du widget. C'est la 2e ligne que l'artisan colle. */}
      <Script src="/v1.js" strategy="afterInteractive" />
    </main>
  );
}
