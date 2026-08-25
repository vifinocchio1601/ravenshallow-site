/**
 * Les textes de l’interface de la boutique — et **rien du récit**.
 *
 * Ce fichier-ci part vers le navigateur : il ne porte que ce dont le
 * composant client a besoin pour se dessiner. Le récit, les descriptions et les
 * vingt-cinq réactions vivent dans `constantes.ts`, marqué `server-only`.
 *
 * Apostrophes typographiques (’) partout.
 */

export const TEXTES_BJORNSTAV = {
  titrePage: "Bjornstav — Ravenshallow",

  hero: {
    eyebrow: "Kaldvik — Village-port au pied de la falaise",
    titre: "Bjornstav",
    accroche: "Il y a celle qui te répondra, et il y a les vingt-quatre autres.",
  },

  enseigne: {
    alt: "Enseigne de bois gravée au couteau : BJORNSTAV, les lettres remplies de rouge, le bois noirci par les embruns.",
  },

  photo: {
    alt: "Dans l’échoppe, un élève tient une baguette dont la pointe crache des étincelles rouges, face au vieux fabricant immobile derrière son comptoir.",
    legende: "L’échoppe Bjornstav, Kaldvik",
  },

  /**
   * Chaque étape est un vrai groupe de boutons radio. `legende` est la
   * `<legend>` du `fieldset` : elle nomme le groupe pour un lecteur d’écran
   * autant qu’elle titre l’étape à l’écran.
   *
   * `verrouille` est annoncé dans une zone `aria-live` au moment où l’étape
   * se ferme : sans lui, le choix se ferait dans le silence complet.
   */
  etapes: {
    bois: {
      legende: "Le bois",
      verrouille: "Bois choisi. Le vieil homme va chercher les boîtes.",
    },
    coeur: {
      legende: "Le cœur",
      verrouille: "Cœur choisi. Le vieil homme se met au travail.",
    },
  },

  /** Entre le choix du cœur et la réaction : le temps qu’il taille. */
  attente: "Le vieil homme taille…",

  /**
   * L’envoi a échoué : **rien n’a été inscrit**, le choix est encore en main.
   * On ne renvoie donc pas au début de la scène, on redemande.
   */
  echec:
    "La lampe a vacillé et le registre est resté fermé. Reprenez : votre choix est gardé.",
  reessayer: "Tendre la main à nouveau",

  fin: {
    /** Annoncé par le lecteur d’écran quand la baguette est inscrite. */
    aria: "Votre baguette",
    sansRetour: "Votre baguette. Elle ne se change pas.",
    bouton: "Reprendre le sentier",
  },
} as const;
