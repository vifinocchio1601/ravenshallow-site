/**
 * **Tous les textes du Registre**, et rien d'autre.
 *
 * ⚠️ **Deux registres coexistent sur ce site, et il ne faut pas les
 * confondre :** celui-ci, l'annuaire des membres — décision du joueur du
 * 28 août 2026 pour le nom —, et **le registre des visages** de l'article 6.3,
 * qui recense les acteurs déjà pris et vit dans le formulaire d'inscription.
 * Aucun libellé de l'un ne doit reprendre celui de l'autre : ici on dit « Le
 * Registre », là-bas « le registre des visages », toujours en toutes lettres.
 */
export const TEXTES_REGISTRE = {
  nom: "Le Registre",
  eyebrow: "Ravenshallow",
  titre: "Le Registre",
  chapeau:
    "Qui vit au château. Chaque nom mène à sa fiche — on lit celle d’un autre avant de lui écrire une scène.",

  /** Les trois façons de titrer un groupe. */
  groupes: {
    chateau: "Le château",
    chateauAide: "Ceux que le Miroir ne concerne pas.",
    attente: "En attente du Miroir",
    attenteAide: "Acceptés, pas encore répartis.",
  },

  vide: "Le Registre est vide. Personne n’a encore été accepté.",
  maisonVide: "Personne, pour l’instant.",
  ariaListe: "Les membres de {groupe}",
  /** Le portrait est un visage d’emprunt (art. 6.2) : jamais un `alt` bavard. */
  altPortrait: "",
  /** Ce qu’on lit sous un nom quand il n’y a pas de portrait. */
  sansPortrait: "Pas de portrait",

  fiche: {
    retour: "Retour au Registre",
    /** Les intitulés de la fiche publique, dans l’ordre où on les lit. */
    age: "Âge",
    ans: "{n} ans",
    genre: "Genre",
    famille: "Origine",
    maison: "Maison",
    baguette: "Baguette",
    points: "Points",
    visage: "Visage",
    biographie: "Biographie",
    qualites: "Trois qualités",
    defauts: "Trois défauts",
    peur: "Sa plus grande peur",
    /**
     * Art. 15.4 — affichés publiquement, et le règlement le dit. Ils
     * préviennent ; ils n'accusent pas. Le ton doit rester neutre.
     */
    avertissements: "Thèmes que ce joueur préfère éviter",
    aucunAvertissement: "Aucun thème signalé.",
    /** Quand le Miroir ne l’a pas encore lu, ou ne le concerne pas. */
    sansMaison: "Répartition à venir",
    sansMaisonSansObjet: "Aucune — et ce n’est pas un oubli",
    sansBaguette: "Pas encore choisie",
  },

  actions: {
    corbeau: "Lui envoyer un corbeau",
    bloquer: "Bloquer",
    debloquer: "Débloquer",
    /**
     * Ce que bloquer fait vraiment, dit **au moment du geste** — et ce qu'il
     * ne fait pas. Le vocabulaire est celui de la Tour, mot pour mot.
     */
    bloquerAide:
      "Cette personne ne pourra plus vous écrire, et ne le saura pas. Vous ne verrez plus ses corbeaux.",
    debloquerAide:
      "Elle pourra de nouveau vous écrire. Ce qui est parti dans le vide ne reviendra pas.",
    /** Le nom accessible est entier : « Bloquer » seul ne dit pas qui. */
    bloquerAria: "Bloquer {nom}",
    debloquerAria: "Débloquer {nom}",
    dejaBloque: "Vous avez bloqué cette personne.",
    /** Sur sa propre fiche : rien à faire, et il faut le dire. */
    cestVous: "C’est votre fiche. Elle se modifie depuis « Ma fiche ».",
  },
} as const;
