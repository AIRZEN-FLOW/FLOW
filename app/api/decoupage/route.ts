// Étape 6 — Découpage automatique d'une tâche en sous-tâches par l'IA.
// Route CÔTÉ SERVEUR uniquement : la clé ANTHROPIC_API_KEY ne quitte jamais Render.
// Protégée par le jeton d'identité Firebase de l'utilisatrice connectée.
import Anthropic from "@anthropic-ai/sdk";
import { getAdminAuth } from "@/lib/firebase/admin";

export interface SousTacheProposee {
  titre: string;
  dureeEstimeeMinutes: number;
}

// Schéma JSON imposé à la réponse du modèle (sorties structurées) :
// le JSON renvoyé est garanti conforme, pas besoin de parsing défensif.
const SCHEMA_DECOUPAGE = {
  type: "object",
  properties: {
    sousTaches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titre: { type: "string" },
          dureeEstimeeMinutes: { type: "integer" },
        },
        required: ["titre", "dureeEstimeeMinutes"],
        additionalProperties: false,
      },
    },
  },
  required: ["sousTaches"],
  additionalProperties: false,
} as const;

export async function POST(request: Request) {
  // 1. Authentification : on vérifie le jeton Firebase envoyé par le navigateur.
  const enTete = request.headers.get("authorization") ?? "";
  const jeton = enTete.startsWith("Bearer ") ? enTete.slice(7) : null;
  if (!jeton) {
    return Response.json({ erreur: "Non authentifiée." }, { status: 401 });
  }
  try {
    await getAdminAuth().verifyIdToken(jeton);
  } catch {
    return Response.json(
      {
        erreur:
          "Vérification impossible. Si le problème persiste, la variable FIREBASE_SERVICE_ACCOUNT_KEY est peut-être absente sur Render.",
      },
      { status: 401 },
    );
  }

  // 2. Configuration : la clé API Anthropic doit être présente sur Render.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        erreur:
          "Le découpage par IA n'est pas encore configuré : ajoutez ANTHROPIC_API_KEY dans les variables d'environnement Render.",
      },
      { status: 501 },
    );
  }

  // 3. Entrée : titre + description + durée estimée de la tâche.
  const corps = await request.json().catch(() => null);
  const titre = typeof corps?.titre === "string" ? corps.titre.trim() : "";
  const description =
    typeof corps?.description === "string" ? corps.description.trim() : "";
  const duree = Number(corps?.dureeEstimeeMinutes);
  if (!titre || !Number.isFinite(duree) || duree <= 0) {
    return Response.json(
      { erreur: "Titre et durée estimée sont requis." },
      { status: 400 },
    );
  }

  // 4. Appel au modèle avec sortie structurée.
  const client = new Anthropic();
  try {
    const reponse = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: SCHEMA_DECOUPAGE } },
      system:
        "Tu aides une professionnelle française à découper une tâche trop longue en sous-tâches réalisables. " +
        "Propose entre 2 et 5 sous-tâches, dans l'ordre logique de réalisation, avec pour chacune un titre " +
        "court et concret (en français) et une durée estimée en minutes. La somme des durées doit rester " +
        "proche de la durée totale indiquée, sans devoir être exacte.",
      messages: [
        {
          role: "user",
          content:
            `Tâche : ${titre}\n` +
            (description ? `Détails : ${description}\n` : "") +
            `Durée estimée totale : ${duree} minutes.`,
        },
      ],
    });

    if (reponse.stop_reason === "refusal") {
      return Response.json(
        { erreur: "L'IA n'a pas pu traiter cette demande. Gardez la tâche entière." },
        { status: 502 },
      );
    }

    const blocTexte = reponse.content.find((b) => b.type === "text");
    const donnees = blocTexte ? JSON.parse(blocTexte.text) : null;
    const sousTaches: SousTacheProposee[] = (donnees?.sousTaches ?? [])
      .filter(
        (s: SousTacheProposee) =>
          s.titre?.trim() && Number.isFinite(s.dureeEstimeeMinutes) && s.dureeEstimeeMinutes > 0,
      )
      .slice(0, 5);

    if (sousTaches.length < 2) {
      return Response.json(
        { erreur: "Proposition inutilisable, réessayez ou gardez la tâche entière." },
        { status: 502 },
      );
    }

    return Response.json({ sousTaches });
  } catch (e) {
    console.error("Erreur API Anthropic :", e);
    return Response.json(
      { erreur: "Le service de découpage est momentanément indisponible." },
      { status: 502 },
    );
  }
}
