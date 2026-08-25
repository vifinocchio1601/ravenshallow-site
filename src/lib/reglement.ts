/**
 * Texte du règlement de Ravenshallow.
 *
 * Séparé du gabarit pour que `src/app/inscription/page.tsx` reste lisible :
 * la page ne fait que mettre en forme cette structure.
 */

export type Clause = {
  /** Numéro affiché en tête de point (« 1.1 »). */
  num: string;
  text: string;
  /** Seul l'article 8.3 porte un tableau. */
  table?: SanctionsTable;
};

export type SanctionsTable = {
  headers: string[];
  rows: string[][];
};

export type Article = {
  id: string;
  title: string;
  /** Phrase d'introduction avant les points numérotés. */
  lead?: string;
  clauses: Clause[];
};

export type Part = {
  id: string;
  /** Rune décorative posée au-dessus du titre de partie. */
  rune: string;
  title: string;
  articles: Article[];
};

export const REGLEMENT_QUOTE =
  "Les mers murmurent, les falaises gardent, et Ravenshallow veille.";

export const REGLEMENT_INTRO = {
  lead: "Ce règlement se divise en deux parties :",
  parts: [
    "Partie I — Règlement général (hors RP) : la vie du site, entre joueurs.",
    "Partie II — Règlement du jeu de rôle (RP) : l'écriture, les personnages, l'univers.",
  ],
  acceptance:
    "L'inscription vaut acceptation pleine et entière des deux parties. Le règlement est susceptible d'évoluer : toute adaptation d'une règle existante comme tout ajout est affiché dans le Grand Hall, et entre en vigueur sept jours après son affichage. Il appartient à chaque membre d'en prendre connaissance — le Grand Hall est le seul lieu officiel d'annonce en la matière.",
};

const SANCTIONS: SanctionsTable = {
  headers: ["Niveau", "Mesure", "Cas typiques"],
  rows: [
    ["1", "Rappel informel en privé", "Maladresse, méconnaissance du règlement"],
    ["2", "Avertissement formel enregistré", "Récidive, manque de respect ponctuel"],
    [
      "3",
      "Restriction temporaire (messagerie, publication)",
      "Comportement répété malgré avertissement",
    ],
    ["4", "Suspension de 7 à 30 jours", "Harcèlement, contenu interdit"],
    ["5", "Exclusion définitive", "Faute grave, récidive après suspension"],
  ],
};

export const REGLEMENT_PARTS: Part[] = [
  {
    id: "partie-i",
    rune: "ᛚᛟᚷ",
    title: "Partie I — Règlement général (hors RP)",
    articles: [
      {
        id: "article-1",
        title: "Article 1 — Esprit du site",
        clauses: [
          {
            num: "1.1",
            text: "Ravenshallow est un espace d'écriture collaborative. On y vient pour raconter des histoires ensemble, pas pour gagner contre les autres.",
          },
          {
            num: "1.2",
            text: "Le respect prime sur tout le reste. Un désaccord d'écriture, un refus de scène ou une répartition qui déçoit ne justifient jamais l'agressivité envers un autre membre.",
          },
          {
            num: "1.3",
            text: "La bienveillance envers les nouveaux est une obligation, pas une politesse. Chaque joueur a été débutant.",
          },
        ],
      },
      {
        id: "article-2",
        title: "Article 2 — Compte et identité",
        clauses: [
          {
            num: "2.1",
            text: "Un compte par personne. La création de comptes multiples (« doubles comptes ») est interdite, sauf autorisation explicite de l'administration.",
          },
          {
            num: "2.2",
            text: "Le partage d'un compte entre plusieurs personnes est interdit. Le titulaire du compte reste responsable de tout ce qui y est publié.",
          },
          {
            num: "2.3",
            text: "L'accès au site est réservé aux personnes de 16 ans et plus, en raison du ton visé (jeune adulte / adulte, thèmes matures traités avec retenue).",
          },
          {
            num: "2.4",
            text: "En cas de départ, un membre peut demander la suppression ou l'anonymisation de son compte. Ses écrits RP publiés dans des scènes partagées peuvent être conservés pour ne pas mutiler les histoires des autres joueurs ; ils seront alors détachés de son identité.",
          },
        ],
      },
      {
        id: "article-3",
        title: "Article 3 — Contenus interdits",
        lead: "Sont strictement interdits, sur toutes les zones du site (forums, messagerie, profils, images) :",
        clauses: [
          {
            num: "3.1",
            text: "Le harcèlement, les insultes, les menaces, l'acharnement contre un membre.",
          },
          {
            num: "3.2",
            text: "Les propos haineux ou discriminatoires : racisme, antisémitisme, sexisme, LGBTphobie, validisme, incitation à la haine sous toutes ses formes.",
          },
          {
            num: "3.3",
            text: "Tout contenu sexuel ou romantique explicite impliquant un personnage mineur. Les élèves de Ravenshallow ont entre 13 et 19 ans : les scènes à caractère sexuel les impliquant sont interdites sans exception, quel que soit l'âge des joueurs derrière les personnages. Cette règle n'est ni négociable ni contournable par une ellipse suggestive.",
          },
          {
            num: "3.4",
            text: "Tout contenu sexuellement explicite, y compris entre personnages adultes. Le site pratique le fondu au noir (voir article 16).",
          },
          {
            num: "3.5",
            text: "La divulgation d'informations personnelles concernant un membre (nom réel, adresse, lieu d'étude ou de travail, réseaux sociaux) sans son accord.",
          },
          {
            num: "3.6",
            text: "La publicité non sollicitée, le spam, le démarchage vers d'autres forums en messagerie privée.",
          },
          {
            num: "3.7",
            text: "Les contenus illégaux, les liens malveillants, tout contenu incitant à des pratiques dangereuses.",
          },
        ],
      },
      {
        id: "article-4",
        title: "Article 4 — Sujets sensibles hors RP",
        clauses: [
          {
            num: "4.1",
            text: "Les débats politiques, religieux ou d'actualité polémique n'ont pas leur place sur le site.",
          },
          {
            num: "4.2",
            text: "Si un membre traverse une situation personnelle difficile, l'équipe est disponible en message privé, mais le site n'est ni un service d'écoute ni un lieu de soin. En cas de détresse, nous invitons chacun à se tourner vers un proche ou un professionnel.",
          },
        ],
      },
      {
        id: "article-5",
        title: "Article 5 — Langue et forme",
        clauses: [
          {
            num: "5.1",
            text: "Le site est francophone. Les échanges hors RP se font en français.",
          },
          {
            num: "5.2",
            text: "Le langage SMS est toléré en discussion informelle, mais reste à éviter. Il est proscrit en RP (voir article 12).",
          },
          {
            num: "5.3",
            text: "Un effort raisonnable d'orthographe est attendu partout. Les difficultés d'écriture (dyslexie, français non natif) ne sont jamais un motif de moquerie — mais internet est votre ami : correcteurs orthographiques, dictionnaires et conjugueurs en ligne sont gratuits et à portée de clic. Un texte relu avant publication, c'est la moindre des politesses envers ceux qui vont le lire.",
          },
        ],
      },
      {
        id: "article-6",
        title: "Article 6 — Images, avatars et créations",
        clauses: [
          {
            num: "6.1",
            text: "Les images utilisées doivent être libres de droits, créditées, ou créées par le membre lui-même.",
          },
          {
            num: "6.2",
            text: "L'avatar d'un personnage peut être : la photographie d'une célébrité, à condition qu'elle soit cohérente avec l'âge du personnage et que la personne représentée soit majeure ; un avatar généré par IA ; une illustration ou un dessin, libre de droits ou réalisé par le membre. Pour les personnages les plus jeunes (13-15 ans), l'IA ou l'illustration sont à privilégier : les photographies de célébrités mineures ne sont pas acceptées. Une célébrité majeure photographiée plus jeune sur un rôle ancien reste utilisable.",
          },
          {
            num: "6.3",
            text: "Un même « visage » ne peut être utilisé que par un seul personnage à la fois. Les visages pris sont recensés dans un registre consultable avant la création de la fiche.",
          },
          {
            num: "6.4",
            text: "Les écrits publiés restent la propriété de leurs auteurs. Le site en conserve un droit d'affichage tant que le compte existe. Reprendre le texte d'un autre joueur ailleurs sans son accord est interdit.",
          },
          {
            num: "6.5",
            text: "L'univers de Ravenshallow (noms, maisons, lieux, créatures, blasons, carte) appartient à l'administration du site. Son usage hors du site nécessite un accord.",
          },
        ],
      },
      {
        id: "article-7",
        title: "Article 7 — Absences et inactivité",
        clauses: [
          {
            num: "7.1",
            text: "Une absence prévue de plus de deux semaines doit être signalée dans la section dédiée. Le personnage est alors protégé : ses scènes en cours sont mises en pause et sa progression gelée.",
          },
          {
            num: "7.2",
            text: "Un compte sans aucune activité pendant un mois sans absence signalée est marqué inactif : le personnage est retiré des scènes en cours pour ne pas bloquer les autres joueurs.",
          },
          {
            num: "7.3",
            text: "Après trois mois d'inactivité, le compte peut être archivé. Le retour reste possible : le personnage est restauré avec sa progression.",
          },
        ],
      },
      {
        id: "article-8",
        title: "Article 8 — Modération",
        clauses: [
          {
            num: "8.1",
            text: "L'équipe se compose d'administrateurs (gestion du site et du lore) et de modérateurs (vie quotidienne, arbitrages, accompagnement).",
          },
          {
            num: "8.2",
            text: "Les décisions de modération sont expliquées à la personne concernée en privé, jamais exposées publiquement pour l'humilier.",
          },
          {
            num: "8.3",
            text: "Échelle des sanctions :",
            table: SANCTIONS,
          },
          {
            num: "8.4",
            text: "Les infractions relevant de l'article 3.3 entraînent une exclusion définitive immédiate, sans échelle progressive.",
          },
          {
            num: "8.5",
            text: "Un membre sanctionné peut contester la décision une fois, par message privé à un administrateur non impliqué, dans les quinze jours.",
          },
          {
            num: "8.6",
            text: "Le signalement est un droit et non une délation. Les signalements sont confidentiels. Les signalements manifestement abusifs et répétés sont eux-mêmes sanctionnables.",
          },
          {
            num: "8.7",
            text: "Le staff est composé de bénévoles. Ils jouent aussi. La patience leur est due comme à n'importe quel membre.",
          },
        ],
      },
      {
        id: "article-9",
        title: "Article 9 — Séparation joueur / personnage",
        clauses: [
          {
            num: "9.1",
            text: "Un personnage détestable ne fait pas un joueur détestable. Un personnage cruel, lâche, manipulateur ou raciste envers une autre maison relève de la fiction.",
          },
          {
            num: "9.2",
            text: "Inversement, se cacher derrière son personnage pour viser réellement un autre membre est une faute aggravée. « C'était mon perso » n'est pas une défense.",
          },
          {
            num: "9.3",
            text: "Les conflits entre personnages ne doivent jamais déborder en conflits entre joueurs. En cas de tension, l'arbitrage d'un modérateur peut être demandé avant que la situation ne s'envenime.",
          },
        ],
      },
    ],
  },
  {
    id: "partie-ii",
    rune: "ᛊᚨᚷᚨ",
    title: "Partie II — Règlement du jeu de rôle",
    articles: [
      {
        id: "article-10",
        title: "Article 10 — Création de personnage",
        clauses: [
          {
            num: "10.1",
            text: "Chaque joueur commence avec un personnage. Un second personnage peut être demandé après trois mois d'activité régulière et une progression correcte du premier.",
          },
          {
            num: "10.2",
            text: "Le personnage entre à Ravenshallow à 13 ans, en première année. Il n'existe pas d'entrée en cours de scolarité. Tous les élèves de Ravenshallow ont franchi le Miroir de Brume la même année que leurs camarades de promotion, et la progression du personnage se fait ensuite au rythme du site. Une entrée en année supérieure ne peut être accordée qu'à titre exceptionnel, sur décision de l'administration seule, et uniquement lorsqu'elle sert une intrigue déjà écrite par le staff. Ce cas restera rare. Aucune demande spontanée de la part d'un joueur n'est étudiée, quelles que soient son ancienneté ou la qualité de sa fiche.",
          },
          {
            num: "10.3",
            text: "La fiche de personnage comprend : nom, âge, apparence, biographie, choix de la baguette (bois + cœur), et le questionnaire de répartition.",
          },
          {
            num: "10.4",
            text: "Personnages interdits ou soumis à validation stricte : descendant direct, héritier ou réincarnation de l'un des quatre fondateurs ; personnage lié par le sang à Alaric Nattmor ; créature magique, hybride, être non humain ; personnage déjà initié à la magie noire à son arrivée ; personnage insensible aux sorts, aux créatures, ou doté de pouvoirs hors du système de magie établi.",
          },
          {
            num: "10.5",
            text: "Les faiblesses valent autant que les forces. Une fiche sans aucun défaut, aucune limite et aucune peur sera renvoyée en correction.",
          },
          {
            num: "10.6",
            text: "La biographie doit rester cohérente avec l'univers : pas d'anachronisme, pas de technologie moderne, ancrage dans les terres du Nord.",
          },
        ],
      },
      {
        id: "article-11",
        title: "Article 11 — Répartition et maisons",
        clauses: [
          {
            num: "11.1",
            text: "La répartition se fait par le Miroir de Brume, via le questionnaire de personnalité. Le résultat n'est pas choisi par le joueur.",
          },
          {
            num: "11.2",
            text: "Le résultat de la répartition est définitif et ne se conteste pas. Répondre au questionnaire en essayant de deviner les réponses « attendues » pour obtenir une maison précise va contre l'esprit du site.",
          },
          {
            num: "11.3",
            text: "Aucune maison n'est meilleure qu'une autre. Le mépris hors RP envers une maison, en particulier Nattorm, est sanctionnable.",
          },
          {
            num: "11.4",
            text: "Clause Nattorm : la réputation de maison maudite est un ressort narratif, pas une licence. Un personnage de Nattorm n'est pas obligé d'être méchant ; un personnage des trois autres maisons n'est pas autorisé à harceler réellement les joueurs de Nattorm sous couvert de RP. Les préjugés se jouent avec nuance, ou pas du tout.",
          },
        ],
      },
      {
        id: "article-12",
        title: "Article 12 — Écriture",
        clauses: [
          {
            num: "12.1",
            text: "Le RP s'écrit en français correct, à la première ou à la troisième personne, au choix du joueur. Le choix se fait à l'ouverture de la scène et ne change plus jusqu'à sa clôture : ni de personne, ni de temps. Deux joueurs d'une même scène peuvent écrire dans des formes différentes, chacun restant constant dans la sienne.",
          },
          {
            num: "12.2",
            text: "Longueur minimale : 10 lignes par publication. Une scène d'action rapide peut descendre plus bas si les partenaires en conviennent ; un dialogue à deux répliques sans contexte ne fait pas un post.",
          },
          {
            num: "12.3",
            text: "Le hors-RP à l'intérieur d'un post RP est autorisé, entre balises [HRP] clairement identifiées, mais ne doit pas prendre le pas sur le RP lui-même : quelques lignes en début ou en fin de message, pas un commentaire qui double la longueur de la scène. Les échanges nourris se poursuivent en messagerie ou sur le forum.",
          },
          {
            num: "12.4",
            text: "Les descriptions des lieux doivent respecter la carte et la géographie de l'école. Inventer une aile du château, un souterrain ou un village voisin nécessite l'accord d'un administrateur.",
          },
          {
            num: "12.5",
            text: "Aucun post ne doit décider à la place d'un autre joueur : on décrit les intentions, les gestes et les tentatives de son propre personnage, jamais leurs résultats sur autrui.",
          },
        ],
      },
      {
        id: "article-13",
        title: "Article 13 — Interdits de scénario",
        clauses: [
          {
            num: "13.1",
            text: "La grotte scellée est inaccessible. Aucun personnage joueur ne peut y entrer, en franchir le sceau, ni tenter d'en forcer les protections. Ce que la grotte renferme ne figure nulle part dans la documentation accessible aux joueurs : aucune fiche, aucun post et aucune discussion ne doit affirmer en connaître la nature. Un personnage peut spéculer, redouter, colporter des rumeurs contradictoires — il ne sait pas. Toute intrigue s'approchant du sceau est menée exclusivement par l'administration, lors d'événements officiels.",
          },
          {
            num: "13.2",
            text: "Le Sortilège de Hel ne peut pas être appris, lancé, ni même correctement nommé par un personnage joueur. Son existence relève de l'histoire édulcorée enseignée aux jeunes élèves.",
          },
          {
            num: "13.3",
            text: "La magie noire est jouable uniquement comme tentation, rumeur ou trace : un ouvrage interdit trouvé dans une réserve, une confidence de couloir, une baguette qui noircit sans explication. Toute pratique effective nécessite une validation administrative préalable et entraîne des conséquences durables et visibles (marques, corruption, enquête du corps professoral).",
          },
          {
            num: "13.4",
            text: "Aucun personnage joueur ne rencontre Alaric Nattmor. Son sort est un mystère du site et le restera jusqu'à décision de l'administration.",
          },
          {
            num: "13.5",
            text: "Les rôles du corps professoral (professeurs, directeur, personnel du château) ne s'ouvrent pas librement à la création. Ils font l'objet d'une demande spéciale auprès de l'administration, qui reste seule juge de l'attribution. Le joueur retenu s'engage à une présence régulière — un professeur absent bloque des cours entiers — et accepte que le personnage soit encadré par le staff : matière, historique et limites sont validés en amont, et le rôle peut être repris en cas d'inactivité prolongée.",
          },
          {
            num: "13.6",
            text: "Les créatures du bestiaire (Draugr, Tåkesong, Nøkk, Huldra, Skoggrim, Blodskygge) ne s'invitent pas d'elles-mêmes dans une scène. Pour en inclure une, l'autorisation de l'administration est requise au préalable, avec un mot sur le contexte et l'issue envisagée. Le staff indique alors ce que la créature peut ou ne peut pas faire, et peut choisir de la jouer lui-même. En dehors de ce cadre, elles n'apparaissent que lors des événements officiels.",
          },
        ],
      },
      {
        id: "article-14",
        title: "Article 14 — Loyauté de jeu",
        clauses: [
          {
            num: "14.1",
            text: "Pas de god-mod : le personnage n'est ni invincible, ni omniscient, ni infaillible. Il rate des sorts, il se blesse, il a peur.",
          },
          {
            num: "14.2",
            text: "Pas de power-play : on ne décide pas de l'effet de son sort sur le personnage d'autrui. On écrit la tentative ; le partenaire écrit la conséquence.",
          },
          {
            num: "14.3",
            text: "Pas de méta-jeu : ce que le joueur sait (par la messagerie, le forum, une autre scène) n'est pas ce que le personnage sait.",
          },
          {
            num: "14.4",
            text: "Un personnage de première année ne maîtrise pas la magie de septième année. La progression RP suit la progression du compte : les sorts, les zones du château et les matières accessibles à un personnage sont ceux de son année en cours, et se débloquent au passage à l'année suivante.",
          },
          {
            num: "14.5",
            text: "Les échecs sont encouragés. Un personnage qui perd un duel, rate un examen ou se trompe fait avancer l'histoire plus qu'un personnage parfait.",
          },
        ],
      },
      {
        id: "article-15",
        title: "Article 15 — Consentement entre joueurs",
        clauses: [
          {
            num: "15.1",
            text: "Toute scène impliquant plusieurs personnages se joue avec l'accord de tous les joueurs concernés, sur les grandes lignes comme sur les limites.",
          },
          {
            num: "15.2",
            text: "L'accord préalable n'est exigé que pour ce qui laisse une trace durable sur le personnage d'autrui : blessure grave ou séquelle, malédiction, emprise ou manipulation mentale, atteinte lourde à sa réputation, tout ce dont il ne se relève pas à la fin de la scène. En revanche, les frictions ordinaires de la vie scolaire n'ont pas à être négociées à l'avance : une dispute, une moquerie, une rivalité, un mensonge, une trahison, un secret révélé, un coup qui part. C'est la matière même des intrigues, et demander une autorisation pour chaque tension tuerait la spontanéité des scènes. La règle 14.2 reste le garde-fou : on écrit la tentative, le partenaire écrit la conséquence.",
          },
          {
            num: "15.3",
            text: "La mort d'un personnage ne peut jamais être imposée. Seul son joueur peut en décider, et cette décision se valide avec l'administration.",
          },
          {
            num: "15.4",
            text: "Chaque joueur peut indiquer ses limites d'écriture sur son profil (thèmes qu'il ne souhaite pas aborder). Ces limites sont opposables à tous et n'ont pas à être justifiées.",
          },
          {
            num: "15.5",
            text: "Un joueur peut demander à tout moment de réorienter ou d'interrompre une scène qui le met mal à l'aise. Cette demande se respecte sans discussion et sans reproche.",
          },
        ],
      },
      {
        id: "article-16",
        title: "Article 16 — Ton et thèmes matures",
        clauses: [
          {
            num: "16.1",
            text: "Le site vise une ambiance sombre, mystérieuse et inquiétante. La violence gratuite, le gore complaisant et l'horreur graphique ne servent pas cette ambiance.",
          },
          {
            num: "16.2",
            text: "Les thèmes difficiles (deuil, peur, disparitions, rejet, emprise) sont autorisés et font partie de l'univers, mais se traitent avec retenue : on suggère plus qu'on ne montre.",
          },
          {
            num: "16.3",
            text: "Toute scène abordant un thème sensible doit porter un avertissement en tête de post (ex. [TW : violence]).",
          },
          {
            num: "16.4",
            text: "Fondu au noir obligatoire dès qu'une scène glisse vers l'intime. Voir également les articles 3.3 et 3.4, qui priment sur toute autre disposition.",
          },
          {
            num: "16.5",
            text: "Le site ne met en scène ni automutilation, ni suicide, ni conduite addictive comme ressort dramatique.",
          },
        ],
      },
      {
        id: "article-17",
        title: "Article 17 — Rythme et scènes en cours",
        clauses: [
          {
            num: "17.1",
            text: "Un délai raisonnable entre deux réponses est de 7 jours. Au-delà, prévenir son partenaire.",
          },
          {
            num: "17.2",
            text: "Une scène sans réponse depuis un mois peut être clôturée par un modérateur ; les points acquis restent acquis.",
          },
          {
            num: "17.3",
            text: "Le nombre de scènes simultanées est limité à trois pour garantir un rythme tenable. Cette limite passe à cinq à partir de la troisième année.",
          },
          {
            num: "17.4",
            text: "Abandonner une scène sans un mot est le principal irritant de la vie d'un forum RP. Un message d'une ligne suffit à éviter le problème.",
          },
        ],
      },
      {
        id: "article-18",
        title: "Article 18 — Progression et points",
        clauses: [
          {
            num: "18.1",
            text: "Les points s'obtiennent par la participation aux cours (quiz, contributions RP), la présence aux événements et la qualité d'écriture.",
          },
          {
            num: "18.2",
            text: "Ces points alimentent la progression individuelle et le compteur de la maison pour le tournoi inter-maisons.",
          },
          {
            num: "18.3",
            text: "Une année scolaire dure six mois en temps réel. Elle se clôt à une date d'épreuves finales commune à tout le site, annoncée à l'avance dans le calendrier.",
          },
          {
            num: "18.4",
            text: "À cette date, tout élève remplissant les conditions requises passe à l'année suivante. Le passage débloque de nouveaux sorts, de nouvelles zones du château et de nouvelles matières.",
          },
          {
            num: "18.5",
            text: "Un élève qui n'a pas atteint les conditions requises redouble : il reste dans son année et retentera les épreuves à la session suivante, six mois plus tard. Le redoublement n'est pas une sanction, seulement la conséquence d'un rythme de jeu plus lent — le personnage garde ses acquis, ses relations et ses scènes en cours. (Conditions de passage précises à définir.)",
          },
          {
            num: "18.6",
            text: "Le multi-comptage, la triche aux quiz et le gonflage artificiel de posts (remplissage, copier-coller, texte hors sujet) entraînent la perte des points concernés et un avertissement.",
          },
          {
            num: "18.7",
            text: "Le calendrier scolaire est commun à tous : mêmes trimestres, mêmes événements, même session d'épreuves. La progression dans les cours reste au rythme de chacun à l'intérieur de cette fenêtre de six mois.",
          },
        ],
      },
      {
        id: "article-19",
        title: "Article 19 — Sanctions in-game",
        clauses: [
          {
            num: "19.1",
            text: "Une entorse légère au règlement RP peut être traitée dans la fiction : retenue, retrait de points de maison, convocation chez un professeur. C'est la sanction préférée, parce qu'elle nourrit l'histoire au lieu de l'interrompre.",
          },
          {
            num: "19.2",
            text: "Une infraction répétée ou grave bascule sur l'échelle de sanctions de l'article 8.3.",
          },
          {
            num: "19.3",
            text: "Un post non conforme (longueur, langue, contenu interdit) peut être masqué le temps d'une correction. Le joueur en est informé et dispose de sept jours pour corriger.",
          },
        ],
      },
    ],
  },
];

export const CHARTE = {
  rune: "ᛖᛁᚦᚱ",
  title: "En résumé — la charte du joueur de Ravenshallow",
  items: [
    "Je respecte les personnes derrière les personnages.",
    "Je n'impose à un autre joueur rien dont son personnage ne se relève pas : ni blessure durable, ni emprise, ni mort.",
    "Je respecte le lore, la carte et les limites de mon année d'étude.",
    "Je laisse mon personnage échouer, avoir peur et se tromper.",
    "Je préviens quand je pars, je réponds quand on m'attend.",
    "Je signale plutôt que je ne règle mes comptes.",
    "Je me souviens que tout cela n'est qu'une histoire que nous écrivons ensemble.",
  ],
};

export const REGLEMENT_FOOTER =
  "Règlement en vigueur — Ravenshallow, Côte Nordique.";
