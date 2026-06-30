# 03 — Spécifications techniques

## 1. Architecture générale

```
┌─────────────────────────────────────────┐
│              Next.js (App Router)         │
│   - Pages/écrans (React Server Components)│
│   - API routes (logique serveur)          │
│   - PWA (manifest.json + service worker)  │
└───────────────┬───────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│                Firebase                   │
│   - Firestore (base de données NoSQL)     │
│   - Firebase Authentication               │
│     (email/mdp + OAuth Google)             │
│   - Règles de sécurité Firestore (chaque  │
│     utilisatrice ne voit que ses propres   │
│     données)                               │
└───────────────┬───────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│         Intégrations externes (lecture)    │
│   - Google Calendar API (lecture seule)    │
│   - API Anthropic (découpage sous-tâches)  │
└─────────────────────────────────────────┘
```

**Déploiement** : Render (connecté directement au dépôt GitHub, déploiement automatique à chaque mise à jour du code). L'app Next.js complète (pages + API) tourne sur Render — pas de séparation frontend/backend.

**Domaine** : `air-zen.bzh` est hébergé chez o2switch ; le DNS du domaine pointe vers l'app Render (enregistrement CNAME ou A selon les instructions Render). o2switch ne sert dans ce projet qu'à la gestion du nom de domaine, pas à l'hébergement du code.

**Environnement de développement** : pas d'installation locale (pas de Node.js sur le PC de Rosenn). Le code est édité dans un environnement cloud (ex. GitHub Codespaces), poussé sur GitHub, puis testé directement via le déploiement automatique sur Render.

## 2. Modèle de données (Firestore)

> Firestore est une base de données **NoSQL orientée documents** : pas de tables ni de jointures SQL, mais des **collections** contenant des **documents** (équivalents d'un enregistrement, au format proche du JSON). Les relations entre documents se font par un champ contenant l'identifiant du document référencé (ex. `projetId`), un peu comme une clé étrangère, mais sans contrainte imposée par la base — c'est l'application qui doit veiller à la cohérence.

Structure retenue : des collections **au niveau racine**, chaque document portant un champ `utilisateurId` pour le rattachement à l'utilisatrice (plutôt que des sous-collections imbriquées sous chaque utilisatrice), pour rester simple à requêter et à faire évoluer.

### Collection `utilisateurs`
*(Firebase Authentication gère déjà l'essentiel — identifiant, email, mot de passe/IdP ; cette collection étend le profil)*

| Champ | Type | Détail |
|---|---|---|
| `id` (= id du document) | string | Identique à l'`uid` Firebase Authentication |
| `email` | string | |
| `nomAffiche` | string | |
| `plan` | string | `gratuit` par défaut — prévu pour évolution future vers un plan payant |
| `seuilUrgenceJours` | number | Défaut 3 — nombre de jours pour qu'une échéance soit "urgente" |
| `seuilDecoupageMinutes` | number | Défaut 90 — durée au-delà de laquelle le découpage est proposé |
| `googleCalendarConnecte` | boolean | Défaut `false` |
| `googleRefreshToken` | string (chiffré) | Stocké uniquement si connexion Google Agenda effectuée — jamais lisible côté client (voir section 3) |
| `creeLe` | timestamp | |

### Collection `profilsEnergie`
| Champ | Type | Détail |
|---|---|---|
| `id` (= id du document) | string | |
| `utilisateurId` | string | Référence au document `utilisateurs` |
| `nomCreneau` | string | Ex : "Matin productif" |
| `heureDebut` | string | Format `"HH:mm"` |
| `heureFin` | string | Format `"HH:mm"` |
| `niveauEnergie` | string | `haute` / `moyenne` / `basse` |
| `joursActifs` | array\<string\> | Ex : `["lundi","mardi","mercredi","jeudi","vendredi"]` — permet des profils différents le week-end si besoin |

### Collection `projets`
| Champ | Type | Détail |
|---|---|---|
| `id` (= id du document) | string | |
| `utilisateurId` | string | |
| `nom` | string | |
| `description` | string | optionnel |
| `couleur` | string | code hex |
| `statut` | string | `actif` / `en_pause` / `termine` / `archive` |
| `creeLe` | timestamp | |

### Collection `taches`
| Champ | Type | Détail |
|---|---|---|
| `id` (= id du document) | string | |
| `utilisateurId` | string | |
| `projetId` | string | optionnel, référence `projets` |
| `tacheParenteId` | string | optionnel, référence un autre document `taches` (pour les sous-tâches) |
| `titre` | string | |
| `description` | string | optionnel |
| `statut` | string | `a_faire` / `en_cours` / `terminee` / `annulee` |
| `dateEcheance` | timestamp | optionnel |
| `niveauImportance` | string | `haute` / `moyenne` / `basse` |
| `dureeEstimeeMinutes` | number | |
| `niveauEnergieRequis` | string | `haute` / `moyenne` / `basse` |
| `quadrantEisenhower` | string | **Calculé**, recalculé côté application à chaque écriture (`q1`/`q2`/`q3`/`q4`) |
| `tags` | array\<string\> | |
| `source` | string | `manuelle` / `decoupage_auto` / réservé futur : `notion`, `gmail`, `trello` |
| `recurrenceRegle` | map (objet) | optionnel, structure `{ frequence, joursConcernes, dateFin }` |
| `creeLe` / `modifieLe` | timestamp | |

> **Choix d'implémentation du quadrant** : recalculer `quadrantEisenhower` côté application (dans la fonction de création/modification de tâche, avant l'écriture en base), et non via un trigger côté base de données. Firestore propose des Cloud Functions déclenchées à l'écriture, mais pour rester simple à déboguer pour une débutante, on garde ce calcul dans le code de l'app Next.js.

### Collection `piecesJointes` (modèle prévu, non implémenté en MVP)
| Champ | Type |
|---|---|
| `id` (= id du document) | string |
| `tacheId` | string |
| `urlStockage` | string |
| `nomFichier` | string |

### Collection `disponibilitesManuelles`
| Champ | Type | Détail |
|---|---|---|
| `id` (= id du document) | string | |
| `utilisateurId` | string | |
| `date` | string | Format `"YYYY-MM-DD"` |
| `heureDebut` / `heureFin` | string | Format `"HH:mm"` |
| `type` | string | `indisponible` (ex: "focus, ne pas déranger") |

## 3. Sécurité des données (règles de sécurité Firestore)

Contrairement à Supabase/PostgreSQL (Row Level Security en SQL), Firestore utilise son propre langage de **règles de sécurité** (`firestore.rules`), appliquées par Firebase à chaque lecture/écriture. Chaque collection contenant un champ `utilisateurId` doit avoir une règle du type :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /taches/{tacheId} {
      allow read, write: if request.auth != null
                          && request.auth.uid == resource.data.utilisateurId;
      allow create: if request.auth != null
                     && request.auth.uid == request.resource.data.utilisateurId;
    }

    // Même principe à répliquer sur : projets, profilsEnergie,
    // disponibilitesManuelles, piecesJointes, et le document
    // utilisateurs correspondant à l'utilisatrice connectée.
  }
}
```

C'est non négociable même pour un usage mono-utilisatrice au départ — ça évite tout problème de sécurité si l'app est ouverte à des clientes plus tard.

**Champs sensibles** : `googleRefreshToken` ne doit jamais être lisible directement par le client, même par l'utilisatrice propriétaire. Concrètement, soit ce champ est stocké dans une collection séparée non accessible en lecture directe au client (lue uniquement par les routes API Next.js via le SDK Admin Firebase, côté serveur), soit la règle de sécurité exclut explicitement ce champ. Cette nuance sera précisée lors de l'implémentation de l'Étape 8 (Google Agenda).

## 4. Intégration Google Calendar (lecture seule)

- **Scope OAuth strictement nécessaire** : `https://www.googleapis.com/auth/calendar.readonly` — ne jamais demander un scope d'écriture en v1, même si Google le propose par défaut dans certains flows.
- **Flux** : connexion Google gérée par Firebase Authentication pour l'identité (connexion/inscription) ; un flow OAuth dédié et séparé sera nécessaire pour obtenir le scope `calendar.readonly`, car Firebase Authentication seul ne suffit généralement pas à obtenir ce type de scope étendu — à valider en pratique au moment du développement de l'Étape 8.
- **Fréquence de synchronisation** : à la demande (quand l'utilisatrice ouvre l'écran principal ou demande une planification), pas de polling permanent en tâche de fond pour limiter la complexité et la consommation de quota API.
- **Règle stricte de non-écriture** : aucune route API du projet ne doit appeler les endpoints d'écriture de l'API Google Calendar (`events.insert`, `events.update`, `events.delete`) en v1. Cette restriction doit figurer en commentaire dans le code d'intégration pour rappel aux futures sessions de développement.

## 5. Intégration API Anthropic (découpage de sous-tâches)

- Appel côté serveur (route API Next.js, exécutée sur Render), jamais côté client (pour ne pas exposer la clé API dans le navigateur).
- Entrée : titre + description de la tâche, durée estimée.
- Sortie attendue (format structuré, JSON) : liste de 2 à 5 sous-tâches, chacune avec un titre et une durée estimée en minutes.
- Le prompt système doit demander explicitement une réponse en JSON strict, sans texte d'accompagnement, pour faciliter le parsing.

## 6. PWA — éléments techniques minimums

- `manifest.json` avec nom (`AIR ZEN Flow`), icônes (plusieurs tailles), couleur de thème (`#596D85`), couleur de fond, `display: standalone`.
- Service worker basique pour le cache des assets statiques (pas besoin de mode hors-ligne complet en v1, le minimum pour l'installabilité).
- Test d'installabilité sur Chrome Android et Safari iOS avant de considérer la PWA "prête".

## 7. Variables d'environnement à prévoir

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=     (côté serveur uniquement, SDK Admin Firebase, jamais exposée au client)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ANTHROPIC_API_KEY=
```

Ces variables seront configurées directement dans le tableau de bord Render (Environment Variables), pas dans un fichier `.env` local puisqu'il n'y a pas d'exécution locale du projet.
