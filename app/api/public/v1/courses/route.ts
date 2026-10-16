// Route GET /courses : renvoie la liste des cours de l'atelier.

import { NextResponse } from "next/server"; // l'outil pour fabriquer la réponse

// S'exécute à chaque demande GET sur /courses.
export async function GET() {
  return NextResponse.json({
    courses: [
      // Cours 1 : un cours normal, avec tout rempli.
      {
        course_id: "crs_118", // identifiant du cours
        name: "Tour de potier — débutant", // son nom
        description:
          "Deux heures d'initiation au tournage. Tout le matériel est fourni, prévoyez des vêtements qui ne craignent rien.",
        duration_minutes: 120, // durée en minutes
        price_cents: 7500, // prix en centimes (75 euros), pour éviter les erreurs d'arrondi
        image_url: "https://cdn.daisy.example/courses/crs_118.jpg", // image (le domaine n'existe pas, donc elle ne charge pas)
        level: "debutant", // niveau
      },
      // Cours 2 : cas pénible exprès, pas d'image et pas de description.
      {
        course_id: "crs_120",
        name: "Modelage et émaillage",
        description: "", // vide
        duration_minutes: 90,
        price_cents: 6000,
        image_url: null, // pas d'image
        level: "debutant",
      },
      // Cours 3 : cas pénible exprès, description très longue.
      {
        course_id: "crs_131",
        name: "Perfectionnement au tour — pièces hautes",
        description:
          "Ce cours s'adresse aux personnes qui ont déjà tourné quelques pièces et qui souhaitent monter en hauteur : cylindres, vases, bouteilles. Nous travaillons le centrage de grosses quantités de terre, la régularité des parois, le contrôle de la vitesse du tour et les finitions au tournassage. Chaque participant repart avec deux à trois pièces, cuites et émaillées par nos soins, à récupérer à l'atelier trois semaines plus tard. Le groupe est limité pour que chacun bénéficie d'un accompagnement individuel. Prévoyez un tablier, des vêtements qui ne craignent rien et des ongles courts.",
        duration_minutes: 180,
        price_cents: 11000,
        image_url: "https://cdn.daisy.example/courses/crs_131.jpg",
        level: "intermediaire",
      },
    ],
  });
}
