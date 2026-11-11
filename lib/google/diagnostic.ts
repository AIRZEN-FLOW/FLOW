// Messages affichés à l'utilisatrice quand Google Agenda ne se connecte pas ou
// ne se synchronise plus : pour chaque cause, ce qui se passe et quoi faire.
// (Fichier sans secret, utilisable côté navigateur.)

export interface MessageDiagnostic {
  titre: string;
  quoiFaire: string;
}

const MESSAGES: Record<string, MessageDiagnostic> = {
  autorisation_expiree: {
    titre: "L'autorisation donnée à Google a expiré ou a été retirée.",
    quoiFaire:
      "Cliquez sur « Reconnecter Google Agenda ». Si cela se reproduit au bout d'une semaine, c'est que l'application est restée en mode « Test » dans Google Cloud : passez-la « En production » (voir l'aide ci-dessous).",
  },
  api_desactivee: {
    titre: "L'API Google Calendar n'est pas activée dans votre projet Google Cloud.",
    quoiFaire:
      "Dans Google Cloud, ouvrez « API et services » puis « Bibliothèque », cherchez « Google Calendar API » et cliquez sur « Activer ». Attendez une minute, puis retestez.",
  },
  configuration: {
    titre: "Google refuse les identifiants de l'application.",
    quoiFaire:
      "Vérifiez dans Render que GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sont bien ceux de votre client OAuth, et que l'adresse de redirection ci-dessous est déclarée dans Google Cloud.",
  },
  refus: {
    titre: "Google n'a pas accordé l'accès.",
    quoiFaire:
      "Si vous avez vous-même annulé, recommencez. Si Google a affiché « Accès bloqué », votre adresse n'est pas autorisée : ajoutez-la comme utilisatrice de test, ou passez l'application « En production » (voir l'aide ci-dessous).",
  },
  session: {
    titre: "La demande de connexion a expiré.",
    quoiFaire: "Elle n'est valable que 10 minutes. Cliquez à nouveau sur le bouton de connexion.",
  },
  sans_jeton: {
    titre: "Google n'a pas fourni d'autorisation durable.",
    quoiFaire:
      "Recommencez la connexion et acceptez l'écran d'autorisation en entier. Si cela persiste, retirez l'accès « AIR ZEN Flow » dans votre compte Google (Sécurité, accès tiers), puis reconnectez.",
  },
  non_connecte: {
    titre: "Aucune autorisation Google n'est enregistrée.",
    quoiFaire: "Cliquez sur le bouton de connexion.",
  },
  inconnue: {
    titre: "Google Agenda ne répond pas pour le moment.",
    quoiFaire:
      "Réessayez dans quelques minutes. Si le problème dure, reconnectez Google Agenda.",
  },
};

export function messageDiagnostic(code: string | null | undefined): MessageDiagnostic {
  return MESSAGES[code ?? "inconnue"] ?? MESSAGES.inconnue;
}
