// Petites fonctions pour bien afficher les prix, les dates et les textes.

// Transforme des centimes en prix lisible : 7500 devient "75,00 €".
// C'est ici, et seulement ici, qu'on divise par 100.
export const euros = (cents: number, currency = "EUR") =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency });

// Affiche la date d'un créneau, ex : "samedi 9 janvier à 14:00".
// On utilise le fuseau de l'ATELIER, pas celui du visiteur : une cliente à Montréal doit voir 14h.
export function formatSlot(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone, // le fuseau de l'atelier
    weekday: "long", // jour de la semaine en toutes lettres
    day: "numeric", // numéro du jour
    month: "long", // mois en toutes lettres
    hour: "2-digit", // heure sur 2 chiffres
    minute: "2-digit", // minutes sur 2 chiffres
  }).format(new Date(iso));
}

// Coupe un texte trop long et ajoute "…" à la fin.
export function shorten(text: string, max = 140) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

// Transforme le niveau de l'API en texte lisible.
export function levelLabel(level: string) {
  if (level === "debutant") return "Débutant";
  if (level === "intermediaire") return "Intermédiaire";
  return level; // pour un niveau inconnu, on affiche tel quel
}
