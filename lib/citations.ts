// Citation du jour, affichée sur l'écran "Aujourd'hui" (voir docs/04-design-system.md).
// Règle non négociable : uniquement des citations réelles, correctement attribuées,
// vérifiées auprès de sources fiables (livre, discours, interview filmée). Pas de
// citation inventée ni de citation apocryphe (ex. "Si les faits ne correspondent pas
// à la théorie, changez les faits" n'est pas d'Einstein — jamais retrouvée dans ses
// écrits — donc absente d'intention de cette liste).
//
// La liste est volontairement plus courte que 100 : mieux vaut une trentaine de
// citations vérifiées qu'une centaine dont certaines seraient fausses. Elle est
// simple à agrandir : ajouter un objet { texte, auteur } au tableau.
export interface Citation {
  texte: string;
  auteur: string;
}

export const CITATIONS: Citation[] = [
  {
    texte: "On ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux.",
    auteur: "Antoine de Saint-Exupéry",
  },
  { texte: "Ceux qui vivent, ce sont ceux qui luttent.", auteur: "Victor Hugo" },
  { texte: "On ne naît pas femme, on le devient.", auteur: "Simone de Beauvoir" },
  { texte: "Il faut imaginer Sisyphe heureux.", auteur: "Albert Camus" },
  { texte: "L'existence précède l'essence.", auteur: "Jean-Paul Sartre" },
  { texte: "Il faut cultiver notre jardin.", auteur: "Voltaire" },
  {
    texte: "Rien dans la vie n'est à craindre, tout est à comprendre.",
    auteur: "Marie Curie",
  },
  {
    texte: "La vie, c'est comme la bicyclette : il faut avancer pour ne pas perdre l'équilibre.",
    auteur: "Albert Einstein",
  },
  {
    texte: "Dans les champs de l'observation, le hasard ne favorise que les esprits préparés.",
    auteur: "Louis Pasteur",
  },
  {
    texte:
      "J'ai fait un rêve que mes quatre enfants vivront un jour dans une nation où ils ne seront pas jugés sur la couleur de leur peau mais sur la nature de leur caractère.",
    auteur: "Martin Luther King Jr.",
  },
  {
    texte: "Un enfant, un enseignant, un livre, un stylo peuvent changer le monde.",
    auteur: "Malala Yousafzai",
  },
  {
    texte: "Malgré tout, je crois que les gens sont vraiment bons de cœur.",
    auteur: "Anne Frank",
  },
  {
    texte: "Nous sommes venues ici dans notre effort pour devenir faiseuses de lois.",
    auteur: "Emmeline Pankhurst",
  },
  {
    texte: "Votre temps est limité, ne le gâchez pas à vivre la vie de quelqu'un d'autre.",
    auteur: "Steve Jobs",
  },
  { texte: "Restez affamés, restez fous.", auteur: "Steve Jobs" },
  {
    texte: "J'ai échoué encore et encore et encore dans ma vie, et c'est pourquoi je réussis.",
    auteur: "Michael Jordan",
  },
  {
    texte:
      "Je ne suis pas malade, je suis brisée. Mais je suis heureuse tant que je peux peindre.",
    auteur: "Frida Kahlo",
  },
  {
    texte:
      "Les gens oublieront ce que vous avez dit, les gens oublieront ce que vous avez fait, mais les gens n'oublieront jamais ce que vous leur avez fait ressentir.",
    auteur: "Maya Angelou",
  },
  {
    texte: "Une femme doit avoir de l'argent et une chambre à soi si elle veut écrire.",
    auteur: "Virginia Woolf",
  },
  {
    texte: "Nous sommes ceux que nous attendions. Nous sommes le changement que nous cherchons.",
    auteur: "Barack Obama",
  },
  { texte: "Quand ils vont bas, nous allons haut.", auteur: "Michelle Obama" },
  {
    texte: "La France ne peut être la France sans la grandeur.",
    auteur: "Charles de Gaulle",
  },
  { texte: "Aide-toi, le ciel t'aidera.", auteur: "Jean de La Fontaine" },
  { texte: "C'est le devoir d'un artiste de refléter son époque.", auteur: "Nina Simone" },
  {
    texte: "Quand on sait ce qui doit être fait, la peur disparaît.",
    auteur: "Rosa Parks",
  },
  {
    texte: "Il ne sert à rien de s'appesantir sur ses rêves en oubliant de vivre.",
    auteur: "J.K. Rowling (Albus Dumbledore, Harry Potter à l'école des sorciers)",
  },
];

/** Numéro du jour dans l'année (1 à 366), en heure locale. */
function jourDeLAnnee(date: Date): number {
  const debut = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - debut.getTime();
  return Math.floor(diff / 86_400_000) + 1;
}

/**
 * Citation du jour : change chaque jour, revient dans un ordre différent
 * chaque année (décalage par année) pour ne pas donner l'impression d'un
 * calendrier figé, sans dépendre d'un tirage aléatoire à chaque affichage.
 */
export function citationDuJour(date: Date): Citation {
  const decalage = date.getFullYear() * 7;
  const index = (jourDeLAnnee(date) + decalage) % CITATIONS.length;
  return CITATIONS[index];
}
