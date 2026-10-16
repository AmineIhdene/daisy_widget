// Tout ce qui parle à l'API est ici.

// ----- Les formes des données reçues ou envoyées -----

export type Studio = {
  name: string;
  timezone: string;
  currency: string;
  branding: { primary_color: string; logo_url?: string };
  booking_policy: { requires_phone: boolean; cancellation_hours: number; max_seats_per_booking: number };
};
export type Course = {
  course_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  image_url: string | null; // peut être vide (null)
  level: string;
};
export type Slot = {
  slot_id: string;
  starts_at: string;
  seats_total: number;
  seats_available: number;
  price_cents: number;
};
// Ce que le widget envoie pour réserver.
export type BookingPayload = {
  slot_id: string;
  seats: number;
  customer: { first_name: string; last_name: string; email: string; phone?: string };
  notes?: string;
};
// Ce que l'API répond quand la réservation marche.
export type BookingResult = {
  booking_id: string;
  status: string;
  confirmation_code: string;
  total_cents: number;
};

// ----- Les deux sortes d'erreurs -----

// Le serveur a répondu, mais par un refus (409, 422, 429, 500...). On sait ce qui s'est passé.
export class ApiError extends Error {
  constructor(public status: number, public code: string, public available?: number) {
    super(code);
  }
}
// On n'a eu aucune réponse (réseau coupé, délai dépassé). On ne sait pas ce qui s'est passé.
export class NetworkError extends Error {}

// Fait un appel à l'API et renvoie le résultat. Si ça rate, ça lance une des deux erreurs ci-dessus.
async function request<T>(url: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController(); // permet d'arrêter la demande
  const timer = setTimeout(() => controller.abort(), timeoutMs); // au bout du délai, on arrête d'attendre
  try {
    const res = await fetch(url, { ...init, signal: controller.signal }); // on envoie la demande
    // On lit la réponse en JSON. Si elle est vide ou illisible, on prend un objet vide au lieu de planter.
    const data = (await res.json().catch(() => ({}))) as { error?: string; available?: number };
    // fetch ne considère pas un 409 ou un 500 comme une erreur : on la crée nous-mêmes.
    if (!res.ok) throw new ApiError(res.status, data.error ?? "unknown", data.available);
    return data as T; // tout va bien, on renvoie les données
  } catch (e) {
    if (e instanceof ApiError) throw e; // une erreur de l'API, on la laisse passer telle quelle
    throw new NetworkError(); // sinon c'est qu'on n'a pas eu de réponse
  } finally {
    clearTimeout(timer); // dans tous les cas, on arrête le minuteur
  }
}

// Transforme une date en texte "2027-01-09" (l'API attend ce format).
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

// Regroupe les 4 appels possibles. "base" est l'adresse de l'API.
export function createApi(base: string) {
  return {
    // Infos de l'atelier.
    studio: () => request<Studio>(`${base}/studio`),
    // Liste des cours (on ne garde que le tableau "courses").
    courses: () => request<{ courses: Course[] }>(`${base}/courses`).then((r) => r.courses),
    // Créneaux d'un cours entre deux dates (on ne garde que le tableau "slots").
    slots: (courseId: string, from: Date, to: Date) =>
      request<{ slots: Slot[] }>(
        `${base}/courses/${courseId}/slots?from=${isoDay(from)}&to=${isoDay(to)}`
      ).then((r) => r.slots),
    // Création d'une réservation. Délai de 15 s car cette route est lente.
    book: (payload: BookingPayload) =>
      request<BookingResult>(
        `${base}/bookings`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
        15000
      ),
  };
}
