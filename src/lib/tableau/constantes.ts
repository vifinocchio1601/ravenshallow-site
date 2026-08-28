/**
 * **Tous les textes du tableau d'affichage**, et rien d'autre.
 *
 * ⚠️ **Ne pas confondre avec le Grand Hall.** Une annonce y est officielle,
 * vaut pour tout le site et peut faire courir sept jours ; un mot de tableau
 * n'engage rien, ne vaut que pour une maison, et il est signé. Le vocabulaire
 * doit garder les deux séparés : on **affiche** une annonce au Grand Hall, on
 * **épingle** un mot au tableau.
 */
export const TEXTES_TABLEAU = {
  titre: "Le tableau d’affichage",
  /** Ce que le mur est, pour qui ne peut pas y écrire. */
  chapeau:
    "Ce que les préfets et le château laissent à leur maison. Pour y répondre, un corbeau à qui l’a écrit.",
  /** L'image est du décor : tout ce qui compte est du vrai texte par-dessus. */
  altDecor: "",
  ariaMur: "Les mots épinglés au tableau",
  vide: "Le tableau est nu. Personne n’y a encore épinglé un mot.",

  /** Un mot dont l'auteur n'est plus là. Le mot reste, la signature part. */
  auteurParti: "Un membre qui n’est plus là",

  ecrire: {
    libelle: "Épingler un mot",
    aide: "{max} signes au plus. Tout le monde dans la maison le lira.",
    envoyer: "Épingler",
    /** Ce que voit quelqu'un qui n'a pas le droit d'écrire : rien du tout. */
    restant: "Il reste {n} signes",
    restantUn: "Il reste 1 signe",
  },

  retirer: {
    libelle: "Retirer",
    /** Le nom accessible est entier : dans une liste, « Retirer » ne dit pas quoi. */
    aria: "Retirer le mot épinglé par {qui}",
    /** Dit ce que le geste fait vraiment — rien ne s'efface sur ce site. */
    aide: "Le mot sort du tableau. Il reste en base.",
  },

  top: {
    titre: "Le top du mois",
    /** Dit ce que le classement compte — et surtout ce qu'il ne compte pas. */
    aide: "Ce que chacun a rapporté à la maison depuis le 1er du mois. Les points personnels, eux, ne se remettent jamais à zéro.",
    ariaListe: "Les cinq qui ont le plus rapporté ce mois-ci",
    /** Une maison sans effectif : quatre tubes vides et personne à classer. */
    personne: "Personne n’est encore de cette maison.",
    rang: "{n}ᵉ",
    premier: "1ᵉʳ",
  },

  erreurs: {
    vide: "Un mot vide ne dit rien.",
    tropLong: "Un mot ne peut pas dépasser {max} signes.",
    pasLeDroit: "Ce tableau ne vous est pas ouvert à l’écriture.",
    introuvable: "Ce mot n’est plus au tableau.",
  },
} as const;
