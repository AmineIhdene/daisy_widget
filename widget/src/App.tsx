// L'application du widget : les 4 écrans (cours, créneaux, coordonnées, confirmation)
// et tout ce qui se passe quand ça charge, ça marche ou ça échoue.

import { useEffect, useMemo, useRef, useState } from "preact/hooks"; // les outils de Preact pour la mémoire et les effets
import { createApi, ApiError, type BookingResult, type Course, type Slot, type Studio } from "./api";
import { euros, formatSlot, levelLabel, shorten } from "./format";

// L'état de démarrage : soit "loading", soit "error", soit les données chargées.
type Boot = "loading" | "error" | { studio: Studio; courses: Course[] };
// Les 4 écrans possibles.
type Step = "courses" | "slots" | "form" | "done";

const DAY = 24 * 60 * 60 * 1000; // un jour en millisecondes
// Le formulaire vide au départ.
const emptyForm = { first_name: "", last_name: "", email: "", phone: "", notes: "" };
// Message quand on ne sait PAS si la réservation a été créée (délai dépassé, réseau coupé, panne).
const UNCERTAIN =
  "Nous n'avons pas pu confirmer votre réservation. Avant de réessayer, vérifiez votre boîte mail : si vous avez reçu une confirmation, votre place est bien réservée.";

// Affiche l'image du cours, ou une pastille avec l'initiale si elle manque ou ne charge pas.
function Thumb({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false); // devient vrai si l'image ne charge pas
  if (!src || failed) {
    // pas d'image : on affiche la première lettre du nom
    return <div class="dw-thumb" aria-hidden="true">{name.charAt(0)}</div>;
  }
  // sinon on affiche l'image (chargée au moment où elle devient visible), avec repli en cas d'erreur
  return <img class="dw-thumb" src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export function App({ apiBase }: { apiBase: string }) {
  // On crée les fonctions d'appel à l'API une seule fois (tant que l'adresse ne change pas).
  const api = useMemo(() => createApi(apiBase), [apiBase]);

  // ----- La mémoire du widget (chaque changement redessine l'écran) -----
  const [boot, setBoot] = useState<Boot>("loading"); // chargement de l'atelier et des cours
  const [step, setStep] = useState<Step>("courses"); // l'écran affiché
  const [course, setCourse] = useState<Course | null>(null); // le cours choisi
  const [windowStart, setWindowStart] = useState(() => new Date()); // début de la fenêtre de créneaux affichée
  const [slots, setSlots] = useState<Slot[] | null>(null); // les créneaux (null = en cours de chargement)
  const [slotsError, setSlotsError] = useState(false); // vrai si le chargement des créneaux a échoué
  const [slot, setSlot] = useState<Slot | null>(null); // le créneau choisi
  const [seats, setSeats] = useState(1); // le nombre de places choisi
  const [form, setForm] = useState(emptyForm); // ce que la cliente a tapé
  const [submitting, setSubmitting] = useState(false); // vrai pendant l'envoi de la réservation
  const [notice, setNotice] = useState<string | null>(null); // le message d'erreur affiché dans le cadre jaune
  const [conflict, setConflict] = useState<number | null>(null); // places restantes quand le créneau est plein (null = pas de conflit)
  const [result, setResult] = useState<BookingResult | null>(null); // la réponse quand la réservation marche
  // Verrou anti double-clic. Contrairement à useState, il change TOUT DE SUITE, sans attendre le prochain affichage.
  const inFlight = useRef(false);

  // Charge l'atelier et les cours en même temps.
  const load = () => {
    setBoot("loading");
    Promise.all([api.studio(), api.courses()])
      .then(([studio, courses]) => setBoot({ studio, courses })) // tout est arrivé
      .catch((e) => {
        // Si le domaine n'est pas déclaré, on prévient l'artisan dans la console (pas la cliente).
        if (e instanceof ApiError && e.code === "origin_not_allowed") {
          console.error("[Daisy] Ce domaine n'est pas déclaré : ajoutez-le dans votre back-office Daisy.");
        }
        setBoot("error"); // dans tous les cas, on affiche l'écran d'erreur
      });
  };
  useEffect(load, []); // s'exécute une seule fois, quand le widget apparaît

  // Charge les créneaux d'un cours à partir d'une date.
  const loadSlots = (c: Course, start: Date) => {
    setSlots(null); // on affiche "Chargement des créneaux"
    setSlotsError(false);
    const end = new Date(start.getTime() + 89 * DAY); // l'API refuse plus de 90 jours, on prend 89
    api.slots(c.course_id, start, end).then(setSlots).catch(() => setSlotsError(true));
  };

  // Quand la cliente clique sur un cours.
  const chooseCourse = (c: Course) => {
    const start = new Date(); // on commence à aujourd'hui
    setCourse(c);
    setWindowStart(start);
    setStep("slots"); // on passe à l'écran des créneaux
    loadSlots(c, start);
  };

  // Bouton "Voir les créneaux suivants" : on décale la fenêtre de 89 jours, la même durée que la fenêtre
  // (sinon un jour est sauté entre deux fenêtres).
  const nextWindow = () => {
    if (!course) return;
    const start = new Date(windowStart.getTime() + 89 * DAY);
    setWindowStart(start);
    loadSlots(course, start);
  };

  // Quand la cliente clique sur un créneau.
  const chooseSlot = (s: Slot) => {
    setSlot(s);
    setSeats(1); // on repart à 1 place
    setNotice(null); // on efface les anciens messages
    setConflict(null);
    setStep("form"); // on passe au formulaire
  };

  // Retour à la liste des créneaux (on la recharge pour avoir les places à jour).
  const backToSlots = () => {
    setNotice(null);
    setConflict(null);
    setStep("slots");
    if (course) loadSlots(course, windowStart);
  };

  // La cliente accepte de réserver seulement les places restantes.
  const acceptAvailable = (n: number) => {
    if (slot) setSlot({ ...slot, seats_available: n }); // on met à jour le stock connu
    setSeats(n); // elle réserve n places
    setNotice(null);
    setConflict(null);
  };

  // Choisit le message à afficher selon l'erreur reçue de l'API.
  const showBookingError = (err: unknown) => {
    // Pas une erreur de l'API (réseau coupé, délai dépassé) : on ne sait pas si la réservation existe.
    if (!(err instanceof ApiError)) return setNotice(UNCERTAIN);
    switch (err.code) {
      case "slot_full": {
        // Plus assez de places. L'API dit combien il en reste.
        const n = err.available ?? 0;
        setConflict(n); // sert à afficher les boutons de sortie
        setNotice(
          n > 0
            ? `Il ne reste que ${n} place${n > 1 ? "s" : ""} sur ce créneau, et vous en demandiez ${seats}. Vous pouvez réserver ${n} place${n > 1 ? "s" : ""} ou choisir un autre horaire. Vos informations sont conservées.`
            : "Ce créneau vient de se remplir. Vos informations sont conservées : choisissez un autre horaire."
        );
        return;
      }
      case "slot_cancelled":
        // L'atelier a annulé le créneau.
        setConflict(0);
        setNotice("L'atelier a dû annuler ce créneau. Vos informations sont conservées : choisissez un autre horaire.");
        return;
      case "phone_required":
      case "too_many_seats":
      case "invalid_seats":
      case "invalid_customer":
        // Un problème dans ce qu'elle a saisi.
        return setNotice("Merci de vérifier vos coordonnées et le nombre de places.");
      case "rate_limited":
        // Trop de tentatives.
        return setNotice("Trop de tentatives pour le moment. Merci de réessayer dans quelques minutes.");
      case "origin_not_allowed":
        // Domaine non déclaré : détail pour l'artisan dans la console, message neutre pour la cliente.
        console.error("[Daisy] Ce domaine n'est pas déclaré : ajoutez-le dans votre back-office Daisy.");
        return setNotice("La réservation en ligne n'est pas disponible depuis ce site pour le moment. Merci de contacter l'atelier directement.");
      default:
        // Toute autre erreur (500 par exemple) : on ne sait pas si c'est passé.
        return setNotice(UNCERTAIN);
    }
  };

  // Quand la cliente valide le formulaire.
  const submit = async (e: Event) => {
    e.preventDefault(); // empêche le navigateur de recharger la page
    // Si une réservation est déjà partie, on ignore ce clic (c'est le second clic d'un double-clic).
    if (inFlight.current || !slot) return;
    inFlight.current = true; // on pose le verrou
    setSubmitting(true); // le bouton se grise et affiche "Réservation en cours..."
    setNotice(null);
    try {
      // On envoie la réservation. Un seul essai, jamais de relance automatique.
      const res = await api.book({
        slot_id: slot.slot_id,
        seats,
        customer: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone || undefined, // téléphone vide = on ne l'envoie pas
        },
        notes: form.notes || undefined,
      });
      setResult(res); // on garde la réponse
      setStep("done"); // écran de confirmation
    } catch (err) {
      showBookingError(err); // sinon on affiche le bon message
    } finally {
      inFlight.current = false; // dans tous les cas on enlève le verrou
      setSubmitting(false);
    }
  };

  // Petit raccourci pour relier un champ du formulaire à la mémoire.
  const bind = (k: keyof typeof emptyForm) => ({
    value: form[k], // la valeur affichée
    onInput: (e: Event) => setForm({ ...form, [k]: (e.target as HTMLInputElement).value }), // à chaque frappe, on met à jour
  });

  // ---------- Ce qu'on affiche ----------

  // État 1 : ça charge.
  if (boot === "loading") {
    return <div class="dw"><p class="dw-muted">Chargement…</p></div>;
  }
  // État 2 : ça a échoué. On propose de réessayer.
  if (boot === "error") {
    return (
      <div class="dw">
        <p>La réservation est indisponible pour le moment.</p>
        <button class="dw-btn" onClick={load}>Réessayer</button>
      </div>
    );
  }

  // État 3 : ça marche. On sort les données de l'atelier.
  const { studio, courses } = boot;
  const tz = studio.timezone; // fuseau horaire de l'atelier
  // On donne la couleur de l'atelier au CSS, via la variable --dw-primary.
  const style = { "--dw-primary": studio.branding.primary_color } as any;

  // Écran 1 : les cours.
  if (step === "courses") {
    return (
      <div class="dw" style={style}>
        <h2>{studio.name}</h2>
        <p class="dw-muted">Choisissez un cours</p>
        {courses.length === 0 && <p>Aucun cours n'est proposé pour le moment.</p>}
        <div class="dw-cards">
          {courses.map((c) => (
            <button class="dw-card" key={c.course_id} onClick={() => chooseCourse(c)}>
              <Thumb src={c.image_url} name={c.name} />
              <span class="dw-title">{c.name}</span>
              <span class="dw-muted">
                {levelLabel(c.level)} · {c.duration_minutes} min · dès {euros(c.price_cents, studio.currency)}
              </span>
              {/* On n'affiche la description que si elle existe, et on la raccourcit */}
              {c.description && <span class="dw-muted">{shorten(c.description)}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Écran 2 : les créneaux du cours choisi.
  if (step === "slots" && course) {
    return (
      <div class="dw" style={style}>
        <button class="dw-link" onClick={() => setStep("courses")}>← Changer de cours</button>
        <h2>{course.name}</h2>
        {course.description && <p class="dw-muted">{course.description}</p>}

        {/* Si le chargement a échoué : message + bouton Réessayer */}
        {slotsError && (
          <>
            <p>Impossible de charger les créneaux.</p>
            <button class="dw-btn" onClick={() => loadSlots(course, windowStart)}>Réessayer</button>
          </>
        )}
        {/* Pendant le chargement */}
        {!slotsError && slots === null && <p class="dw-muted">Chargement des créneaux…</p>}
        {/* Chargé mais aucun créneau sur cette période */}
        {slots && slots.length === 0 && <p>Aucun créneau sur cette période.</p>}
        {/* La liste des créneaux */}
        {slots &&
          slots.map((s) => {
            const full = s.seats_available === 0; // complet ?
            return (
              <button class="dw-slot" key={s.slot_id} disabled={full} onClick={() => chooseSlot(s)}>
                <span>{formatSlot(s.starts_at, tz)}</span>
                <span>
                  {full ? "Complet" : s.seats_available === 1 ? "Dernière place" : `${s.seats_available} places`}
                  {" · "}
                  {euros(s.price_cents, studio.currency)}
                </span>
              </button>
            );
          })}
        {/* Pour voir la fenêtre suivante de 90 jours */}
        {slots && <button class="dw-link" onClick={nextWindow}>Voir les créneaux suivants →</button>}
      </div>
    );
  }

  // Écran 3 : les coordonnées.
  if (step === "form" && course && slot) {
    // Le nombre de places proposé ne dépasse ni le plafond de l'atelier, ni les places restantes (et au moins 1).
    const maxSeats = Math.max(1, Math.min(studio.booking_policy.max_seats_per_booking, slot.seats_available));
    return (
      <div class="dw" style={style}>
        <button class="dw-link" onClick={backToSlots}>← Changer d'horaire</button>
        <h2>{course.name}</h2>
        <p class="dw-muted">{formatSlot(slot.starts_at, tz)}</p>

        {/* Le cadre jaune des messages (place prise, erreur...) */}
        {notice && (
          <div class="dw-alert" role="alert">
            <p>{notice}</p>
            {/* S'il reste des places, on propose de réserver ce qui reste */}
            {conflict !== null && conflict > 0 && (
              <button type="button" class="dw-btn" onClick={() => acceptAvailable(conflict)}>
                Réserver {conflict} place{conflict > 1 ? "s" : ""}
              </button>
            )}
            {/* Dans tous les cas de conflit, on propose de changer d'horaire */}
            {conflict !== null && (
              <button type="button" class="dw-link" onClick={backToSlots}>Choisir un autre horaire</button>
            )}
          </div>
        )}

        {/* Le formulaire. Les champs ne sont jamais effacés en cas d'erreur. */}
        <form onSubmit={submit}>
          <label class="dw-field">
            Nombre de places
            <select value={seats} onChange={(e) => setSeats(Number((e.target as HTMLSelectElement).value))}>
              {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
                <option value={n} key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label class="dw-field">Prénom<input required autocomplete="given-name" {...bind("first_name")} /></label>
          <label class="dw-field">Nom<input required autocomplete="family-name" {...bind("last_name")} /></label>
          <label class="dw-field">Email<input required type="email" autocomplete="email" {...bind("email")} /></label>
          <label class="dw-field">
            {/* Le téléphone est obligatoire ou facultatif selon la règle de l'atelier */}
            Téléphone{studio.booking_policy.requires_phone ? "" : " (facultatif)"}
            <input type="tel" autocomplete="tel" required={studio.booking_policy.requires_phone} {...bind("phone")} />
          </label>
          <label class="dw-field">Une précision pour l'atelier ? (facultatif)<textarea rows={2} {...bind("notes")} /></label>

          <p>
            {/* Le total affiché est une estimation : celui du serveur fait foi */}
            <strong>Total estimé : {euros(seats * slot.price_cents, studio.currency)}</strong>
            <br />
            <span class="dw-muted">Le montant définitif est confirmé par l'atelier.</span>
          </p>
          {/* Bouton désactivé pendant l'envoi pour éviter le double-clic */}
          <button class="dw-btn" type="submit" disabled={submitting}>
            {submitting ? "Réservation en cours…" : "Réserver"}
          </button>
        </form>
      </div>
    );
  }

  // Écran 4 : la confirmation.
  return (
    <div class="dw" style={style}>
      <h2>Réservation confirmée</h2>
      <p>Votre code de confirmation : <strong>{result?.confirmation_code}</strong></p>
      {result && <p>Total : {euros(result.total_cents, studio.currency)}</p>}
      <p class="dw-muted">Conservez ce code, il vous sera demandé à l'atelier.</p>
    </div>
  );
}
