// Route POST /bookings : crée une réservation.
// C'est l'employé au guichet : il regarde la demande, vérifie les règles,
// vérifie le stock de places, puis enregistre et donne un code.

import { NextResponse, type NextRequest } from "next/server";
import { slots, bookings, flags } from "@/lib/mock-db"; // créneaux, réservations et le drapeau de panne

// Règles de l'atelier (les mêmes que dans /studio).
const MAX_SEATS_PER_BOOKING = 4; // maximum de places par réservation
const REQUIRES_PHONE = true; // le téléphone est obligatoire

// Fait attendre le serveur pendant "ms" millisecondes.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fabrique un code de confirmation du genre "TF-3K9Q".
function confirmationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // lettres et chiffres (sans O, 0, I, 1 qui se ressemblent)
  let code = "";
  for (let i = 0; i < 4; i++) {
    // on pique 4 caractères au hasard
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TF-${code}`;
}

// S'exécute quand quelqu'un envoie une demande POST sur /bookings.
export async function POST(request: NextRequest) {
  const params = new URL(request.url).searchParams; // les paramètres après le "?"
  // La panne à jouer : soit celle demandée dans l'adresse (?fail=...), soit celle posée par /api/mock/fail.
  const fail = params.get("fail") ?? flags.nextFail;
  flags.nextFail = null; // la panne ne vaut que pour UNE réservation, on la remet à zéro
  const delayParam = params.get("delay"); // ?delay=... permet de forcer la durée d'attente

  // 1. L'attente : entre 1,5 et 4 secondes comme dans l'énoncé, sauf si ?delay=... est donné.
  // Ex : ?delay=0 donne une réponse immédiate, pratique pour tester vite.
  const delay =
    delayParam !== null ? Number(delayParam) : 1500 + Math.random() * 2500;
  await sleep(delay);

  // 2. Les pannes provoquées à la demande. Chaque "return" termine la fonction tout de suite.
  if (fail === "origin_not_allowed") {
    // domaine non déclaré par l'artisan
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }
  if (fail === "rate_limited") {
    // trop de demandes
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  if (fail === "server_error") {
    // panne du serveur
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (fail === "slot_cancelled") {
    // l'artisan a annulé le créneau
    return NextResponse.json({ error: "slot_cancelled" }, { status: 409 });
  }
  if (fail === "slot_full") {
    // plus assez de places, on dit combien il en reste
    return NextResponse.json(
      { error: "slot_full", available: Number(params.get("available") ?? 0) },
      { status: 409 }
    );
  }

  // 3. On lit le contenu de la demande (le JSON envoyé par le widget).
  let body;
  try {
    body = await request.json();
  } catch {
    // si le contenu est illisible, on refuse
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // On sort les morceaux dont on a besoin.
  const { slot_id, seats, customer, notes } = body ?? {};

  // On cherche le créneau demandé dans la liste.
  const slot = slots.find((s) => s.slot_id === slot_id);
  if (!slot) {
    // le créneau n'existe pas
    return NextResponse.json({ error: "slot_not_found" }, { status: 404 });
  }
  if (!Number.isInteger(seats) || seats < 1) {
    // le nombre de places doit être un entier d'au moins 1
    return NextResponse.json({ error: "invalid_seats" }, { status: 422 });
  }
  if (seats > MAX_SEATS_PER_BOOKING) {
    // plus que le plafond de l'atelier
    return NextResponse.json({ error: "too_many_seats" }, { status: 422 });
  }
  if (!customer?.first_name || !customer?.last_name || !customer?.email) {
    // prénom, nom ou email manquant
    return NextResponse.json({ error: "invalid_customer" }, { status: 422 });
  }
  if (REQUIRES_PHONE && !customer.phone) {
    // le téléphone est obligatoire et il manque
    return NextResponse.json({ error: "phone_required" }, { status: 422 });
  }

  // 4. On vérifie le stock de places, puis on réserve.
  if (seats > slot.seats_available) {
    // pas assez de places : 409, avec le nombre qu'il en reste
    return NextResponse.json(
      { error: "slot_full", available: slot.seats_available },
      { status: 409 }
    );
  }
  slot.seats_available -= seats; // on retire les places du stock

  // On fabrique la réservation.
  const booking = {
    booking_id: `bkg_${88120 + bookings.length}`, // identifiant qui augmente à chaque réservation
    slot_id: slot.slot_id,
    seats,
    total_cents: seats * slot.price_cents, // le total est calculé ici, par le serveur
    confirmation_code: confirmationCode(),
    customer,
    notes,
  };
  bookings.push(booking); // on l'ajoute au cahier des réservations

  // Panne "réponse perdue" : la réservation existe déjà, mais la réponse met 20 secondes à arriver.
  // Le widget abandonne avant, alors que la place est déjà prise.
  if (fail === "hang") await sleep(20000);

  // On répond 201 (créé) avec les infos de la réservation.
  return NextResponse.json(
    {
      booking_id: booking.booking_id,
      status: "confirmed",
      confirmation_code: booking.confirmation_code,
      total_cents: booking.total_cents,
    },
    { status: 201 }
  );
}
