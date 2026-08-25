/**
 * Tous les textes de la Cérémonie du Miroir.
 *
 * Rien en dur dans un composant, et **rien de secret ici** : ce fichier est
 * lisible par le navigateur. Le barème, lui, vit dans `questionnaire.ts`, qui
 * ne sort jamais du serveur.
 *
 * Apostrophes typographiques (’) partout.
 */

import type { Maison } from "@/lib/dossier/etats";

/** Un paragraphe du récit : narration, ou parole de la directrice. */
export type Paragraphe = { ton: "recit" | "parole"; texte: string };

const n = (texte: string): Paragraphe => ({ ton: "recit", texte });
const d = (texte: string): Paragraphe => ({ ton: "parole", texte });

export const TEXTES_CEREMONIE = {
  titrePage: "La Cérémonie du Miroir — Ravenshallow",

  hero: {
    eyebrow: "Ravenshallow — Nuit de la répartition",
    /** Coupé en deux lignes à l’affichage, comme un frontispice. */
    titre: ["La Cérémonie", "du Miroir"],
    accroche:
      "Le Miroir de Brume ne choisit pas. Il lit. On ne revient pas sur ce qu’il montre.",
  },

  photo: {
    alt: "Un élève en cape sombre, de dos, seul devant un grand miroir au cadre doré. Le tain ne renvoie aucun reflet : seulement une masse pâle en mouvement, comme un ciel vu du fond de l’eau.",
    legende: "Le Miroir de Brume",
  },

  quiz: {
    /** Le questionnaire est une section à part entière, annoncée comme telle. */
    aria: "Les questions du Miroir",
    /** « Question 2 sur 5 » — les deux nombres sont fournis à l’affichage. */
    etape: "Question {n} sur {total}",
    /**
     * Annoncé aux lecteurs d’écran quand une question se verrouille : sans
     * lui, le choix se ferait dans le silence complet.
     */
    verrouillee: "Réponse enregistrée. Le Miroir poursuit.",
    /** Entre la dernière réponse et la révélation. */
    lecture: "Le Miroir vous lit…",
    /** L’envoi a échoué : le Miroir n’a rien dit, on peut redemander. */
    echec:
      "La brume s’est refermée sans rien montrer. Reprenez : vos réponses sont gardées.",
    reessayer: "Se présenter à nouveau",
  },

  revelation: {
    /** Annoncé par le lecteur d’écran à l’ouverture de la révélation. */
    aria: "Le Miroir a parlé",
    bouton: "Terminer la cérémonie",
    /** `{maison}` remplacé par le nom de la maison. */
    altBlason: "Blason de la maison {maison}",
  },

  /**
   * Le récit, en deux temps : la photographie du Miroir se pose entre les
   * deux, à l’instant où l’élève s’arrête devant lui.
   */
  recitAvantPhoto: [
    n("On vous a rassemblés dans l’antichambre depuis la fin de l’après midi, une trentaine de gamins de treize ans debout contre un mur de pierre humide, sans qu’on vous explique quoi que ce soit. Les valises sont restées en bas. Le sel de la mer traverse les murs du château, et quelque part très loin sous vos pieds, l’eau frappe la falaise à intervalles réguliers, comme une respiration lente."),
    n("Puis les portes de la Salle de Banquet s’ouvrent, et ce n’est pas le bruit qui vous tombe dessus. C’est la lumière."),
    n("Il n’y a pas un cierge dans cette salle. Au dessus de vous, là où devrait se trouver une charpente, il y a un ciel. Un vrai ciel de nuit, noir et criblé d’étoiles, et une pleine lune énorme, basse, dont la clarté descend sur les tables comme si le toit avait été arraché. Vous levez la tête sans pouvoir vous en empêcher. Il ne fait pas froid, pourtant, et aucune goutte ne tombe. Ce n’est pas le ciel du dehors. C’est celui que le château a décidé de vous montrer ce soir."),
    n("La salle est immense, taillée en longueur, entièrement de pierre. De hautes arches nervurées montent de chaque côté et se rejoignent très haut avant de se dissoudre dans le faux ciel, si bien qu’on ne voit jamais où la pierre s’arrête. Entre elles, la lumière de la lune tombe en larges bandes obliques sur les dalles, et tout ce qu’elle touche devient blanc et gris."),
    n("Quatre longues tables courent d’un bout à l’autre, et toute l’école est là, assise, tournée vers vous. Des centaines de visages. Le clair de lune a vidé les couleurs de leurs uniformes, mais on devine encore, par endroits, un reflet d’argent, un éclat de cuivre, une écharpe sarcelle, du violet noyé dans le noir."),
    n("Au bout de la salle, sur une estrade de pierre, la table des professeurs. Ils ne parlent pas. Ils vous regardent entrer."),
    n("Et devant eux, tourné vers la salle, il y a le Miroir."),
    n("Il est plus grand qu’un homme, monté dans un cadre doré travaillé de volutes et de feuillages que le temps a noircis. C’est la seule chose dorée dans cette salle et la lune s’accroche à chacune de ses courbes. On l’a apporté pour ce soir. Deux traces fraîches sur les dalles montrent l’endroit d’où on l’a tiré, et vous comprenez, sans qu’on vous le dise, qu’il repartira dès que ce sera fini, quelque part dans le château où aucun élève ne le verra plus."),
    n("Le tain ne reflète rien. Ni la lune, ni les arches, ni les centaines de visages tournés vers lui. Seulement une masse pâle qui bouge derrière la surface, comme un ciel vu depuis le fond de l’eau."),
    n("Une femme se lève de la table des professeurs, et le silence tombe sur la salle avant même qu’elle ait ouvert la bouche."),
    n("Elle est grande, très grande, et se tient parfaitement droite. Ses cheveux d’un blond presque blanc sont tressés en couronne autour de sa tête, une seule mèche libre tombant sur son épaule. Sa robe est noire, montante, fermée jusqu’au cou par une dentelle rouge sombre et une broche d’argent ouvragée. Sous cette lumière, son visage est de la même couleur que la pierre. Il ne trahit rien. Quand ses yeux passent sur la file des premières années, chacun a l’impression désagréable d’avoir été compté."),
    n("Elle descend de l’estrade et vient se placer à côté du Miroir, sans le regarder."),
    d("« Je suis Elena Tidevann. Je dirige cette école. Vous n’aurez pas souvent l’occasion de me parler, alors écoutez bien ce que je vais vous dire ce soir. »"),
    n("Sa voix est basse et parfaitement posée. Elle ne force pas. La salle entière retient son souffle pour l’entendre."),
    d("« Ce miroir a été fabriqué par les quatre fondateurs de Ravenshallow, il y a de cela très longtemps. Il ne vit pas dans cette salle. On l’en sort une nuit par an, et on le range dès que la dernière d’entre vous a été appelée. Ne cherchez pas où. Vous ne le trouveriez pas, et vous seriez punis d’avoir essayé. »"),
    n("Un frisson parcourt les tables. Chez les plus âgés, personne ne sourit."),
    d("« Vous allez passer devant lui un par un. Il ne vous choisira pas. Il vous lira. Ce n’est pas la même chose, et vous ferez bien de vous en souvenir les jours où votre maison vous pèsera. »"),
    n("Elle marque une pause, et son regard s’arrête sur la table noir et violet un peu plus longtemps que sur les autres."),
    d("« Il ne parle pas. Il ne juge pas. Il ne se trompe pas. Aucun élève, en des siècles, n’a jamais obtenu qu’on revienne sur ce qu’il a montré, et je ne serai pas la première à l’accorder. »"),
    d("« Une dernière chose. Il lira ce que vous êtes, pas ce que vous voudriez qu’on croie. Vous êtes libres d’essayer de lui mentir. Cela s’est déjà vu. Cela n’a jamais fonctionné, et la salle entière l’a vu à chaque fois. »"),
    n("Elle se tourne enfin vers le Miroir, et la brume derrière le tain se met à tourner, lentement, comme si elle avait attendu qu’on la regarde."),
    n("Un registre relié de cuir est ouvert sur un pupitre au pied de l’estrade. La directrice y pose une main, sans le lire, et le premier nom tombe dans le silence."),
    n("Une fille sort de la file. Ses pas résonnent longtemps."),
    n("D’autres noms suivent. Vous les entendez de moins en moins bien, parce que votre cœur cogne trop fort. Chaque fois, la même chose : la marche jusqu’au Miroir, l’attente, la brume qui change, et une table qui applaudit pendant qu’une autre se tait."),
    n("Puis c’est le vôtre."),
    d("« Approchez. Tenez vous sur la marque, et ne touchez pas le verre. »"),
    n("La marque est une entaille creusée dans la dalle devant le cadre, usée jusqu’au poli par des siècles de pieds arrêtés au même endroit. Le chemin jusqu’à elle vous paraît beaucoup plus long qu’il ne l’est. Vous traversez une bande de lune, puis une zone d’ombre, puis une autre bande de lune."),
    n("Vous vous arrêtez. Derrière vous, la salle entière s’est tue."),
  ] as const satisfies readonly Paragraphe[],

  recitApresPhoto: [
    n("Votre reflet apparaît enfin dans le tain. Une seconde à peine. Puis la brume le mange par les bords, et votre visage se défait dans le blanc."),
    n("Le Miroir commence à poser ses questions. Elles n’ont aucun son."),
  ] as const satisfies readonly Paragraphe[],
} as const;

/**
 * Les nappes de brouillard qui flottent derrière les nappes de brume.
 *
 * Positions **fixées** et non tirées au hasard : un tirage côté client ferait
 * diverger le rendu du serveur et de la page hydratée, et React s’en
 * plaindrait à chaque chargement. Le décor n’y perd rien — personne ne
 * remarque qu’une brume est toujours la même, et chacune dérive de son côté.
 */
export type Nuee = {
  taille: number;
  gauche: number;
  haut: number;
  dx: number;
  dy: number;
  echelle: number;
  duree: number;
  retard: number;
};

export const NUEES: readonly Nuee[] = [
  { taille: 68, gauche: -12, haut: 4, dx: 12, dy: -5, echelle: 1.18, duree: 44, retard: -6 },
  { taille: 41, gauche: 22, haut: -8, dx: -9, dy: 6, echelle: 0.94, duree: 33, retard: -19 },
  { taille: 74, gauche: 58, haut: 18, dx: -14, dy: -3, echelle: 1.26, duree: 57, retard: -28 },
  { taille: 36, gauche: 84, haut: -4, dx: 7, dy: 7, echelle: 1.05, duree: 29, retard: -11 },
  { taille: 62, gauche: 6, haut: 52, dx: 13, dy: -6, echelle: 0.91, duree: 49, retard: -24 },
  { taille: 48, gauche: 44, haut: 68, dx: -11, dy: 4, echelle: 1.31, duree: 38, retard: -3 },
  { taille: 71, gauche: 76, haut: 46, dx: 9, dy: 5, echelle: 1.12, duree: 53, retard: -30 },
  { taille: 34, gauche: 32, haut: 88, dx: -6, dy: -7, echelle: 0.98, duree: 27, retard: -15 },
  { taille: 57, gauche: 94, haut: 76, dx: -13, dy: -4, echelle: 1.22, duree: 41, retard: -21 },
];

/**
 * Ce que la révélation affiche, maison par maison.
 *
 * Les teintes sont celles de la maquette et non celles de la palette du site :
 * elles servent à colorer de la **brume**, pas une interface. Plus profondes,
 * elles gardent le texte clair lisible par-dessus, ce que les couleurs vives
 * des cartes de maison ne feraient pas.
 *
 * `teinteBrume` est écrite en composantes séparées par des espaces : c’est ce
 * qu’attend `rgb(var(--brume-teinte) / 0.62)` dans `globals.css`.
 */
export type Revelation = {
  nom: string;
  blason: string;
  /** Réécrit `--brume-teinte` : toute la brume de la page vire à cette couleur. */
  teinteBrume: string;
  /** Les deux couleurs des nuées de la révélation, du cœur vers le bord. */
  halo1: string;
  halo2: string;
  ligne: string;
};

export const REVELATIONS: Record<Maison, Revelation> = {
  KALDRAFN: {
    nom: "Kaldrafn",
    blason: "/ceremonie/blason-kaldrafn.webp",
    teinteBrume: "70 105 165",
    halo1: "rgb(46 78 134 / 0.85)",
    halo2: "rgb(195 208 222 / 0.35)",
    ligne:
      "Le corbeau vous a reconnu. On observe avant de faire confiance, et l’on tient parole une fois qu’elle est donnée.",
  },
  NATTORM: {
    nom: "Nattorm",
    blason: "/ceremonie/blason-nattorm.webp",
    teinteBrume: "118 68 170",
    halo1: "rgb(90 38 138 / 0.85)",
    halo2: "rgb(176 143 216 / 0.35)",
    /**
     * Art. 11.4 — cette ligne est la première chose que lit un élève réparti
     * à Nattorm. Elle parle du silence et de ce qu’on y porte, jamais de
     * malédiction : la réputation de « maison maudite » est un ressort
     * narratif, pas une étiquette qu’on colle à un joueur le soir de son
     * arrivée. Ne pas la réécrire en ce sens.
     */
    ligne:
      "Le serpent noir vous a reconnu. On y garde ce que les autres n’osent pas porter, et l’on apprend tôt ce que vaut le silence.",
  },
  BRYGGELD: {
    nom: "Bryggeld",
    blason: "/ceremonie/blason-bryggeld.webp",
    teinteBrume: "198 104 44",
    halo1: "rgb(194 89 27 / 0.85)",
    halo2: "rgb(232 160 90 / 0.35)",
    ligne:
      "La salamandre vous a reconnu. On y répare, on y recommence, et l’on ne laisse personne au bord du chemin.",
  },
  TIDEAL: {
    nom: "Tideål",
    blason: "/ceremonie/blason-tideal.webp",
    teinteBrume: "52 140 142",
    halo1: "rgb(27 110 112 / 0.85)",
    halo2: "rgb(143 195 196 / 0.35)",
    ligne:
      "L’anguille vous a reconnu. On y dit ce que l’on voit, même quand la salle préfèrerait ne pas l’entendre.",
  },
};
