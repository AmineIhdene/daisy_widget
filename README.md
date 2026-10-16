# Widget de réservation Daisy (sujet B)

## 1. Lancer le projet

**Prérequis :** Node 20 ou plus récent.

```bash
npm install                                   # projet Next.js (mock de l'API + pages de test)
cd widget && npm install && npm run build     # construit le widget dans public/v1.js
cd .. && npm run dev                          # http://localhost:3000
```

Le widget appelle par défaut l'API sur le même domaine que celui d'où vient `v1.js` (par exemple `http://localhost:3000/v1.js` donne `http://localhost:3000/api/public/v1`). S'il n'arrive pas à lire l'adresse du script, il prend `http://localhost:3000/api/public/v1`. L'attribut `data-api` de la balise de montage reste prioritaire pour indiquer une autre adresse. `npm run dev` dans `widget/` relance le build à chaque modification (`vite build --watch`).

**Pages de test :**

- `/test-hosts/normal` : un site d'artisan ordinaire (colonne de 640 px).
- `/test-hosts/hostile` : une colonne de 360 px avec un CSS agressif (`!important` sur `button`, `input`, `div`, `p`, etc.) pour vérifier l'isolation du widget.

**Outils de test du mock :**

- `GET /api/mock/reset` : remet les créneaux et les réservations à leur état initial (les données sont en mémoire).
- `GET /api/mock/fail?mode=...` : déclenche une panne pour la **prochaine** réservation uniquement. La panne est consommée par le prochain `POST /bookings`, quel qu'il soit.
- Sur `POST /api/public/v1/bookings` :
  - `?delay=0` : supprime la latence simulée (sinon 1,5 à 4 s). Accepte une durée en millisecondes.
  - `?fail=...` : déclenche la panne directement sur cette requête (prioritaire sur le mode posé par `/api/mock/fail`).

**Modes de panne** (lus dans `app/api/public/v1/bookings/route.ts`) :

| Mode | Réponse |
| --- | --- |
| `origin_not_allowed` | 403 `{ "error": "origin_not_allowed" }` |
| `rate_limited` | 429 `{ "error": "rate_limited" }` |
| `server_error` | 500 `{ "error": "server_error" }` |
| `slot_cancelled` | 409 `{ "error": "slot_cancelled" }` |
| `slot_full` | 409 `{ "error": "slot_full", "available": N }` ; N vient de `?available=N` sur la requête, 0 par défaut |
| `hang` | la réservation est enregistrée (les places baissent), puis la réponse est retardée de 20 s, au-delà du délai de 15 s du widget |

## 2. Ce que j'ai livré

**Mock de l'API publique** (Next.js, App Router, routes dans `app/api/`) :

- `GET /api/public/v1/studio` : nom, fuseau horaire, devise, couleur principale, règles de réservation (téléphone obligatoire, 4 places maximum).
- `GET /api/public/v1/courses` : trois cours, dont un sans image ni description et un avec une description très longue.
- `GET /api/public/v1/courses/{course_id}/slots?from=...&to=...` : créneaux d'un cours, fenêtre de 90 jours maximum (erreurs `course_not_found`, `invalid_date`, `window_too_large`).
- `POST /api/public/v1/bookings` : vérifie la demande (`invalid_json`, `slot_not_found`, `invalid_seats`, `too_many_seats`, `invalid_customer`, `phone_required`), refuse avec `slot_full` s'il n'y a plus assez de places, sinon décompte les places et renvoie un code de confirmation.
- `GET /api/mock/reset` et `GET /api/mock/fail` (voir section 1).

**Le widget** (`widget/`, construit dans `public/v1.js`) : un seul fichier de 26,8 kB, soit environ 11 kB compressé en gzip. Il se monte dans `<div id="daisy-booking">` et se charge avec une simple balise `<script>`.

**États gérés** (dans `widget/src/App.tsx`) :

- Démarrage : chargement ; erreur avec bouton « Réessayer ».
- Liste des cours : aucun cours proposé ; image manquante ou qui ne charge pas (remplacée par une pastille avec l'initiale) ; description longue raccourcie.
- Créneaux : chargement ; erreur avec « Réessayer » ; aucun créneau sur la période ; créneau complet (désactivé) ; « Dernière place » ; passage à la fenêtre suivante (89 jours à chaque fois, sans sauter de jour).
- Formulaire : nombre de places limité au plus petit entre le maximum de l'atelier et les places restantes ; téléphone obligatoire ou facultatif selon l'atelier ; total estimé ; bouton désactivé pendant l'envoi et protection contre le double-clic (une seule requête part).
- Erreurs de réservation, avec les informations saisies conservées :
  - `slot_full` avec des places restantes : proposition de réserver ce nombre de places, ou de choisir un autre horaire ;
  - `slot_full` sans place restante, ou `slot_cancelled` : proposition de choisir un autre horaire ;
  - erreurs de validation : invitation à vérifier les coordonnées ;
  - `rate_limited` : invitation à réessayer plus tard ;
  - `origin_not_allowed` : message au client et explication dans la console pour l'atelier ;
  - toute autre erreur (500, réseau coupé, délai dépassé) : message d'incertitude, qui invite à vérifier ses e-mails avant de réessayer, car la réservation a peut-être été enregistrée.
- Confirmation : code de confirmation et total.

Délais côté widget : 8 s pour les lectures, 15 s pour la réservation.

**Pages de test :** `/test-hosts/normal` et `/test-hosts/hostile`.

**Vérification :** il n'y a pas de tests automatiques. J'ai vérifié à la main :

- le tunnel complet, du choix du cours à la confirmation ;
- une place prise par quelqu'un d'autre pendant la saisie ;
- le double-clic sur « Réserver » (une seule requête part) ;
- le délai dépassé (le widget affiche l'incertitude alors que la réservation existe côté serveur) ;
- l'isolation CSS sur la page hostile.

## 3. Choix d'architecture et écarts de stack

- **Mock en Next.js avec pannes déclenchables.** Les routes reproduisent l'API publique, avec des données en mémoire. Chaque panne du sujet peut être provoquée à la demande (`/api/mock/fail`, `?fail=`, `?delay=`), ce qui permet de tester les cas difficiles sans attendre qu'ils arrivent.
- **Widget en bundle séparé, Preact + Vite.** Le site de l'artisan ne charge qu'un seul fichier, `v1.js` (format IIFE : tout est dans une fonction qui s'exécute seule, le bundle n'expose aucune variable globale). Preact est léger, et le widget embarque sa propre copie : il n'entre pas en conflit avec un React ou un jQuery déjà présent sur la page hôte. *Coût :* deux outils de build (Next.js et Vite) et deux `package.json` à maintenir.
- **Shadow DOM plutôt qu'iframe.** Le widget s'adapte à la hauteur de son contenu et à la largeur de la page sans communication entre fenêtres, et le CSS de l'hôte ne s'applique pas à ses éléments. *Limites :*
  - les propriétés héritées (police, couleur, taille de texte…) traversent quand même le Shadow DOM, d'où `all: initial` sur `:host` et `.dw-root` ;
  - la boîte de montage (`#daisy-booking`) fait partie de la page : elle reste soumise au CSS de l'hôte (bordures, marges, fond…).
- **Pas de Supabase.** Le widget n'appelle qu'une API publique. Le mock garde ses données en mémoire, et `/api/mock/reset` les remet à zéro.
- **Pas de Tailwind dans le widget.** Les styles doivent vivre à l'intérieur du Shadow DOM. Un CSS simple, écrit à la main dans `widget/src/styles.ts`, y est injecté au montage. Tailwind reste installé côté Next.js, mais le widget ne l'utilise pas.
- **Vercel non utilisé.** Le projet se lance en local (section 1).

## 4. Les quatre questions du sujet

À rédiger.

## 5. Limites connues et ce que je n'ai pas fait

À rédiger.

## 6. Suppositions faites

À rédiger.

## 7. Partie 2

À rédiger.
