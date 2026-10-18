# Journal de bord

**Temps passé :**  Mes heures sont étalées du lundi 12 au dimanche 18 octobre, à côté de mes cours de Master 2.

## Dans quel ordre j'ai travaillé
1. **lundi 12 au 13 :** lecture de l'énoncé et de `daisy-api.md`, choix du sujet B, puis squelette du widget (Preact + Vite) et première construction du fichier `v1.js`. 
2. **Mercredi 14 :** le tunnel complet (cours, créneau, formulaire, confirmation), les états (chargement, erreur, cours complet), et la page de test avec du CSS hostile. 
3. **Jeudi 15 au samedi 17 :** relecture complète du code, correction de bugs, panne de l'API de test déclenchable à la demande, déploiement sur GitHub et Vercel, captures d'écran. 
4. **Dimanche 18 :** README (les quatre questions, limites, suppositions) et partie 2. 

## Ce qui m'a bloqué
- Le CSS de la page hôte qui passait quand même dans le widget : le Shadow DOM ne suffisait pas, il a fallu ajouter `all: initial`.
- Un jour sauté entre deux fenêtres de créneaux (fenêtre de 89 jours, pas de 90). Corrigé en avançant de 89 jours.
- Le widget qui ne démarrait pas sur `127.0.0.1` en local, réglé avec `allowedDevOrigins`.
- Mon dossier git qui était à la racine de mon dossier personnel : j'ai recréé le dépôt dans le projet.

## Ce que j'ai abandonné, et pourquoi
- Garde-fou de contraste de la couleur et liste de polices : décrits mais pas codés (voir 4.2).
- Indicateurs de suivi (abandon du tunnel) : décrits mais pas codés (voir 4.4).
- Tests automatiques : tout a été vérifié à la main, faute de temps.
- Test sur un vrai Wix, Squarespace ou WordPress.

## Outils
J'ai utilisé Claude (en discussion et dans Claude Code) pour avancer plus vite et relire. J'ai relu le code et je peux expliquer chaque choix.

## Délai
Mon planning universitaire m'a empêché de finir avant le week-end. Charlotte a accepté que je rende lundi 19 octobre.
