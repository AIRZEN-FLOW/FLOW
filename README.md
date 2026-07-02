# AIR ZEN Flow

Application web + mobile (PWA) de gestion de tâches personnelles, qui aide à décider
**quoi faire et quand** en croisant quatre critères : la matrice d'Eisenhower
(urgent / important), la disponibilité réelle (calendrier), le niveau d'énergie (du moment
et de la tâche) et la durée de la tâche.

> Projet de Rosenn Lemarchand — marque **AIR ZEN** ([air-zen.bzh](https://air-zen.bzh)).

## Stack technique

- **Next.js 16** (React 19), App Router, TypeScript
- **Tailwind CSS v4** (charte AIR ZEN configurée dans `app/globals.css`)
- **Firebase** — Firestore (base de données) + Authentication (comptes)
- **Render** — hébergement avec déploiement automatique depuis GitHub
- **PWA** — installable sur téléphone, un seul code pour web et mobile

## Structure du projet

```
app/                 Pages et écrans (App Router Next.js)
  layout.tsx         Mise en page globale (police Montserrat, métadonnées)
  page.tsx           Page d'accueil
  globals.css        Charte graphique AIR ZEN (couleurs, police)
lib/firebase/
  client.ts          SDK Firebase côté navigateur (clés publiques)
  admin.ts           SDK Admin Firebase côté serveur (secret, jamais exposé au client)
docs/                Documents de référence (vision, specs, design, plan de dev)
firestore.rules      Règles de sécurité de la base de données
render.yaml          Configuration de déploiement Render
.env.example         Modèle des variables d'environnement (sans secrets)
```

## Documentation

Toute la conception du projet est dans le dossier [`docs/`](./docs) :

1. [`01-vision-produit.md`](./docs/01-vision-produit.md) — pourquoi cette app, philosophie
2. [`02-specifications-fonctionnelles.md`](./docs/02-specifications-fonctionnelles.md) — les fonctionnalités
3. [`03-specifications-techniques.md`](./docs/03-specifications-techniques.md) — modèle de données, architecture
4. [`04-design-system.md`](./docs/04-design-system.md) — charte graphique
5. [`05-plan-developpement.md`](./docs/05-plan-developpement.md) — découpage en étapes

## Avancement

- [x] **Étape 1** — Squelette du projet (Next.js + charte AIR ZEN + structure Firebase)
- [x] **Étape 2** — Authentification (email/mot de passe + Google)
- [x] **Étape 3** — Créer et lister des tâches (quadrant Eisenhower)
- [x] **Étape 4** — Matching énergie / durée (fin du MVP)
- [x] **Étape 5** — Projets et sous-tâches
- [ ] Étape 6 — Découpage automatique par IA (API Anthropic)
- [ ] Étape 7 — Récurrence
- [ ] Étape 8 — Google Agenda (lecture seule)
- [ ] Étape 9 — PWA complète

## Éviter la mise en veille (plan gratuit Render)

Sur le plan gratuit, Render **endort** le serveur après ~15 minutes sans visite (d'où un
démarrage lent de 30-60 s à la visite suivante). Deux solutions :

1. **Gratuite** : créer un compte sur [uptimerobot.com](https://uptimerobot.com) (gratuit)
   et ajouter un « monitor » HTTP qui appelle `https://VOTRE-APP.onrender.com/api/sante`
   toutes les 5 minutes. Ce trafic régulier garde le serveur éveillé.
2. **Payante (la plus fiable)** : passer le service Render au plan **Starter** (~7 $/mois),
   qui ne s'endort jamais.

## Configuration (pour déployer)

Les variables d'environnement (clés Firebase, etc.) se renseignent dans le tableau de bord
**Render**, pas dans un fichier local. La liste complète figure dans
[`.env.example`](./.env.example). Aucune clé secrète ne doit être ajoutée dans Git.

## Commandes utiles

```bash
npm install     # installer les dépendances
npm run dev     # lancer en développement (http://localhost:3000)
npm run build   # construire la version de production
npm start       # démarrer la version de production
npm run lint    # vérifier le code
```
