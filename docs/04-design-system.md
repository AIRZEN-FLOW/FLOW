# 04 — Design system AIR ZEN Flow

## 1. Charte graphique (reprise stricte de la marque AIR ZEN)

### Couleurs
| Nom | Code hex | Usage prévu |
|---|---|---|
| Gris-bleu foncé | `#596D85` | Couleur principale — textes importants, boutons primaires, icône/thème PWA |
| Jaune | `#EDC426` | Accent — call-to-action, mise en valeur (ex : badge "à faire maintenant") |
| Bleu-vert | `#76939D` | Secondaire — éléments d'interface, bordures, états actifs |
| Gris clair | `#B3BEC4` | Neutre — fonds de carte, séparateurs, textes secondaires |
| Blanc | `#FFFFFF` | Fond principal |
| Fond doux | `#F5F7F8` | Fond d'écran général, pour éviter le blanc pur trop clinique |

### Couleurs des quadrants Eisenhower
*(validées par Rosenn — exclusivement des couleurs déjà présentes dans la charte, aucune couleur inventée)*

| Quadrant | Couleur | Logique |
|---|---|---|
| Q1 — Faire maintenant | `#C97064` (terracotta/corail) | Attire l'attention sans être un rouge alarmant |
| Q2 — Planifier | `#EDC426` (jaune, accent de la charte) | Valorisé visuellement, car c'est le quadrant le plus important pédagogiquement (important, pas urgent) |
| Q3 — Déléguer/minimiser | `#76939D` (bleu-vert, secondaire de la charte) | Présent mais discret (urgent, pas important) |
| Q4 — Éliminer/différer | `#B3BEC4` (gris clair, neutre de la charte) | Quasi invisible, volontairement en retrait |

### Typographie
- **Police unique** : Montserrat (toutes graisses : 300 à 800 selon besoin), cohérente avec tous les supports AIR ZEN existants.
- Hiérarchie suggérée :
  - Titres d'écran : Montserrat 600-700, 24-28px
  - Titres de tâche : Montserrat 500, 16-18px
  - Texte courant : Montserrat 400, 14-16px
  - Labels/métadonnées (durée, tags) : Montserrat 400, 12-13px, couleur gris clair

## 2. Principes d'interface "zen" (traduction concrète de l'ambiance apaisée)

1. **Espacement généreux.** Marges et paddings larges plutôt que des éléments collés. Mieux vaut afficher 3 tâches bien aérées que 8 tâches compactées.
2. **Une seule action mise en avant par écran.** Un bouton primaire (jaune `#EDC426`) maximum visible à la fois ; les actions secondaires restent discrètes (texte ou icône, pas de bouton plein).
3. **Pas de rouge alarmant, pas de compteurs anxiogènes.** Pas de badge rouge "12 tâches en retard" qui culpabilise. Privilégier des formulations neutres ou encourageantes ("3 tâches vous attendent" plutôt que "12 EN RETARD").
4. **Animations douces et lentes.** Transitions fluides (200-300ms), pas d'effets brusques ou de rebonds excessifs.
5. **Hiérarchie visuelle claire mais discrète.** Utiliser la taille et l'espacement pour hiérarchiser plutôt que la couleur vive ou le gras systématique.
6. **Pas de notifications push agressives en v1.** Si des rappels existent, ils doivent être doux dans le ton ("Un petit créneau se libère, envie d'avancer sur quelque chose ?" plutôt que "TÂCHE EN RETARD !!").

## 3. Composants clés à designer

- **Carte de tâche** (la brique de base, visible partout) : titre, badge quadrant (couleur), durée, icône énergie requise, échéance si proche.
- **Bandeau "énergie du moment"** en haut de l'écran principal : affiche le niveau déduit, avec possibilité d'ajustement manuel en un tap.
- **Fil de suggestions** : 3 à 5 cartes de tâches maximum, avec une micro-explication du "pourquoi maintenant" sous chaque carte.
- **Vue "journée proposée"** (planification automatique) : représentation simple en ligne de temps verticale, avec les créneaux Google Agenda existants en gris et les tâches proposées en couleur.
- **Formulaire de création de tâche** : pensé pour être rapide (titre + durée + importance en 3 champs visibles d'emblée), avec les champs avancés (description, tags, récurrence, projet) repliés sous un "plus d'options" pour ne pas intimider.
- **Modale de proposition de découpage** : affichage des sous-tâches proposées par l'IA avec cases à cocher pour accepter/modifier/refuser chacune.

## 4. Logo et identité

Réutiliser le principe du logo AIR ZEN existant (cercle gris-bleu avec touche jaune, voir le site air-zen.bzh) en l'adaptant pour l'icône PWA — à décliner en icône carrée simplifiée (favicon, icône d'app) qui reste lisible en petit format (48×48px minimum).
