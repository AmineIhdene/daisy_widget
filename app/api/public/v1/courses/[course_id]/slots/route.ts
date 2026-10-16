// Route GET /courses/{course_id}/slots : renvoie les créneaux d'un cours.
// Les crochets [course_id] dans le nom du dossier veulent dire : cette partie de l'adresse change
// (crs_118, crs_120...). Une seule route sert donc tous les cours.

import { NextResponse, type NextRequest } from "next/server";
import { slots } from "@/lib/mock-db"; // la liste des créneaux en mémoire

const MAX_WINDOW_DAYS = 90; // l'énoncé interdit de demander plus de 90 jours d'un coup
const DAY_MS = 24 * 60 * 60 * 1000; // un jour en millisecondes

export async function GET(
  request: NextRequest, // la demande reçue (on s'en sert pour lire ?from= et ?to=)
  { params }: { params: Promise<{ course_id: string }> } // contient l'identifiant du cours pris dans l'adresse
) {
  // On récupère l'identifiant du cours depuis l'adresse.
  const { course_id } = await params;

  // Si aucun créneau n'appartient à ce cours, c'est que le cours n'existe pas : erreur 404.
  if (!slots.some((s) => s.course_id === course_id)) {
    return NextResponse.json({ error: "course_not_found" }, { status: 404 });
  }

  // On lit les paramètres après le "?" dans l'adresse : from (début) et to (fin).
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // On transforme les dates en nombres pour pouvoir les comparer.
  // Si "from" manque on prend maintenant, si "to" manque on prend from + 90 jours.
  const fromMs = from ? Date.parse(from) : Date.now();
  const toMs = to ? Date.parse(to) : fromMs + MAX_WINDOW_DAYS * DAY_MS;

  // Si une des dates n'est pas lisible, erreur 400.
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  // Si la fenêtre dépasse 90 jours, erreur 400 comme dans l'énoncé.
  if (toMs - fromMs > MAX_WINDOW_DAYS * DAY_MS) {
    return NextResponse.json({ error: "window_too_large" }, { status: 400 });
  }

  const result = slots
    .filter((s) => s.course_id === course_id) // on garde seulement les créneaux de ce cours
    .filter((s) => {
      // on garde seulement ceux qui tombent entre from et to
      const t = Date.parse(s.starts_at);
      return t >= fromMs && t <= toMs;
    })
    .map((s) => ({
      // on renvoie uniquement les champs de l'énoncé (on cache course_id, interne à notre mock)
      slot_id: s.slot_id,
      starts_at: s.starts_at,
      seats_total: s.seats_total,
      seats_available: s.seats_available,
      price_cents: s.price_cents,
    }));

  return NextResponse.json({ slots: result });
}
