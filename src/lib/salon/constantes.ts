/**
 * **Tous les textes du salon**, et rien d'autre.
 *
 * ⚠️ **Un salon n'est pas un corbeau.** Le vocabulaire doit garder les deux
 * séparés : on **envoie un corbeau** à quelqu'un, on **parle** au salon. Et
 * l'écran doit dire que la pièce est publique — quelqu'un qui croirait
 * chuchoter se tromperait lourdement.
 */
export const TEXTES_SALON = {
  nom: "Le salon",
  /** Le lien depuis la page de maison. Il dit ce qu'on y trouve, pas où ça mène. */
  lien: "Entrer au salon",
  lienAide: "La salle commune, en direct. Hors jeu de rôle.",
  titre: "Le salon de {maison}",
  retour: "Retour à ma maison",

  /**
   * Dit trois choses en une phrase, et les trois comptent : c'est la maison
   * qui est là, c'est écrit et gardé, et le château peut y entrer.
   */
  chapeau:
    "La salle commune de votre maison. Tout le monde ici vous lit, le château compris — et ce qui s’y dit reste écrit.",

  vide: "Personne n’a encore parlé. À vous de commencer.",
  ariaFil: "Les messages du salon",
  /** Le message est vivant : un lecteur d'écran doit apprendre les nouveaux. */
  ariaNouveaux: "Nouveaux messages",

  auteurParti: "Un membre qui n’est plus là",
  /** Un message retiré laisse sa place, comme un post retiré dans une scène. */
  retire: "Message retiré",

  champ: {
    libelle: "Votre message",
    aide: "{max} signes au plus. Entrée envoie, Maj+Entrée va à la ligne.",
    envoyer: "Envoyer",
    restant: "Il reste {n} signes",
    restantUn: "Il reste 1 signe",
  },

  retirer: {
    libelle: "Retirer",
    aria: "Retirer le message de {qui}",
    aide: "Le message sort de la pièce. Il reste en base.",
  },

  erreurs: {
    vide: "Un message vide ne dit rien.",
    tropLong: "Un message ne peut pas dépasser {max} signes.",
    pasLeDroit: "Ce salon ne vous est pas ouvert.",
    introuvable: "Ce message n’est plus dans la pièce.",
    /**
     * ⚠️ **Ce n'est pas un refus.** « Pas si vite » et « vous n'avez pas le
     * droit » ne se lisent pas de la même façon, et la route répond 429.
     */
    tropVite: "Doucement — encore {n} secondes.",
    tropViteUne: "Doucement — encore une seconde.",
    reseau: "Le message n’est pas parti. Réessayez.",
  },

  administration: {
    eyebrow: "Ravenshallow",
    /**
     * Ce qui signe un retrait fait depuis l'administration. La zone n'a pas de
     * comptes distincts : le site n'a personne d'autre à nommer. Même
     * convention que `roleAffichePosePar` et que le tableau d'affichage.
     */
    posePar: "Administration",
    titre: "Les salons des maisons",
    /**
     * Dit pourquoi cet écran existe, et il faut qu'il le dise : c'est le seul
     * endroit du site où le staff lit une conversation, et la distinction
     * avec les corbeaux ne va pas de soi.
     */
    chapeau:
      "Les quatre salles communes, en lecture. Un salon est une pièce, pas une correspondance : on y entre comme on traverse une salle commune. Les corbeaux entre joueurs, eux, ne se lisent pas — et aucun écran ne le permet.",
    aucun: "Personne n’a encore parlé dans cette maison.",
    voirTout: "Voir la pièce",

    carteEyebrow: "Les maisons",
    carteTitre: "Les salons",
    carteAccroche:
      "Les quatre salles communes, en lecture. Un salon est une pièce, pas une correspondance : les corbeaux entre joueurs, eux, restent fermés.",
    carteLien: "Entrer dans les salons",
  },
} as const;
