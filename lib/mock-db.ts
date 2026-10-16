// Ce fichier est notre "fausse base de données".
// Tout est gardé en mémoire : quand on redémarre le serveur, on repart de zéro.

// Décrit à quoi ressemble un créneau (un cours à une date précise).
export type Slot = {
  slot_id: string; // identifiant du créneau, par exemple "slt_44710"
  course_id: string; // le cours auquel il appartient
  starts_at: string; // date et heure de début, avec le décalage horaire
  seats_total: number; // nombre de places au total
  seats_available: number; // nombre de places encore libres
  price_cents: number; // prix en centimes (7500 veut dire 75 euros)
};

// Les 6 samedis proposés pour chaque cours.
const DATES = [
  "2027-01-09",
  "2027-01-16",
  "2027-01-23",
  "2027-01-30",
  "2027-02-06",
  "2027-02-13",
];

// Places libres au départ pour chaque date, dans le même ordre que DATES.
// 0 = complet, 1 = dernière place : ça permet de tester ces deux cas.
const AVAILABLE = [8, 2, 0, 5, 1, 8];

// Prix de base de chaque cours, en centimes.
const COURSE_PRICES: Record<string, number> = {
  crs_118: 7500,
  crs_120: 6000,
  crs_131: 11000,
};

// Fabrique la liste de tous les créneaux (6 dates pour chacun des 3 cours).
function buildSlots(): Slot[] {
  const result: Slot[] = []; // la liste qu'on va remplir
  let n = 44710; // numéro du premier créneau, il augmente de 1 à chaque fois
  // Pour chaque cours (identifiant + prix)...
  for (const [course_id, price] of Object.entries(COURSE_PRICES)) {
    // ...on crée un créneau par date. i = la position de la date (0, 1, 2...)
    DATES.forEach((date, i) => {
      result.push({
        slot_id: `slt_${n++}`, // on prend le numéro actuel, puis on ajoute 1
        course_id,
        starts_at: `${date}T14:00:00+01:00`, // toujours à 14h
        seats_total: 8,
        seats_available: AVAILABLE[i], // les places libres de cette date
        price_cents: i === 2 ? price + 1000 : price, // la 3e date coûte 10 euros de plus
      });
    });
  }
  return result;
}

// On range la liste dans "globalThis", l'espace commun de tout le programme.
// Sans ça, Next.js peut recharger ce fichier plusieurs fois en développement
// et chaque route aurait sa propre copie des créneaux.
const globalForDb = globalThis as unknown as { slots?: Slot[] };
// "??=" veut dire : si la liste n'existe pas encore, on la fabrique, sinon on garde l'ancienne.
export const slots = (globalForDb.slots ??= buildSlots());

// Décrit une réservation enregistrée.
export type Booking = {
  booking_id: string; // identifiant de la réservation
  slot_id: string; // le créneau réservé
  seats: number; // nombre de places réservées
  total_cents: number; // prix total en centimes
  confirmation_code: string; // le code donné à la cliente
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string; // le "?" veut dire que le téléphone peut manquer
  };
  notes?: string; // précision facultative
};

// Même principe que pour les créneaux : la liste des réservations est partagée par toutes les routes.
const globalForBookings = globalThis as unknown as { bookings?: Booking[] };
export const bookings = (globalForBookings.bookings ??= []);

// Remet tout à zéro (utile pour rejouer les tests).
export function resetDb() {
  // splice remplace le contenu de la MÊME liste (on ne crée pas une nouvelle liste,
  // sinon les autres fichiers continueraient de voir l'ancienne)
  slots.splice(0, slots.length, ...buildSlots());
  bookings.splice(0, bookings.length);
}

// Un petit drapeau pour provoquer une panne sur la prochaine réservation.
// "nextFail" contient le nom de la panne, ou null s'il n'y en a pas.
const globalForFlags = globalThis as unknown as { flags?: { nextFail: string | null } };
export const flags = (globalForFlags.flags ??= { nextFail: null });
