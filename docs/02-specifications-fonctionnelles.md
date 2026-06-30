# 02 — Spécifications fonctionnelles

## 1. La tâche : structure complète

Chaque tâche possède les champs suivants.

### Champs de base
| Champ | Type | Obligatoire | Détail |
|---|---|---|---|
| `titre` | texte court | Oui | Ex : "Préparer le devis client X" |
| `description` | texte long | Non | Détails, notes |
| `statut` | enum | Oui | `a_faire`, `en_cours`, `terminee`, `annulee` |
| `date_echeance` | date (+heure optionnelle) | Non | Quand la tâche doit être finie. Si absente, la tâche est considérée "sans échéance" (voir règle Eisenhower ci-dessous) |
| `niveau_importance` | enum | Oui | `haute`, `moyenne`, `basse` — défini manuellement par l'utilisatrice à la création |
| `duree_estimee_minutes` | nombre | Oui | Durée estimée en minutes |
| `niveau_energie_requis` | enum | Oui | `haute`, `moyenne`, `basse` — l'énergie que la tâche demande |
| `tags` | liste de texte | Non | Catégorisation libre (ex : "client", "admin", "contenu") |
| `projet_id` | référence | Non | Rattachement à un projet (voir section 4) |
| `tache_parente_id` | référence | Non | Si c'est une sous-tâche, référence à la tâche mère |
| `recurrence` | objet | Non | Règle de répétition (voir section 3) |
| `source` | enum | Oui (valeur par défaut) | `manuelle`, `decoupage_auto`, futur : `notion`, `gmail`, `trello` — anticipe les intégrations futures sans les coder |
| `pieces_jointes` | liste de fichiers | Non | Prévu dans le modèle de données ; non implémenté en MVP (voir `05-plan-developpement.md`) |
| `cree_le` / `modifie_le` | horodatage | Auto | Traçabilité standard |

### Champ calculé : quadrant Eisenhower

Le quadrant n'est **jamais saisi manuellement**. Il est recalculé automatiquement chaque fois que `date_echeance` ou `niveau_importance` change, selon la règle suivante :

- **Urgent** = la `date_echeance` est dans les **3 jours ou moins** (valeur ajustable dans les paramètres utilisateur, 3 jours par défaut). Une tâche sans échéance n'est jamais "urgente".
- **Important** = `niveau_importance` vaut `haute`.

| Urgent | Important | Quadrant |
|---|---|---|
| Oui | Oui | **Q1 — Faire maintenant** (urgent et important) |
| Non | Oui | **Q2 — Planifier** (important, pas urgent — le cœur du travail de fond) |
| Oui | Non | **Q3 — Déléguer ou minimiser** (urgent, pas important) |
| Non | Non | **Q4 — Éliminer ou différer** (ni urgent ni important) |

> Note pédagogique pour l'interface : Q2 doit être visuellement valorisé (et non relégué), conformément à la philosophie AIR ZEN selon laquelle le travail de fond important-non-urgent est celui qui est le plus souvent sacrifié.

## 2. Le niveau d'énergie : moments de la journée

Plutôt qu'une jauge abstraite, l'énergie est modélisée par des **créneaux-types de la journée**, paramétrables par l'utilisatrice à l'onboarding (avec des valeurs par défaut modifiables) :

| Créneau par défaut | Plage horaire par défaut | Niveau d'énergie par défaut |
|---|---|---|
| Matin productif | 8h–11h | Haute |
| Milieu de matinée | 11h–12h30 | Moyenne |
| Creux d'après-midi | 13h30–15h | Basse |
| Reprise d'après-midi | 15h–17h | Moyenne |
| Fin de journée | 17h–19h | Basse |

- Ces créneaux sont stockés par utilisatrice (table `profils_energie`, voir specs techniques) car le rythme de chacune diffère.
- Chaque jour, l'app **déduit automatiquement** le niveau d'énergie du moment présent à partir de l'heure actuelle et de ce profil. Pas de check-in quotidien obligatoire à saisir (réduction de charge mentale), mais une option pour ajuster manuellement le niveau du jour si l'utilisatrice se sent exceptionnellement fatiguée ou en forme ("Aujourd'hui je me sens à... Haute / Moyenne / Basse" — un seul tap, optionnel, en haut de l'écran principal).

## 3. Récurrence

Une tâche récurrente génère automatiquement de nouvelles occurrences selon une règle simple :

| Champ | Détail |
|---|---|
| `frequence` | `quotidienne`, `hebdomadaire`, `mensuelle` |
| `jours_concernes` | pour hebdomadaire : ex. `[lundi]` |
| `date_fin` | optionnelle, sinon récurrence infinie |

Quand une occurrence est marquée "terminée", la suivante est automatiquement créée selon la règle. Modifier une règle de récurrence ne touche pas aux occurrences déjà créées dans le passé (comportement standard, comme Google Agenda).

## 4. Projets

Un **projet** regroupe plusieurs tâches autour d'un objectif commun.

| Champ | Détail |
|---|---|
| `nom` | Ex : "Lancement formation Excel Q3" |
| `description` | Optionnelle |
| `couleur` | Pour repérage visuel rapide dans les listes |
| `statut` | `actif`, `en_pause`, `termine`, `archive` |

- Une tâche peut appartenir à zéro ou un projet (pas de multi-projet en v1, pour rester simple).
- Le projet n'a pas de quadrant Eisenhower propre — c'est chaque tâche qui en a un. Le projet sert uniquement de regroupement visuel et de filtre.

## 5. Sous-tâches et découpage automatique

- Une tâche peut avoir des sous-tâches (`tache_parente_id`), elles-mêmes structurées comme des tâches complètes (donc avec leur propre durée, énergie requise, etc.).
- **Règle de déclenchement du découpage automatique** : si `duree_estimee_minutes` dépasse un seuil paramétrable (**90 minutes par défaut**), l'app propose systématiquement un découpage avant validation de la création de la tâche.
- **Mécanisme proposé** : un appel à l'API Claude (Anthropic) avec le titre + description de la tâche comme contexte, demandant une proposition de découpage en 2 à 5 sous-tâches avec une durée estimée chacune. L'utilisatrice peut accepter le découpage proposé tel quel, le modifier, ou le refuser et garder la tâche entière.
- La somme des durées des sous-tâches n'a pas besoin d'égaler exactement la durée de la tâche mère (la proposition de l'IA est une aide, pas une contrainte rigide).

## 6. Le matching : suggestions de tâches

C'est la fonctionnalité centrale. Sur l'écran principal, l'app affiche une liste de tâches suggérées "maintenant", calculée ainsi :

### Étape 1 — Filtrer les candidates
Exclure les tâches `terminee` ou `annulee`, et les sous-tâches dont la tâche mère n'est pas encore "active" (si applicable).

### Étape 2 — Vérifier la compatibilité de durée
Ne garder que les tâches dont `duree_estimee_minutes` est compatible avec le temps disponible avant le prochain engagement au calendrier (voir section 7 — disponibilité).

### Étape 3 — Vérifier la compatibilité d'énergie
Comparer `niveau_energie_requis` de la tâche avec le niveau d'énergie du moment présent (déduit du profil énergie, section 2). Règle de matching :
- Énergie du moment **haute** → toutes les tâches sont proposées (haute, moyenne, basse énergie requise)
- Énergie du moment **moyenne** → tâches `moyenne` et `basse` proposées en priorité ; les tâches `haute` énergie requise sont affichées mais en second plan ("à éviter si possible maintenant")
- Énergie du moment **basse** → tâches `basse` énergie requise mises en avant ; possibilité d'afficher malgré tout les tâches `haute` marquées comme urgentes (Q1) avec un avertissement, car l'urgence peut parfois primer sur le confort

### Étape 4 — Trier par quadrant Eisenhower
Ordre de priorité d'affichage : **Q1 d'abord**, puis **Q2**, puis **Q3**, puis **Q4** — sauf si l'énergie du moment est basse, où l'app peut remonter une tâche Q2 à faible énergie plutôt qu'une tâche Q1 à haute énergie incompatible (la pertinence du moment prime sur la priorité brute).

### Résultat affiché
Une liste courte (3 à 5 suggestions maximum à la fois, pour éviter la surcharge), chacune affichant : titre, durée estimée, quadrant (avec code couleur), pourquoi elle est suggérée maintenant (ex : "30 min, énergie compatible, échéance demain").

## 7. Disponibilité (lecture du calendrier)

- En v1, intégration **Google Agenda en lecture seule**.
- L'app récupère les créneaux déjà occupés sur la journée en cours (et les jours suivants si besoin de planification à plus long terme) et en déduit les **créneaux libres**.
- Pour chaque créneau libre détecté, l'app peut évaluer quelles tâches y tiendraient (en croisant durée disponible et durée estimée de la tâche).
- L'utilisatrice peut aussi déclarer manuellement des plages d'indisponibilité que Google Agenda ne capture pas (ex : "focus, ne pas déranger 14h-16h" sans que ce soit un événement calendaire).
- **Aucune création, modification ou suppression d'événement Google Agenda en v1.** Cette restriction doit être respectée strictement par l'implémentation (voir `03-specifications-techniques.md`).

## 8. Planification automatique (mode optionnel)

En complément du fil de suggestions "maintenant", l'utilisatrice peut demander une **planification automatique de sa journée/semaine** :
- L'app propose un déroulé de tâches placées dans les créneaux libres détectés, en respectant la logique de matching (énergie, durée, Eisenhower).
- Ce planning proposé est strictement indicatif en v1 (pas d'écriture dans Google Agenda) : il s'affiche dans l'app elle-même comme une vue "journée type proposée", modifiable par glisser-déposer ou simple changement manuel de créneau.

## 9. Authentification

- Email + mot de passe, et connexion via Google (cohérent avec l'usage de Google Agenda — un seul compte Google peut servir aux deux).
- Architecture multi-comptes dès la conception (table `utilisateurs` indépendante, pas de logique mono-utilisateur codée en dur), pour permettre la vente d'accès à des clientes plus tard sans refonte.

## 10. Hors-périmètre v1 (mais prévu dans le modèle de données)

- Écriture sur Google Agenda
- Intégrations Notion / Gmail / Trello-Asana
- Partage de tâches/projets entre utilisatrices
- Pièces jointes
- Mode sombre
- Abonnement payant fonctionnel (le modèle de données prévoit un champ `plan` sur l'utilisatrice, mais aucune logique de paiement n'est implémentée en v1)
