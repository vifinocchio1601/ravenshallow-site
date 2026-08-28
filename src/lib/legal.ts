/**
 * Les deux pages que la loi réclame, et que personne ne lit avant d’en avoir
 * besoin.
 *
 * Séparées du gabarit comme le règlement l’est : la page ne fait que mettre
 * cette structure en forme, et le texte se corrige sans toucher au code.
 *
 * **Ce qui s’y trouve n’est pas inventé.** L’essentiel découle du règlement
 * écrit par le joueur — l’âge d’entrée (art. 2.2), le sort des écrits d’un
 * partant (art. 2.5), le format des avatars (art. 6.2) — et de ce que le code
 * fait réellement, vérifié fichier par fichier le 27 août 2026. Ne pas y
 * ajouter une promesse que le site ne tient pas : une politique de
 * confidentialité fausse est pire qu’absente.
 */

export type SectionLegale = {
  titre: string;
  paragraphes: string[];
};

export type DocumentLegal = {
  rune: string;
  eyebrow: string;
  titre: string;
  chapeau: string;
  /** Affichée en clair, et portée par un `<time>` pour la machine. */
  miseAJour: string;
  sections: SectionLegale[];
};

/** Une seule adresse pour tout : signalements, droits, questions. */
export const CONTACT_LEGAL = "ravenshallow.rp@gmail.com";

/** Le jour où ces deux textes ont été arrêtés. */
const MISE_A_JOUR = "2026-08-27";

export const MENTIONS_LEGALES: DocumentLegal = {
  rune: "ᛗ",
  eyebrow: "Mentions légales",
  titre: "Qui tient ce château",
  chapeau:
    "Ravenshallow est un forum de jeu de rôle textuel amateur, gratuit et sans publicité. Il n’a aucune activité commerciale et ne vend rien.",
  miseAJour: MISE_A_JOUR,
  sections: [
    {
      titre: "L’éditeur",
      paragraphes: [
        "Le site est édité par un particulier, à titre personnel et non professionnel, sous le nom de Ravenshallow.",
        "La loi pour la confiance dans l’économie numérique permet à un éditeur non professionnel de ne pas publier son nom ni son adresse, à condition d’avoir communiqué son identité à son hébergeur. C’est le cas : elle est connue de la société mentionnée ci-dessous, qui la tient à la disposition des autorités.",
        "Directeur de la publication : l’administration de Ravenshallow.",
        `Contact : ${CONTACT_LEGAL}`,
      ],
    },
    {
      titre: "L’hébergement",
      paragraphes: [
        "Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com.",
        "Les données du site — comptes, fiches, messages, scènes — sont conservées dans une base hébergée par Neon, dont les serveurs se trouvent à Francfort, en Allemagne.",
        "Les courriels envoyés par le site partent par le service Gmail de Google.",
      ],
    },
    {
      titre: "Ce qui appartient à qui",
      paragraphes: [
        "L’univers de Ravenshallow — son nom, son monde, ses maisons, ses blasons, ses textes de présentation et son règlement — est l’œuvre de son auteur et ne peut être repris ailleurs sans son accord.",
        "Ce qu’écrit un membre reste le sien. En le publiant sur le site, il en autorise l’affichage ici, et rien de plus.",
        "Les images utilisées par les membres relèvent de l’article 6 du règlement : libres de droits, créditées, ou réalisées par eux. Les avatars sont des visages d’emprunt — photographies de célébrités majeures, images générées ou illustrations — jamais la photographie du joueur lui-même.",
      ],
    },
    {
      titre: "Signaler un contenu",
      paragraphes: [
        "Toute personne qui estime qu’un contenu publié ici porte atteinte à ses droits — une image, un texte, son image — peut écrire à l’adresse ci-dessus. Le signalement sera examiné et le contenu retiré s’il y a lieu.",
        "Les membres du site disposent en outre du signalement en un clic depuis la Tour aux Corbeaux et depuis le forum.",
      ],
    },
  ],
};

export const CONFIDENTIALITE: DocumentLegal = {
  rune: "ᛈ",
  eyebrow: "Données personnelles",
  titre: "Ce que le château garde de vous",
  chapeau:
    "Ce site conserve le moins de choses possible, et cette page dit lesquelles. Elle ne promet rien que le site ne fasse réellement.",
  miseAJour: MISE_A_JOUR,
  sections: [
    {
      titre: "Ce qui est conservé",
      paragraphes: [
        "Votre adresse de courriel, pour vous identifier, vous écrire et vous permettre de reprendre votre mot de passe.",
        "Votre mot de passe, sous une forme chiffrée à sens unique. Personne ne peut le lire, l’administration pas davantage que quiconque.",
        "Ce que vous écrivez : votre fiche de personnage, vos messages privés, vos publications sur le forum.",
        "La date de votre inscription, celle de l’acceptation de votre dossier, et les décisions prises sur votre compte.",
      ],
    },
    {
      titre: "Ce qui n’est pas conservé, et c’est délibéré",
      paragraphes: [
        "Votre âge réel. L’inscription le demande pour vérifier que vous avez 16 ans ou plus, puis ne garde que la réponse à cette question. Le nombre lui-même n’est jamais écrit nulle part.",
        "Votre adresse IP. Le site limite les tentatives de connexion, et pour cela il enregistre une empreinte illisible qui disparaît au bout d’une heure. On peut vérifier si une adresse connue a essayé ; on ne peut pas retrouver une adresse à partir de ce qui est conservé.",
        "Votre visage. L’avatar de votre personnage est un visage d’emprunt, jamais le vôtre.",
        "Rien d’autre. Le site n’emploie aucun outil de mesure d’audience, aucune régie publicitaire, aucun bouton de réseau social, et ne dépose aucun cookie publicitaire. Le seul cookie posé sert à vous garder connecté : il est indispensable au fonctionnement du site, et c’est pourquoi aucun bandeau ne vous demande de l’accepter.",
      ],
    },
    {
      titre: "Pourquoi, et à quel titre",
      paragraphes: [
        "Pour vous ouvrir un compte et vous laisser jouer : c’est l’objet même de votre inscription, et le règlement que vous avez approuvé en tient lieu d’accord.",
        "Pour la sécurité du site et la modération : empêcher les intrusions, traiter les signalements, appliquer les sanctions prévues au règlement. C’est l’intérêt légitime d’un espace où des gens se parlent.",
        "Pour vous écrire quand une décision vous concerne : acceptation du dossier, sanction, message masqué.",
      ],
    },
    {
      titre: "Qui y a accès",
      paragraphes: [
        "L’administration du site, pour ce qui touche à votre dossier, à votre compte et à ce que vous publiez sur le forum.",
        "Les autres membres, pour votre fiche de personnage. Elle est consultable dans le Registre par toute personne connectée et acceptée : nom, portrait, âge du personnage, maison, année, baguette, biographie, qualités, défauts, plus grande peur, et les thèmes que vous préférez éviter. C’est l’usage d’un forum de jeu de rôle — on lit la fiche d’un autre avant de lui écrire une scène. Ce que vous avez écrit dans la partie « hors RP » de votre dossier, en revanche, ne s’y trouve pas.",
        "Pas vos conversations privées. Aucun membre du staff ne peut ouvrir la Tour aux Corbeaux de quelqu’un d’autre : il n’existe aucun écran pour le faire, et le site est construit pour que ce chemin n’existe pas. Le seul cas où un message privé parvient à l’administration est celui où vous le lui transmettez vous-même par un signalement, et elle ne reçoit alors que la copie que vous lui envoyez.",
        "Les sociétés qui font tourner le site, et rien de plus : Vercel, qui l’héberge aux États-Unis ; Neon, qui garde la base en Allemagne ; Google, qui achemine les courriels. Aucune donnée n’est vendue, échangée ni transmise à un tiers.",
        "L’hébergement du site et l’envoi des courriels passent par des sociétés établies aux États-Unis. Vos données peuvent donc y transiter.",
        "Enfin, un membre peut illustrer un message avec une image hébergée ailleurs. En affichant la page, votre navigateur va la chercher chez cet hébergeur, qui voit alors votre adresse IP. Le site lui demande expressément de ne pas lui dire quelle page vous lisez, et n’a aucun autre échange avec lui — mais il ne peut pas empêcher ce contact, et il vaut mieux que vous le sachiez.",
      ],
    },
    {
      titre: "Combien de temps",
      paragraphes: [
        "Tant que votre compte vit, ce qu’il contient est conservé.",
        "Après trois ans sans aucune connexion, vous recevez un courriel. Sans réponse de votre part dans le mois qui suit, le compte est effacé.",
        "Les empreintes de tentatives de connexion disparaissent au bout d’une heure.",
        "Un signalement conserve une copie des messages visés, y compris si leur auteur les efface ensuite. C’est ce qui permet de traiter une plainte, et ce qui protège la personne qui l’a déposée.",
      ],
    },
    {
      titre: "Partir",
      paragraphes: [
        "Vous pouvez demander à tout moment la suppression de votre compte, en écrivant à l’adresse indiquée en bas de page.",
        "Ce que vous avez écrit dans des scènes partagées peut être conservé pour ne pas mutiler les histoires des autres joueurs — c’est l’article 2.5 du règlement. Dans ce cas, vos textes sont détachés de votre identité : votre nom n’y figure plus, et rien ne permet de remonter jusqu’à vous.",
        "Vos messages privés, votre fiche et votre adresse de courriel, eux, sont effacés.",
      ],
    },
    {
      titre: "Vos droits",
      paragraphes: [
        "Vous pouvez demander à voir ce que le site conserve de vous, à le faire corriger, à le faire effacer, à en obtenir une copie, ou à vous opposer à un traitement.",
        `Une seule adresse pour tout cela : ${CONTACT_LEGAL}. Il vous sera répondu dans un délai d’un mois.`,
        "Si la réponse ne vous satisfait pas, vous pouvez saisir la Commission nationale de l’informatique et des libertés — cnil.fr.",
      ],
    },
    {
      titre: "Les moins de 16 ans",
      paragraphes: [
        "Le site est réservé aux personnes de 16 ans et plus, en raison du ton visé et des thèmes abordés. C’est l’article 2.2 du règlement.",
        "Si vous constatez qu’un compte a été ouvert par une personne plus jeune, écrivez-nous : il sera fermé et ses données effacées.",
      ],
    },
    {
      titre: "Si cette page change",
      paragraphes: [
        "La date de dernière mise à jour figure en tête. Un changement qui vous concerne réellement vous sera annoncé sur le site, et non glissé en silence.",
      ],
    },
  ],
};
