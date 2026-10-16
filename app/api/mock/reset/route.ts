// Route de test, qui ne fait PAS partie de l'API Daisy.
// Elle remet les places et les réservations à leur état de départ.

import { NextResponse, connection } from "next/server";
import { resetDb } from "@/lib/mock-db"; // la fonction qui remet tout à zéro

export async function GET() {
  // Sans ça, Next exécute la route une seule fois au build et renvoie toujours la même réponse :
  // le reset ne se ferait jamais en production. connection() dit "attends une vraie requête".
  await connection();
  resetDb(); // on remet tout à zéro
  return NextResponse.json({ ok: true }); // on répond que c'est fait
}
