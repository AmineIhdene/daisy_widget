// Route GET /studio : renvoie les infos de l'atelier.
// L'adresse vient du chemin du dossier : app/api/public/v1/studio donne /api/public/v1/studio.

// On va chercher l'outil de Next.js qui sait fabriquer une réponse.
import { NextResponse } from "next/server";

// Cette fonction s'exécute quand quelqu'un fait une demande GET sur cette adresse.
export async function GET() {
  // On renvoie une réponse au format JSON (des paires "nom : valeur").
  return NextResponse.json({
    studio_id: "std_2201", // identifiant de l'atelier
    name: "Atelier Terre & Feu", // son nom
    timezone: "Europe/Paris", // son fuseau horaire : le widget affiche les heures dans celui-ci
    currency: "EUR", // la devise
    branding: {
      primary_color: "#C4643A", // la couleur principale, utilisée pour les boutons
      logo_url: "https://cdn.daisy.example/logos/std_2201.png", // le logo
    },
    booking_policy: {
      requires_phone: true, // le téléphone est obligatoire pour réserver
      cancellation_hours: 48, // délai d'annulation en heures
      max_seats_per_booking: 4, // maximum de places par réservation
    },
  });
}
