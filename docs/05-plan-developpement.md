# 05 — Plan de développement

> Ce document découpe le projet en étapes réalisables une par une avec Claude Code. Chaque étape doit produire quelque chose de visible/testable avant de passer à la suite — c'est le principe le plus important pour un premier projet de code : ne jamais avancer "à l'aveugle" sur plusieurs étapes sans vérifier que ça marche.

## Étape 0 — Mise en place de l'environnement (avant tout code)

- [ ] Créer un compte GitHub (gratuit) — c'est là que le code sera stocké et versionné
- [ ] Créer le dépôt GitHub vide pour le projet `air-zen-flow`
- [ ] Créer un compte Firebase (gratuit) — créer un nouveau projet, activer Firestore et Firebase Authentication, noter la config (clés)
- [ ] Créer un compte Render (gratuit, connecté directement avec GitHub)
- [ ] Vérifier l'accès au panneau de gestion DNS d'o2switch (pour pointer `air-zen.bzh` vers Render à l'Étape 1)

> Pas de Node.js à installer : le code n'est pas exécuté en local. Claude Code peut guider chacune de ces étapes en détail au moment de démarrer — ce plan ne fait que lister l'ordre, pas le détail des clics.

## Étape 1 — Squelette du projet

**Objectif : avoir un projet Next.js qui démarre, connecté à Firebase, déployé sur Render.**

- Initialiser le projet Next.js (App Router, TypeScript, Tailwind)
- Connecter Firebase (variables d'environnement, SDK Firebase client + SDK Admin côté serveur)
- Page d'accueil minimale affichant juste "AIR ZEN Flow" avec les couleurs de la charte, pour valider que tout est branché
- Premier déploiement sur Render
- Configuration du DNS o2switch pour faire pointer `air-zen.bzh` vers l'app Render

**Critère de réussite** : on peut ouvrir l'URL publique Render (et à terme `air-zen.bzh`) et voir la page, sur ordinateur et sur téléphone.

## Étape 2 — Authentification

**Objectif : pouvoir créer un compte et se connecter.**

- Mise en place de Firebase Authentication (email/mot de passe)
- Ajout de la connexion Google (OAuth)
- Écran de connexion / inscription, aux couleurs AIR ZEN
- Redirection vers l'écran principal une fois connectée

**Critère de réussite** : Rosenn peut créer son compte, se déconnecter, se reconnecter.

## Étape 3 — Le noyau : créer et lister des tâches

**Objectif : le strict minimum fonctionnel — créer une tâche, la voir dans une liste, la marquer terminée.**

- Création de la collection `taches` dans Firestore + des règles de sécurité associées (version simplifiée d'abord : titre, statut, échéance, importance, durée, énergie requise — sans projets/sous-tâches/récurrence pour cette étape)
- Formulaire de création de tâche
- Liste de toutes les tâches (vue simple, pas encore de suggestions intelligentes)
- Calcul automatique et affichage du quadrant Eisenhower
- Marquer une tâche comme terminée

**Critère de réussite** : Rosenn peut créer 5 tâches avec des échéances et importances différentes, et voir leur quadrant calculé correctement.

## Étape 4 — Le matching énergie/durée (MVP fonctionnel)

**Objectif : la fonctionnalité qui donne tout son sens au produit — sans Google Agenda encore, comme décidé.**

- Mise en place des profils d'énergie (créneaux de la journée, avec valeurs par défaut modifiables)
- Déduction automatique du niveau d'énergie du moment
- Algorithme de suggestion (sans la dimension calendrier pour l'instant — on simule la "disponibilité" en demandant juste combien de temps elle a devant elle maintenant, via un input simple "j'ai combien de temps : 15min / 30min / 1h / plus")
- Écran principal avec le fil de suggestions (3-5 tâches), tel que décrit dans les specs fonctionnelles

**Critère de réussite** : Rosenn utilise l'app sur 3-4 jours réels pour ses propres tâches et les suggestions lui semblent pertinentes par rapport à son énergie et son temps déclaré.

> **C'est la fin du MVP au sens strict.** Tout ce qui suit peut être prioritisé/reséquencé selon le retour d'usage réel à cette étape.

## Étape 5 — Projets et sous-tâches

- Collection Firestore et interface pour les projets
- Rattachement de tâches à un projet
- Sous-tâches manuelles (sans l'IA pour l'instant — juste la possibilité de rattacher une tâche à une tâche parente)
- Filtre "voir par projet"

## Étape 6 — Découpage automatique par IA

- Intégration API Anthropic pour proposer un découpage quand une tâche dépasse 90 minutes
- Interface de validation/modification du découpage proposé

## Étape 7 — Récurrence

- Règles de récurrence (quotidienne/hebdomadaire/mensuelle)
- Génération automatique des occurrences suivantes

## Étape 8 — Intégration Google Agenda (lecture seule)

**C'est une étape technique plus complexe (OAuth, scopes, gestion des tokens) — à aborder seule, pas en même temps qu'une autre fonctionnalité.**

- Connexion OAuth Google Calendar (scope lecture uniquement)
- Récupération des créneaux occupés
- Remplacement de la saisie manuelle de "temps disponible" (étape 4) par la détection réelle des créneaux libres
- Vue "journée proposée" avec planification automatique indicative

## Étape 9 — PWA complète

- `manifest.json`, icônes, service worker
- Tests d'installation sur téléphone (Android puis iOS)

## Étapes ultérieures (non détaillées, à reprendre plus tard)

- Pièces jointes
- Mode sombre
- Écriture sur Google Agenda (une fois la confiance établie avec les suggestions)
- Intégrations Notion / Gmail / Trello-Asana
- Logique d'abonnement payant si ouverture à des clientes
- Découpage automatique des tâches par IA (code déjà prêt depuis l'Étape 6, route
  `/api/decoupage`) : activation reportée à plus tard, quand une clé Anthropic payante
  sera en place — une cliente a manifesté de l'intérêt, à envisager comme fonctionnalité
  réservée à une version payante

## Conseil de méthode pour Rosenn

Pour un premier projet de code, la tentation est de vouloir avancer vite sur plusieurs étapes en même temps. Mieux vaut :
1. Terminer une étape, **vraiment** la tester en conditions réelles avant de passer à la suivante
2. Demander à Claude Code d'expliquer ce qu'il vient de faire si quelque chose n'est pas clair, plutôt que de continuer sans comprendre
3. Faire des `commits` Git réguliers (Claude Code peut s'en occuper) à chaque petite victoire, pour pouvoir toujours revenir en arrière si quelque chose casse
