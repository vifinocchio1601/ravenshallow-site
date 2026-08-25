import "server-only";
import {
  BOIS,
  CODES_BOIS,
  CODES_COEUR,
  COEURS,
  type CodeBois,
  type CodeCoeur,
} from "@/lib/ecole/baguette";

/**
 * Toute la scène de Bjornstav — et elle ne quitte jamais le serveur.
 *
 * `server-only` n’est pas une précaution de principe : **les vingt-cinq
 * réactions ne doivent pas être lisibles dans le code de la page.** Un joueur
 * qui ouvrirait la source avant de choisir y trouverait les vingt-cinq
 * dénouements, et le choix perdrait tout ce qui en fait un choix.
 *
 * La page est un composant serveur : elle lit ce fichier directement et n’en
 * envoie au navigateur que ce qui doit s’afficher à l’instant présent. Les
 * réactions, elles, ne partent qu’une fois la baguette inscrite — et
 * seulement celle de la baguette inscrite.
 *
 * **Aucun bois, aucun cœur n’apporte le moindre avantage.** La magie courante
 * n’a ni coût ni risque dans ce lore : un sort marche ou rate. Si un bois
 * donnait un avantage, tout le monde prendrait le même et le choix mourrait.
 * Aucun texte d’ici ne doit laisser croire le contraire — et aucun ne nomme
 * de maison : la boutique et le Miroir sont indépendants.
 *
 * Le texte est celui de `Bjornstav_scene_baguette.md`, mot pour mot, aux
 * apostrophes typographiques près.
 */

/** Un paragraphe : narration, ou parole du fabricant. */
export type Paragraphe = { ton: "recit" | "parole"; texte: string };

const n = (texte: string): Paragraphe => ({ ton: "recit", texte });
const d = (texte: string): Paragraphe => ({ ton: "parole", texte });

// ─────────────────────────────────────────────────────────────
//  L’arrivée — coupée à l’endroit où l’enseigne se lit
// ─────────────────────────────────────────────────────────────

/**
 * Le récit s’interrompt deux fois, et jamais ailleurs : une première fois
 * pour laisser paraître l’enseigne, à l’instant où le texte la décrit ; une
 * seconde sur « Alors ? Qu’est-ce qui te tire l’œil ? », où les cinq bois
 * s’intercalent.
 */
export const RECIT_AVANT_ENSEIGNE: readonly Paragraphe[] = [
  n("Le bateau vous a laissés sur le ponton de Kaldvik au milieu de l’après midi, et il fait déjà presque nuit. La baie est étroite, encaissée entre deux pans de roche noire, et la falaise monte si haut au dessus du village qu’on ne voit pas le château depuis les quais. On sait seulement qu’il est là. Tout le monde ici marche en le sachant."),
  n("Il pleut cette petite pluie du Nord qui ne tombe pas vraiment, qui flotte et qui mouille quand même. Les maisons de bois sont serrées les unes contre les autres le long d’une rue unique qui remonte vers la falaise. Ça sent le poisson, le goudron et la fumée de tourbe."),
  n("Personne ne vous demande ce que vous faites là. Les gens de Kaldvik voient passer des enfants de treize ans à cette période de l’année depuis des générations, et ils ont cessé de lever la tête."),
  n("L’échoppe est en haut de la rue, la dernière avant que les pavés cèdent la place au sentier. Pas de vitrine. Une porte basse, une enseigne de bois noircie où le nom a été gravé si profond qu’il tient encore malgré des siècles d’embruns."),
];

export const RECIT_APRES_ENSEIGNE: readonly Paragraphe[] = [
  n("Au dessus de la porte, fixé au linteau, un crâne d’animal que la pluie a lavé jusqu’à l’os. Vous mettez un moment à comprendre que c’est un ours. Personne n’a jamais vu d’ours sur cette côte."),
  n("La cloche ne sonne pas quand vous entrez. Elle est là, pourtant, mais quelqu’un a coincé le battant avec un bout de chiffon, il y a longtemps."),
  n("L’intérieur est plus petit que vous ne l’imaginiez, et infiniment plus haut. Les murs disparaissent derrière des étagères qui montent jusqu’à un plafond qu’on ne distingue pas, et chaque étagère est remplie de boîtes. Des milliers de boîtes plates et longues, empilées les unes sur les autres, certaines neuves, la plupart couvertes d’une poussière qui a l’épaisseur du feutre. Sur les tranches, des chiffres et des lettres écrits à la main, dans une écriture qui change d’un rayonnage à l’autre. Plusieurs vies de fabricants, empilées elles aussi."),
  n("Une lampe à huile brûle sur le comptoir. C’est la seule lumière chaude de la pièce. Le reste vient d’une fenêtre étroite à gauche, un carreau givré derrière lequel le jour tourne au bleu."),
  n("L’homme est déjà là, derrière le comptoir. Vous ne l’avez pas entendu arriver et vous n’auriez pas su dire s’il y était avant vous."),
  n("Il est vieux, très vieux, avec des cheveux blancs qui tombent en mèches inégales et un tablier de cuir usé jusqu’à la corde. Ses mains posées à plat sur le bois sont larges, tachées, couvertes de cicatrices fines. Il ne dit pas bonjour. Il vous regarde, et il vous regarde longtemps. Pas votre visage, plutôt vos mains, vos épaules, la façon dont vous tenez la porte."),
  d("« Ferme. Le froid rentre. »"),
  n("Vous refermez. Le loquet claque plus fort que vous ne l’auriez voulu, et le bruit se perd dans les étagères sans écho, mangé par toutes ces boîtes."),
  d("« Treize ans. Première année. »"),
  n("Ce n’est pas une question, alors vous ne répondez pas."),
  n("Il fait glisser la lampe de quelques centimètres, comme pour mieux vous voir, et un demi sourire passe sur son visage sans jamais atteindre ses yeux."),
  d("« On va faire vite. Le bois d’abord. Et ne me demande pas lequel est le meilleur, ça n’existe pas. Il y a celui qui te répondra et il y a les vingt-quatre autres. »"),
  n("Il se retourne enfin, lève la tête vers les étagères, et attend."),
  d("« Alors ? Qu’est-ce qui te tire l’œil ? »"),
];

// ─────────────────────────────────────────────────────────────
//  Les cartes — ce que le joueur lit avant de choisir
// ─────────────────────────────────────────────────────────────

/**
 * Ce que dit la carte, sous le nom.
 *
 * Chacune décrit une matière et une réputation, **jamais un effet**. « Lourd,
 * têtu, difficile à manier la première année » parle du bois, pas d’un malus :
 * il n’y a rien à manier de plus ni de moins avec un chêne qu’avec un frêne.
 */
const DESCRIPTIONS_BOIS: Record<CodeBois, string> = {
  FRENE:
    "Le bois de l’arbre qui tient le monde. Solide, franc, sans surprise. Celui qu’on donne aux enfants des familles anciennes.",
  IF: "Le bois des morts et des seuils. Les fabricants en travaillent peu et n’aiment pas en parler.",
  SORBIER:
    "Le bois qu’on cloue au dessus des portes contre le mauvais œil. Il protège, parfois plus que son porteur ne voudrait.",
  BOULEAU: "Le premier arbre qui repousse après le gel. Souple, jeune, obstiné.",
  CHENE_DES_TEMPETES:
    "Arraché aux crêtes battues par le vent. Lourd, têtu, difficile à manier la première année.",
};

const DESCRIPTIONS_COEUR: Record<CodeCoeur, string> = {
  PLUME_DE_CORBEAU:
    "Réagit vite, comprend avant qu’on ait fini le geste. Réputée capricieuse avec les distraits.",
  ECAILLE_ANGUILLE_ARGENTEE:
    "Fluide, silencieuse, à l’aise dans ce qui glisse et se dérobe.",
  NERF_LOUP_DES_FJORDS:
    "Endurant. Ne lâche pas en cours de sort, même quand la main tremble.",
  GRIFFE_OURS_DES_CAVERNES: "Puissante et brutale, peu portée sur la nuance.",
  CRISTAL_DE_GLACE:
    "Froid au toucher, longtemps. Précis, exigeant, peu indulgent avec l’approximation.",
};

/** Une carte, telle qu’elle part vers le navigateur. */
export type Carte = { code: string; nom: string; description: string };

/**
 * Les noms viennent de `ecole/baguette.ts` et ne sont pas recopiés ici : ce
 * sont les mêmes que la fiche affichera dans dix ans.
 *
 * Le cœur reprend une majuscule ici — sur une carte, il commence une ligne ;
 * dans « cœur de plume de corbeau », il n’en a pas.
 */
export const CARTES_BOIS: readonly Carte[] = CODES_BOIS.map((code) => ({
  code,
  nom: BOIS[code],
  description: DESCRIPTIONS_BOIS[code],
}));

export const CARTES_COEUR: readonly Carte[] = CODES_COEUR.map((code) => ({
  code,
  nom: COEURS[code].charAt(0).toUpperCase() + COEURS[code].slice(1),
  description: DESCRIPTIONS_COEUR[code],
}));

// ─────────────────────────────────────────────────────────────
//  Ce qu’il dit ensuite
// ─────────────────────────────────────────────────────────────

export const SUITE_BOIS: Record<CodeBois, readonly Paragraphe[]> = {
  FRENE: [
    n("Il n’a pas besoin de l’échelle. Il tire une pile à hauteur d’épaule, celle qu’on a manifestement ouverte mille fois, et la pose devant vous."),
    d("« Le frêne. Bien sûr. C’est ce que prennent ceux dont les parents sont déjà passés ici. Ça n’en fait pas un mauvais choix. Ça en fait un choix que je connais par cœur. »"),
  ],
  IF: [
    n("Il ne bouge pas tout de suite. Il vous regarde un peu plus longtemps qu’avant, puis va chercher l’échelle, qu’il déplace jusqu’au fond de la boutique, là où la lampe n’éclaire plus."),
    d("« L’if. »"),
    n("Il monte lentement. La pile qu’il redescend est courte, et la poussière dessus est ancienne."),
    d("« On en fait peu. On en vend moins. Ce bois pousse dans les cimetières et sur les seuils, et il retient ce qu’on lui donne. Tu comprendras plus tard ce que ça veut dire. Ne me regarde pas comme ça, je ne t’expliquerai pas. »"),
  ],
  SORBIER: [
    n("Il hoche la tête une fois, va chercher une pile sur la droite et l’installe sans cérémonie."),
    d("« Le sorbier. On en cloue au dessus des portes pour éloigner ce qui rôde. Sache une chose : un bois qui protège ne demande pas ton avis sur ce dont il te protège. Il y a des élèves que ça agace, avec les années. »"),
  ],
  BOULEAU: [
    n("Il attrape la pile sans même la chercher, comme si elle avait toujours été à cet endroit précis."),
    d("« Le bouleau. C’est le premier arbre qui revient quand tout a gelé. Il ne casse pas, il plie, et il recommence. Les gens du Sud le trouvent commun. Les gens d’ici savent ce que ça vaut, un arbre qui repousse. »"),
  ],
  CHENE_DES_TEMPETES: [
    n("Il lève un sourcil, prend son temps, et va tirer une pile lourde qu’il repose sur le comptoir un peu plus fort que les autres."),
    d("« Le chêne des crêtes. Tu as des bras pour ça, toi ? »"),
    n("Il n’attend pas la réponse."),
    d("« Ce bois a passé deux cents ans à se faire tordre par le vent sans céder. Il ne va pas t’obéir parce que tu es poli. La première année sera pénible. Après, tu ne voudras plus rien d’autre. »"),
  ],
};

/** Entre le bois et le cœur : les boîtes ouvertes, puis les cinq coffrets. */
export const ENTRE_LE_BOIS_ET_LE_COEUR: readonly Paragraphe[] = [
  n("Il ouvre les boîtes une à une. À l’intérieur, sur un lit de tissu, des baguettes brutes, sans cœur. De simples tiges de bois tourné, mates, qui ne ressemblent à rien."),
  d("« Ça, c’est le corps. Ça ne fait rien tout seul. Ce qu’on met dedans, c’est autre chose. »"),
  n("Il dégage un espace sur le comptoir d’un revers de main, et aligne cinq petits coffrets de métal terni. Il les ouvre du bout de l’ongle, l’un après l’autre. Il ne vous laisse pas toucher."),
];

export const SUITE_COEUR: Record<CodeCoeur, readonly Paragraphe[]> = {
  PLUME_DE_CORBEAU: [
    d("« La plume. Elle est plus rapide que toi et elle le sait. Si ton geste hésite, elle partira avant, et tu passeras l’année à courir derrière ta propre main. Ceux qui la tiennent finissent très bons ou très fatigués. »"),
  ],
  ECAILLE_ANGUILLE_ARGENTEE: [
    d("« L’anguille. On la prend pour ce qui glisse, ce qui se faufile, ce qui ne fait pas de bruit. Le silence n’est pas la douceur, petit. Ce cœur ne prévient pas. »"),
  ],
  NERF_LOUP_DES_FJORDS: [
    d("« Le loup. Celui là ne lâche rien. Ta main peut trembler, ton sort ira jusqu’au bout, et parfois c’est exactement ce qu’il ne fallait pas. Il ne t’aidera pas à changer d’avis en cours de route. »"),
  ],
  GRIFFE_OURS_DES_CAVERNES: [
    n("Sa main s’arrête au dessus du coffret, une seconde de trop."),
    d("« La griffe. »"),
    n("Il regarde la porte, du côté du linteau, puis revient à vous."),
    d("« Il n’y a plus d’ours sur cette côte depuis longtemps. Ne demande pas d’où elles viennent. Ce cœur cogne, il ne discute pas, et il ne connaît rien à la finesse. Certains n’ont besoin que de ça. »"),
  ],
  CRISTAL_DE_GLACE: [
    d("« La glace. Prélevée là haut, où l’air ne suffit plus. C’est le plus exigeant des cinq. Il rendra exactement ce que tu y auras mis, pas un souffle de plus, et il ne pardonnera pas l’à peu près. Beaucoup le trouvent froid. Il l’est. »"),
  ],
};

// ─────────────────────────────────────────────────────────────
//  La baguette, et la réaction
// ─────────────────────────────────────────────────────────────

/** Il la fabrique, il la pose, vous la prenez. Puis la photographie. */
export const AVANT_LA_REACTION: readonly Paragraphe[] = [
  n("Il travaille sans un mot pendant un long moment, dos tourné, et vous n’entendez que le bruit sec de l’outil sur le bois. Quand il se retourne, la baguette est finie. Il la pose sur le comptoir, à mi chemin entre lui et vous, et il ne la lâche pas tout de suite."),
  d("« Prends la. »"),
  n("Vous la prenez."),
];

/** Ce que la main sent — le bois, et le bois seul. */
export const MAIN_SELON_LE_BOIS: Record<CodeBois, string> = {
  FRENE:
    "Le bois est tiède, tout de suite, comme s’il avait attendu dans une poche et non dans une boîte. La prise tombe juste. Rien ne résiste.",
  IF: "Le bois est froid et le reste. Vous sentez le poids exact de la baguette, pas un gramme de plus, et l’impression désagréable qu’elle vous soupèse en retour.",
  SORBIER:
    "Un fourmillement remonte le long de votre poignet et s’arrête net au coude. Ce n’est pas douloureux. C’est comme une main posée là pour vous retenir d’avancer.",
  BOULEAU:
    "Le bois cède un peu sous les doigts, presque vivant, et reprend sa forme. Vous serrez plus fort sans le vouloir. Il tient.",
  CHENE_DES_TEMPETES:
    "Elle est lourde. Beaucoup plus lourde qu’elle n’en a l’air, et le premier réflexe de votre bras est de la reposer. Vous ne la reposez pas.",
};

/** Ce que la pièce voit — le cœur, sauf mariage particulier. */
export const PIECE_SELON_LE_COEUR: Record<CodeCoeur, string> = {
  PLUME_DE_CORBEAU:
    "La flamme de la lampe se couche d’un coup, comme sous un souffle, et se redresse. Quelque part au fond de la boutique, une pile de boîtes glisse de deux centimètres et s’arrête.",
  ECAILLE_ANGUILLE_ARGENTEE:
    "Rien. Pas un bruit, pas une étincelle. Puis vous vous apercevez que le givre de la fenêtre a fondu en une longue traînée, et que l’eau coule sur le rebord.",
  NERF_LOUP_DES_FJORDS:
    "Une vibration sourde part de la baguette et traverse le comptoir. La lampe tressaute. Le vieil homme pose deux doigts sur le bois pour l’arrêter, sans vous regarder.",
  GRIFFE_OURS_DES_CAVERNES:
    "Une gerbe d’étincelles rouges jaillit de la pointe et retombe en pluie sur le comptoir. Ça sent le brûlé pendant une seconde. Le vieux ne bouge pas d’un cil.",
  CRISTAL_DE_GLACE:
    "Le froid saisit la pièce d’un coup. Votre souffle devient blanc, celui du vieil homme aussi, et le carreau de la fenêtre se couvre de givre neuf sous vos yeux.",
};

/**
 * Les cinq mariages qui ont leur propre réaction.
 *
 * Ils **remplacent le second fragment**, jamais le premier : ce que la main
 * sent reste ce que le bois fait sentir. La clé est `BOIS|COEUR` — le type
 * l’exige, une paire mal orthographiée ne compile pas.
 *
 * `Partial` parce que les vingt autres mariages n’ont rien ici, et c’est
 * voulu : leur réaction s’assemble des deux fragments ordinaires.
 */
export const VARIANTES: Partial<
  Record<`${CodeBois}|${CodeCoeur}`, readonly Paragraphe[]>
> = {
  "IF|PLUME_DE_CORBEAU": [
    n("La flamme de la lampe ne se couche pas. Elle s’éteint. La boutique devient bleue et vous restez là, la baguette à la main, à écouter le vieil homme chercher ses allumettes sans dire un mot."),
  ],
  "IF|CRISTAL_DE_GLACE": [
    n("Le froid tombe, et il ne s’arrête pas là où il devrait. Vous entendez le bois de l’étagère craquer quelque part au dessus de vous. Le vieil homme lève les yeux vers le plafond, longtemps, puis les redescend sur vous."),
  ],
  "CHENE_DES_TEMPETES|GRIFFE_OURS_DES_CAVERNES": [
    n("La décharge vous remonte tout le bras et vous lâchez la baguette. Elle roule sur le comptoir et s’arrête contre la lampe. Le vieux la remet en place du bout du doigt."),
    d("« Ramasse. Elle t’a répondu, c’est tout ce qu’on lui demandait. »"),
  ],
  "SORBIER|ECAILLE_ANGUILLE_ARGENTEE": [
    n("Le fourmillement de votre bras s’éteint d’un coup, comme si on avait coupé quelque chose. Le silence dans la boutique devient épais. Vous avez la nette impression que la baguette vient de décider seule de ne rien montrer."),
  ],
  "BOULEAU|NERF_LOUP_DES_FJORDS": [
    n("La vibration ne s’arrête pas au comptoir. Elle continue, régulière, obstinée, jusqu’à ce que vous relâchiez volontairement les doigts. Le vieil homme hausse un sourcil, ce qui chez lui ressemble à un compliment."),
  ],
};

/** La sortie : le registre, la lampe soufflée, le sentier. */
export const APRES_LA_REACTION: readonly Paragraphe[] = [
  n("Le vieux ne commente pas ce qu’il vient de voir. Il ouvre un registre relié de cuir noir, écrit trois lignes de sa main lente, et le referme."),
  d("« C’est la tienne. Elle le restera. »"),
  n("Il ne vous souhaite pas bonne chance. Il souffle la lampe alors que vous êtes encore devant le comptoir, et la pièce devient bleue."),
  n("Dehors, la pluie n’a pas cessé. Le sentier qui monte vers la falaise commence à trente pas de la porte, et il fait maintenant tout à fait nuit."),
];
