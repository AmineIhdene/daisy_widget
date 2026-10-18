// Page d'accueil du site de démo : elle explique le projet et renvoie vers les deux pages de test.
// Rien n'est lu dans la requête, donc Next peut la calculer une seule fois au build (page statique).

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 text-lg leading-relaxed">
      <h1 className="mb-4 text-3xl font-bold">Widget de réservation Daisy (sujet B)</h1>
      <p className="mb-8">
        Démo d'un widget de réservation qu'un artisan intègre sur son site avec deux lignes de code.
      </p>

      {/* Des <a> classiques et pas <Link> : on veut un vrai chargement de page, sinon next/script
          garde v1.js en mémoire et ne le relance pas, et le widget ne s'afficherait pas. */}
      <ul className="mb-8 flex flex-col gap-3">
        <li>
          <a className="text-blue-700 underline underline-offset-4 dark:text-blue-300" href="/test-hosts/normal">
            Site d'artisan ordinaire
          </a>
        </li>
        <li>
          <a className="text-blue-700 underline underline-offset-4 dark:text-blue-300" href="/test-hosts/hostile">
            Site au CSS agressif
          </a>
        </li>
      </ul>

      <p>
        Code source :{" "}
        <a
          className="text-blue-700 underline underline-offset-4 dark:text-blue-300"
          href="https://github.com/AmineIhdene/daisy_widget"
        >
          dépôt GitHub
        </a>
      </p>
    </main>
  );
}
