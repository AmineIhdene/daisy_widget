// Route de test, qui ne fait PAS partie de l'API Daisy.
// Elle dit au mock : "la PROCHAINE réservation va échouer avec telle panne".
// Exemple : /api/mock/fail?mode=server_error

import { NextRequest, NextResponse, connection } from "next/server";
import { flags } from "@/lib/mock-db"; // le drapeau lu par POST /bookings

export async function GET(request: NextRequest) {
  // Sécurité : la route reste exécutée à chaque appel, même si un jour on ne lit plus request.url.
  await connection();
  // On lit le mode demandé dans l'adresse et on le range dans le drapeau.
  flags.nextFail = new URL(request.url).searchParams.get("mode");
  // On répond avec la valeur enregistrée, pour vérifier que c'est bien pris en compte.
  return NextResponse.json({ nextFail: flags.nextFail });
}
