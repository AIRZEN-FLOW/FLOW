@AGENTS.md

# AIR ZEN Flow — Contexte projet

Application web + mobile (PWA) de gestion de tâches personnelles, par Rosenn Lemarchand
(formatrice en efficacité professionnelle, marque AIR ZEN, air-zen.bzh). L'app aide à
décider **quoi faire et quand**, en croisant 4 critères : matrice d'Eisenhower
(urgent/important), disponibilité réelle (calendrier), niveau d'énergie (du moment et de
la tâche), et durée de la tâche.

**Important : Rosenn n'a jamais codé avant ce projet.** En conséquence :
- Privilégier la stack la plus standard et documentée (pas d'optimisation prématurée,
  pas de pattern exotique).
- Expliquer les commandes avant de les lancer, pas seulement les exécuter.
- Avancer par petites étapes vérifiables (un écran qui marche > dix à moitié faits).
- Éviter le jargon sans définition la première fois qu'il apparaît.

## Stack

- **Next.js 16** (React 19), App Router, TypeScript — pages + API dans une seule app
- **Tailwind CSS v4** (config dans `app/globals.css` via `@theme`, pas de `tailwind.config.js`)
- **Firebase** : Firestore (base NoSQL) + Firebase Authentication (email/mdp + Google)
- **Hébergement** : Render (déploiement auto depuis GitHub) ; domaine `air-zen.bzh` (o2switch) → DNS vers Render
- **PWA** : un seul code pour web et mobile, installable sans App Store / Play Store
- Pas d'exécution locale chez Rosenn (pas de Node.js sur son PC) : code édité en cloud, testé sur Render

## Documents de référence (dossier `docs/`)

| Fichier | Contenu |
|---|---|
| `docs/01-vision-produit.md` | Pourquoi cette app, philosophie, utilisatrice cible |
| `docs/02-specifications-fonctionnelles.md` | Toutes les fonctionnalités en détail |
| `docs/03-specifications-techniques.md` | Modèle de données, schéma Firestore, architecture, Google Agenda |
| `docs/04-design-system.md` | Charte graphique AIR ZEN appliquée à l'interface |
| `docs/05-plan-developpement.md` | Découpage en étapes, MVP, roadmap |

## Règles de travail (non négociables)

1. **Toujours suivre le plan `docs/05-plan-developpement.md`, étape par étape.** Ne pas
   implémenter Google Agenda, les pièces jointes ou les intégrations tierces avant que le
   noyau (MVP = Étapes 1 à 4) fonctionne.
2. **Respecter strictement la charte `docs/04-design-system.md`** — ne pas improviser de
   nouvelles couleurs ou polices. Couleurs disponibles en classes Tailwind :
   `airzen-primary` `#596D85`, `airzen-accent` `#EDC426`, `airzen-secondary` `#76939D`,
   `airzen-neutral` `#B3BEC4`, `airzen-bg` `#F5F7F8`, et `q1`/`q2`/`q3`/`q4` pour les quadrants.
3. **Le modèle de données est pensé pour grandir** (multi-comptes, abonnements, sources
   externes). Ne pas simplifier le schéma même si l'interface ne l'exploite pas encore.
4. **Google Agenda reste en LECTURE SEULE jusqu'à nouvel ordre.** Jamais de création /
   modification / suppression d'événement sans confirmation explicite dans une session dédiée.
5. **Expliquer avant d'exécuter** toute commande destructrice ou changement de structure
   de base de données (migrations).

## Sécurité

- Règles Firestore dans `firestore.rules` : chaque utilisatrice ne voit que ses propres
  données (champ `utilisateurId`). Non négociable, même en mono-utilisatrice.
- `googleRefreshToken` et autres secrets : jamais lisibles côté client (SDK Admin serveur uniquement).
- Secrets et clés : uniquement en variables d'environnement Render, jamais dans Git.
  Le SDK Admin (`lib/firebase/admin.ts`) ne s'importe QUE côté serveur.

## Où démarrer une nouvelle session

État actuel : **Étapes 1 à 9 toutes terminées (plan v1 complet).** Prochaines pistes :
tests en conditions réelles (installation PWA sur téléphone, connexion Google Agenda),
puis les « étapes ultérieures » du plan (pièces jointes, mode sombre, intégrations).

Architecture mise en place :
- `lib/types.ts` (modèle), `lib/eisenhower.ts`, `lib/energie.ts`, `lib/matching.ts`,
  `lib/recurrence.ts` (logique pure)
- `lib/firebase/client.ts` (init paresseuse), `lib/firebase/admin.ts` (serveur),
  `lib/data/*` (CRUD Firestore), `lib/google/calendar.ts` (lecture seule, serveur)
- `lib/hooks/*` (useTaches, useProjets, useEnergieMoment, useOccupations)
- `components/AuthProvider.tsx`, `RequireAuth`, `AppShell`, `ModaleDecoupage`
- Écrans : `/login`, `/` (suggestions), `/taches`, `/planning`, `/projets`, `/parametres`
- Routes API : `/api/decoupage` (IA), `/api/google/*` (OAuth + freeBusy), `/api/sante`
- PWA : `app/manifest.ts`, `public/sw.js`, icônes `public/icons/`
