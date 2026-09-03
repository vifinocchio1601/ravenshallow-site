import "server-only";

import type { Annee } from "./cursus";

/**
 * **Les questionnaires des contrôles — et les bonnes réponses.**
 *
 * ── Pourquoi `server-only` ──
 *
 * C'est le fichier le plus sensible du lot, et le seul qui doive rester au
 * chaud. Dans les six maquettes du joueur, `bonne` et l'explication vivaient
 * dans le JavaScript de la page : n'importe quel élève ouvrant le code source
 * avait ses cinq réponses avant de commencer. Son propre commentaire
 * l'annonçait — « comme il le sera côté serveur ».
 *
 * C'est exactement ce que la Cérémonie du Miroir a déjà résolu, et de la même
 * façon : le barème vit dans un fichier `server-only`, et ne quitte jamais le
 * serveur. `enoncesDe` est la seule porte par laquelle un questionnaire
 * descend dans le navigateur, et elle laisse `bonne` et `explication`
 * derrière elle.
 *
 * ⚠️ **Ne jamais exporter `QUESTIONNAIRES` vers un composant client**, ni le
 * passer en propriété d'une page. `server-only` casse la compilation si on
 * essaie ; c'est le filet, pas la règle.
 *
 * ── Les énoncés et le barème dans le même fichier ──
 *
 * Même choix que `ceremonie/questionnaire.ts`, et pour la même raison : les
 * séparer obligerait à les tenir synchronisés à la main, et c'est une
 * question et sa réponse qu'on désaccorderait.
 *
 * ── Ce qui est du joueur, au signe près ──
 *
 * Les six questionnaires sont les siens, extraits de ses pages de contrôle du
 * 3 septembre 2026 : trente questions, cent vingt réponses, trente
 * explications et trente-six mots du professeur. Rien n'y a été réécrit — les
 * apostrophes droites comprises.
 *
 * ⚠️ **`mots` est indexé PAR LA NOTE** : `mots[0]` pour zéro sur cinq,
 * `mots[5]` pour cinq sur cinq. Il en faut donc toujours un de plus qu'il n'y
 * a de questions, et `questionnaires.test.ts` le vérifie.
 */

export type Question = {
  /** L'énoncé, tel qu'il s'affiche. */
  enonce: string;
  /**
   * Les réponses proposées, **dans l'ordre du questionnaire**.
   *
   * ⚠️ Ce n'est pas l'ordre d'affichage : la page les mélange à chaque
   * ouverture. Ce que l'élève renvoie est l'indice dans CETTE liste — le
   * mélange ne voyage jamais jusqu'au serveur, et n'a donc rien à protéger.
   */
  reponses: readonly string[];
  /** L'indice de la bonne réponse. **Ne descend jamais dans le navigateur.** */
  bonne: number;
  /** Ce que le professeur dit après coup. **Après l'envoi seulement.** */
  explication: string;
};

export type Questionnaire = {
  matiereId: string;
  annee: Annee;
  /** Le rang de la leçon dont ce contrôle est la suite. */
  rang: number;
  questions: readonly Question[];
  /** Le mot du professeur, **indexé par la note**. Un de plus que de questions. */
  mots: readonly string[];
};

const QUESTIONNAIRES: readonly Questionnaire[] = [
  {
    matiereId: "sortileges",
    annee: 1,
    rang: 1,
    // Sortilèges — Contrôle de la leçon 1
    questions: [
      {
        enonce: "Pourquoi la flamme de Kenaz ne consume-t-elle rien ?",
        reponses: [
          "Parce qu'elle est trop faible pour brûler",
          "Parce qu'elle ne se nourrit pas de ce qui l'entoure mais de l'attention du lanceur",
          "Parce que le tracé comporte une protection contre le feu",
          "Parce qu'elle reste enfermée dans la baguette",
        ],
        bonne: 1,
        explication: "La rune ne fabrique pas la lumière, elle la désigne. Kenaz nomme la torche, c'est-à-dire la lumière que quelqu'un tient et entretient : elle n'a rien à consumer.",
      },
      {
        enonce: "D'où part le second trait de la rune Kenaz ?",
        reponses: [
          "De l'extrémité basse du premier trait",
          "Du milieu du premier trait",
          "De l'extrémité haute du premier trait",
          "Il ne touche pas le premier trait",
        ],
        bonne: 1,
        explication: "Le second trait part du milieu et non de l'extrémité. C'est l'erreur qu'il corrige pendant les trois premières séances.",
      },
      {
        enonce: "Une flamme naît puis meurt aussitôt. Que corrige le professeur ?",
        reponses: [
          "L'angle du second trait",
          "Le souffle, coupé à la fin du tracé",
          "La prononciation de l'incantation",
          "La position de la main",
        ],
        bonne: 1,
        explication: "Le souffle continue après le tracé, et la flamme vit tant que dure l'expiration. Il fait compter jusqu'à trois à voix basse après la fin du geste.",
      },
      {
        enonce: "Que se passe-t-il si l'on approche cette flamme d'une mèche de chandelle ?",
        reponses: [
          "La chandelle s'allume normalement",
          "La chandelle s'allume d'une flamme froide",
          "Rien : la flamme ne se transmet à rien",
          "La flamme du lanceur s'éteint",
        ],
        bonne: 2,
        explication: "La flamme est froide et ne se transmet à rien. C'est ce qui permet de l'utiliser dans la réserve d'herboristerie, où aucune flamme ordinaire n'est autorisée.",
      },
      {
        enonce: "Que répond-il à propos de la prononciation en usage à Kaldvik ?",
        reponses: [
          "Qu'elle est fautive et qu'il faut l'éviter",
          "Que leur sort fonctionne aussi bien, et qu'il faudrait s'interroger sur ce que cela nous apprend",
          "Qu'elle ne fonctionne que pour les gens du village",
          "Qu'il l'ignore",
        ],
        bonne: 1,
        explication: "Il ne développe pas. La question reviendra en runologie, où l'on distingue ce qui tient au mot de ce qui tient à celui qui le dit.",
      },
    ],
    mots: [
      "Rien de ce qui a été dit dans cette salle n'a été retenu. Relisez la leçon avant de traverser un couloir seul.",
      "Un point sur cinq. La leçon est encore entière devant vous.",
      "La moitié y est. Le tracé, semble-t-il, plus que le souffle.",
      "Trois sur cinq. Suffisant pour la suite, insuffisant pour l'hiver.",
      "Quatre sur cinq. Il ne vous manque presque rien, et ce presque rien vous coûtera une fois.",
      "Cinq sur cinq. Il ne vous le dira pas.",
    ],
  },
  {
    matiereId: "runologie",
    annee: 1,
    rang: 1,
    // Runologie — Contrôle de la leçon 1
    questions: [
      {
        enonce: "Que porte d'abord une rune, selon ce cours ?",
        reponses: [
          "Un pouvoir",
          "Une valeur sonore",
          "Un fondateur",
          "Une couleur",
        ],
        bonne: 1,
        explication: "Avant d'être un outil de sorcier, le Futhark est une écriture. Chaque signe vaut d'abord un son dans un mot, et ne porte son sens qu'ensuite.",
      },
      {
        enonce: "D'où vient le nom du Futhark ?",
        reponses: [
          "Du nom de son inventeur",
          "Des six premières runes de la table",
          "D'un mot ancien signifiant écriture",
          "Du village de Kaldvik",
        ],
        bonne: 1,
        explication: "Fehu, Uruz, Thurisaz, Ansuz, Raidho, Kenaz donnent f, u, þ, a, r, k. L'alphabet ne s'appelle pas autrement, et il porte son propre début comme nom.",
      },
      {
        enonce: "Que contenait la feuille vieille de quatre cents ans que la Directrice fait circuler ?",
        reponses: [
          "Une formule de protection",
          "Une liste de courses",
          "Un serment de fondation",
          "Un relevé d'inscription du château",
        ],
        bonne: 1,
        explication: "Il y est question de sel, de corde et de trois brebis. La plupart des inscriptions de la côte ne sont ni magiques ni solennelles : ce sont des noms, des dettes, des comptes, et parfois des insultes.",
      },
      {
        enonce: "En combien de groupes la table des vingt-quatre signes est-elle rangée ?",
        reponses: [
          "Deux groupes de douze",
          "Trois groupes de huit",
          "Quatre groupes de six",
          "Six groupes de quatre",
        ],
        bonne: 1,
        explication: "Trois groupes de huit, appelés ættir. L'ordre est attesté bien avant l'école et n'a jamais varié. Ce qu'il ordonne, personne ne le sait.",
      },
      {
        enonce: "Dans quel sens trace-t-on une rune, sauf exception ?",
        reponses: [
          "De bas en haut, de droite à gauche",
          "De haut en bas, de gauche à droite",
          "De haut en bas, de droite à gauche",
          "Le sens n'a pas d'importance",
        ],
        bonne: 1,
        explication: "Du haut vers le bas et de la gauche vers la droite. Il existe quatre exceptions, qui seront vues plus tard dans l'année et qu'il vaut mieux ne pas deviner.",
      },
    ],
    mots: [
      "Rien de la table n'est resté. Elle vous la fera réciter debout la semaine prochaine, comme aux autres.",
      "Un point sur cinq. La table s'apprend par le poignet autant que par les yeux : recopiez-la en entier.",
      "La moitié. C'est le score habituel de la première semaine, et elle ne s'en formalise jamais.",
      "Trois sur cinq. Suffisant pour suivre, insuffisant pour lire quoi que ce soit.",
      "Quatre sur cinq. Il vous manque une exception, et les exceptions sont précisément ce qu'on vous demandera.",
      "Cinq sur cinq. Elle vous fera réciter la table à l'envers.",
    ],
  },
  {
    matiereId: "magie_defensive",
    annee: 1,
    rang: 1,
    // Magie défensive — Contrôle de la leçon 1
    questions: [
      {
        enonce: "Quelle est la première protection enseignée par ce cours ?",
        reponses: [
          "Le bouclier élémentaire",
          "La distance",
          "Le silence",
          "La dissimulation",
        ],
        bonne: 1,
        explication: "Elle est gratuite, elle ne rate jamais, et vous l'avez déjà. Aucun sort n'est lancé de toute la leçon.",
      },
      {
        enonce: "Combien de sorts sont lancés pendant cette première leçon ?",
        reponses: [
          "Un seul, par le professeur",
          "Aucun",
          "Un par élève",
          "Trois, en démonstration",
        ],
        bonne: 1,
        explication: "Les baguettes sont rangées avant d'entrer, et il vérifie une par une. Le premier sort de la matière n'arrive qu'à la leçon suivante.",
      },
      {
        enonce: "Comment se place-t-on pour offrir moins de surface sans perdre l'autre de vue ?",
        reponses: [
          "De face, bien campé",
          "De trois quarts",
          "Complètement de côté",
          "Le dos tourné",
        ],
        bonne: 1,
        explication: "De face on offre tout. Le dos tourné n'offre rien et ne voit rien : ce n'est pas une garde, c'est une fuite mal faite.",
      },
      {
        enonce: "Que portent les anneaux pâles sur le mur du fond ?",
        reponses: [
          "Des marques de fixation d'anciens supports",
          "Des impacts de sorts déviés, jamais réparés",
          "Des repères de distance",
          "Des traces d'humidité",
        ],
        bonne: 1,
        explication: "Ils viennent d'élèves qui n'ont pas choisi l'angle de leur déviation. On ne les répare pas, et c'est délibéré.",
      },
      {
        enonce: "Un élève appelle à l'aide pour rien. Que prévoit l'école ?",
        reponses: [
          "Une retenue",
          "Un avertissement oral",
          "Rien : aucun élève n'a jamais été sanctionné pour cela",
          "Un point de maison en moins",
        ],
        bonne: 2,
        explication: "C'est la règle première, et elle passe avant toutes les autres. Il la répétera chaque année jusqu'en cinquième.",
      },
    ],
    mots: [
      "Rien n'a été retenu. Relisez avant de remettre les pieds dans cette halle.",
      "Un point sur cinq. La leçon tenait pourtant en trois gestes et une phrase.",
      "La moitié. Vous avez retenu ce qui se fait, pas ce qui se dit.",
      "Trois sur cinq. Suffisant pour la leçon suivante, insuffisant pour un couloir sombre.",
      "Quatre sur cinq. Il vous manque exactement le point que tout le monde oublie.",
      "Cinq sur cinq. Il ne vous félicitera pas : il vous demandera où sont les sorties.",
    ],
  },
  {
    matiereId: "herboristerie",
    annee: 1,
    rang: 1,
    // Herboristerie nordique — Contrôle de la leçon 1
    questions: [
      {
        enonce: "Dans quel ordre travaille-t-on, selon la règle du cours ?",
        reponses: [
          "On nomme, on décrit, on cueille",
          "On décrit, on nomme, on cueille",
          "On cueille, on décrit, on nomme",
          "On sent, on nomme, on cueille",
        ],
        bonne: 1,
        explication: "On décrit avant de nommer, on nomme avant de cueillir. La grille suit toujours le même ordre : port, feuille, nervure, tige, bord, odeur, saison.",
      },
      {
        enonce: "Un élève veut arracher une plante pour mieux la voir. Que répond-elle ?",
        reponses: [
          "Il peut, si c'est pour la montrer à la classe",
          "Il peut, une seule fois dans l'année",
          "Non : on regarde avec les yeux, et elle ne repoussera pas",
          "Non, sauf en dehors du domaine",
        ],
        bonne: 2,
        explication: "Elle refuse deux fois pendant la leçon. Une plante arrachée n'apprend rien de plus que la même plante en place.",
      },
      {
        enonce: "Que découvre la classe en montant au séchoir ?",
        reponses: [
          "Que les plantes sèches sont plus actives",
          "Que les mêmes espèces sont méconnaissables une fois sèches",
          "Que le séchoir est interdit aux premières années",
          "Que l'odeur suffit à tout identifier",
        ],
        bonne: 1,
        explication: "C'est le moment où la moitié des élèves comprend que la matière sera plus difficile qu'ils ne le pensaient.",
      },
      {
        enonce: "Que faire d'une plante qu'on ne sait pas nommer ?",
        reponses: [
          "L'emporter pour la lui montrer",
          "La laisser en place et aller la chercher",
          "La dessiner puis la ramasser",
          "La comparer aux bocaux avant de décider",
        ],
        bonne: 1,
        explication: "Pas même pour la lui montrer. Si elle est occupée, la plante attendra : elle est là depuis plus longtemps que vous.",
      },
      {
        enonce: "Quelle proportion d'une station peut-on prélever au maximum ?",
        reponses: [
          "La moitié",
          "Un tiers",
          "Les trois quarts",
          "Tout, si l'espèce est commune",
        ],
        bonne: 1,
        explication: "Un tiers, et jamais deux années de suite au même endroit. Les stations épuisées sont barrées sur la carte du domaine, jamais effacées.",
      },
    ],
    mots: [
      "Rien n'est resté. Vous confondrez encore les trois touffes la semaine prochaine.",
      "Un point sur cinq. La grille de description se sait par cœur avant de servir.",
      "La moitié. Vous avez retenu les gestes, pas les règles.",
      "Trois sur cinq. Assez pour sortir avec la classe, pas assez pour sortir devant.",
      "Quatre sur cinq. Il vous manque une règle, et les règles sont ce qui vous protège dehors.",
      "Cinq sur cinq. Elle vous fera décrire la quatrième touffe, celle qu'elle n'a pas montrée.",
    ],
  },
  {
    matiereId: "creatures",
    annee: 1,
    rang: 1,
    // Créatures magiques — Contrôle de la leçon 1
    questions: [
      {
        enonce: "Quelle distinction le professeur pose-t-il après la question sur les moulages ?",
        reponses: [
          "Entre voir et croire",
          "Entre mal voir et ne pas regarder",
          "Entre observer et déranger",
          "Entre le domaine et le village",
        ],
        bonne: 1,
        explication: "Ce ne sont pas la même faute et elles ne se corrigent pas de la même façon. Toute la matière découle de cette phrase.",
      },
      {
        enonce: "Que contient la colonne de gauche du carnet d'observation ?",
        reponses: [
          "Ce qu'on croit que cela veut dire",
          "Ce qu'on a vu",
          "Le nom de l'animal",
          "L'heure et la météo seulement",
        ],
        bonne: 1,
        explication: "À gauche le fait, à droite l'interprétation. La colonne de gauche est un fait, celle de droite est vous.",
      },
      {
        enonce: "Que porte l'étiquette plantée dans un moulage ?",
        reponses: [
          "Le nom de l'espèce et sa dangerosité",
          "Le lieu, la date, et le nom de celui qui l'a relevé",
          "La taille et la profondeur",
          "Rien : les étiquettes sont vierges",
        ],
        bonne: 1,
        explication: "Une observation sans heure ni lieu n'est pas une observation. Les étiquettes les plus anciennes sont écrites d'une main qu'on ne sait plus lire.",
      },
      {
        enonce: "Que fait-on quand on ne voit pas assez bien ?",
        reponses: [
          "On approche lentement",
          "On attend ou on renonce",
          "On demande à un camarade de regarder",
          "On note quand même, en signalant le doute",
        ],
        bonne: 1,
        explication: "On n'approche jamais pour mieux voir. C'est la seule règle de la matière qui vaudra encore en septième année.",
      },
      {
        enonce: "Que dit le cours des corbeaux sauvages ?",
        reponses: [
          "Ils portent le courrier en cas d'urgence",
          "On ne les siffle jamais",
          "Ils appartiennent au village de Kaldvik",
          "On peut les nourrir mais pas les toucher",
        ],
        bonne: 1,
        explication: "Ceux de la Tour portent le courrier et se hèlent par leur nom, inscrit au registre. Les sauvages n'ont rien à voir avec eux, et la confusion se paie en messages perdus.",
      },
    ],
    mots: [
      "Rien n'est resté. Vous repasserez devant les moulages sans les voir.",
      "Un point sur cinq. La leçon tenait en deux colonnes et une question.",
      "La moitié. Vous avez retenu ce qu'il a dit, pas ce qu'il a fait.",
      "Trois sur cinq. Suffisant pour tenir un carnet, insuffisant pour le relire.",
      "Quatre sur cinq. Il vous manque le point que vous croyiez évident.",
      "Cinq sur cinq. Il ne vous le dira pas, et il vous laissera compter les moulages en sortant.",
    ],
  },
  {
    matiereId: "histoire",
    annee: 1,
    rang: 1,
    // Histoire de Ravenshallow — Contrôle de la leçon 1
    questions: [
      {
        enonce: "Par quoi le cours commence-t-il ?",
        reponses: [
          "Par la biographie des quatre fondateurs",
          "Par les villages de la côte avant l'école",
          "Par la construction du château",
          "Par la naissance des maisons",
        ],
        bonne: 1,
        explication: "Il ne commence pas par les fondateurs. Il commence par le vide qui les précède : des villages qui vivaient de la mer, enterraient leurs morts et tenaient des comptes.",
      },
      {
        enonce: "Quelle est la source la plus fiable sur les disparitions ?",
        reponses: [
          "Les chroniques de l'école",
          "Les comptes des paroisses",
          "Les récits de marins de Kaldvik",
          "Les lettres des fondateurs",
        ],
        bonne: 1,
        explication: "Des comptes ne mentent pas, parce que personne n'a jamais pensé qu'on les lirait pour cela. Ils confirment les pertes village par village.",
      },
      {
        enonce: "Que prouve la superposition des cinq relevés ?",
        reponses: [
          "Que les pertes ont une cause unique",
          "Que les séries se recouvrent, et que séparément seules elles s'expliqueraient",
          "Que trois villages ont été touchés avant les autres",
          "Que les registres ont été falsifiés",
        ],
        bonne: 1,
        explication: "Séparément, chaque série s'explique par une mauvaise saison ou un hiver dur. Ensemble, elles ne s'expliquent plus, et c'est la seule chose que le relevé prouve.",
      },
      {
        enonce: "Que répond-il quand on lui demande la cause des disparitions ?",
        reponses: [
          "Qu'il n'a pas le droit de le dire",
          "Que personne ne le sait, et que le cours ne le dira jamais",
          "Que la réponse attend la sixième année",
          "Qu'il l'expliquera au troisième trimestre",
        ],
        bonne: 1,
        explication: "Ce n'est pas un secret qu'il garde : c'est un renseignement que personne ne possède. Puis il reprend sa phrase au mot où il s'était interrompu.",
      },
      {
        enonce: "Que portent les quatre plaques de laiton sous les portraits ?",
        reponses: [
          "Quatre noms et quatre paires de dates",
          "Trois noms avec deux dates, un nom avec une seule",
          "Quatre noms sans aucune date",
          "Trois plaques gravées et une vierge",
        ],
        bonne: 1,
        explication: "La quatrième ne porte qu'une date. Elle est de la même main que les trois autres, ce qui veut dire qu'on l'a gravée en sachant qu'on ne pourrait pas la compléter. Il ne le fait jamais remarquer.",
      },
    ],
    mots: [
      "Rien n'est resté. Vous repasserez sous les quatre portraits sans les regarder.",
      "Un point sur cinq. Le manuel se relit, et il vous en fera relire deux chapitres.",
      "La moitié. Vous avez retenu le récit, pas la méthode.",
      "Trois sur cinq. Suffisant pour suivre, insuffisant pour lire une source.",
      "Quatre sur cinq. Il vous manque un point, et c'est celui que la salle vous montrait.",
      "Cinq sur cinq. Il ne vous félicitera pas. Il vous demandera ce que porte la quatrième plaque.",
    ],
  },
];

/** Le questionnaire d'une leçon, ou `null`. */
export function questionnaireDe(
  matiereId: string,
  annee: Annee,
  rang: number,
): Questionnaire | null {
  return (
    QUESTIONNAIRES.find(
      (q) => q.matiereId === matiereId && q.annee === annee && q.rang === rang,
    ) ?? null
  );
}

/** Les clés des questionnaires posés — pour les essais, et pour eux seuls. */
export function clesDesQuestionnaires(): string[] {
  return QUESTIONNAIRES.map((q) => `${q.matiereId}/${q.annee}/${q.rang}`);
}

// ─────────────────────────────────────────────────────────────
//  La seule porte vers le navigateur
// ─────────────────────────────────────────────────────────────

/** Une question telle que l'élève la reçoit : l'énoncé et les choix, rien d'autre. */
export type QuestionPosee = { enonce: string; reponses: readonly string[] };

/**
 * **Ce qui descend dans la page.**
 *
 * ⚠️ Écrite champ par champ, jamais par une copie dont on retirerait deux
 * clés : un champ ajouté demain à `Question` ne partirait pas tout seul dans
 * le navigateur. C'est le procédé du résumé de La Veille, et l'inverse d'un
 * `delete q.bonne` qu'on oublierait un jour.
 */
export function enoncesDe(q: Questionnaire): QuestionPosee[] {
  return q.questions.map((question) => ({
    enonce: question.enonce,
    reponses: [...question.reponses],
  }));
}

// ─────────────────────────────────────────────────────────────
//  Corriger — pur, sans base ni horloge
// ─────────────────────────────────────────────────────────────

export type Correction = {
  /** Le nombre de bonnes réponses. **C'est la note, et c'est le nombre de points.** */
  note: number;
  surCombien: number;
  /** L'indice attendu, question par question. */
  bonnes: number[];
  /** Le mot du professeur qui va avec la note. */
  explications: string[];
  mot: string;
};

/**
 * **Ce que l'élève a renvoyé est-il recevable ?**
 *
 * Rend les réponses nettoyées, ou `null`. Une réponse manquante n'existe
 * pas : le contrôle s'envoie complet ou ne s'envoie pas — c'est ce que la page
 * dit à l'écran (« Cinq réponses attendues avant l'envoi »), et c'est ce que
 * la base exige (autant de réponses que de questions).
 *
 * ⚠️ **On ne fait confiance à rien de ce qui arrive.** Le bouton d'envoi est
 * désactivé tant que les cinq réponses n'y sont pas ; une route se contourne
 * en l'appelant.
 */
export function reponsesRecevables(
  q: Questionnaire,
  brut: unknown,
): number[] | null {
  if (!Array.isArray(brut) || brut.length !== q.questions.length) return null;
  const propres: number[] = [];
  for (const [i, valeur] of brut.entries()) {
    if (typeof valeur !== "number" || !Number.isInteger(valeur)) return null;
    if (valeur < 0 || valeur >= q.questions[i]!.reponses.length) return null;
    propres.push(valeur);
  }
  return propres;
}

/**
 * **La correction — une bonne réponse, un point.**
 *
 * Règle du joueur, 3 septembre 2026. Pure : elle ne lit ni base ni horloge, et
 * s'éprouve donc sur les trente questions sans rien écrire.
 *
 * ⚠️ **Elle ne dit rien des points.** Ce qu'une note rapporte se décide dans
 * `points/depot.ts`, seul endroit qui écrive au carnet. Ici, on compte des
 * bonnes réponses.
 */
export function corriger(q: Questionnaire, reponses: number[]): Correction {
  const bonnes = q.questions.map((question) => question.bonne);
  const note = reponses.filter((r, i) => r === bonnes[i]).length;
  return {
    note,
    surCombien: q.questions.length,
    bonnes,
    explications: q.questions.map((question) => question.explication),
    // Le mot est indexé par la note ; le repli n'arrive jamais, et existe
    // pour qu'aucun appelant n'ait à traiter un `undefined` qui ne se produit pas.
    mot: q.mots[note] ?? "",
  };
}
