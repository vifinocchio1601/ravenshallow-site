import { ADRESSE_DU_SITE } from "./bannieres";
import {
  DEMANDES_PAR_HEURE,
  MESSAGE_DEMANDE_MAX,
  MESSAGE_DEMANDE_MIN,
} from "./limites";

/**
 * **Tous les textes du partenariat** — la page publique et l'écran
 * d'administration.
 *
 * La page est la seule du site qui s'adresse à quelqu'un qui ne joue pas ici
 * et n'y jouera peut-être jamais : elle parle à une administration voisine.
 * Le vouvoiement y remplace donc le tutoiement de la vitrine, qui s'adresse à
 * un futur joueur.
 */

/**
 * **Ce que Ravenshallow est, en trois lignes** — le texte qu'un partenaire
 * colle chez lui.
 *
 * ⚠️ **Il ne nomme ni la grotte ni le sceau**, comme les vingt-cinq
 * descriptions de lieux. La formule reprise est celle de la page d'accueil —
 * « ce que quatre fondateurs ont juré de garder scellé » —, qui dit qu'il y a
 * quelque chose sans dire où le chercher. Un texte promotionnel voyage plus
 * loin qu'une description de pièce : c'est le dernier endroit où en dire trop.
 */
const PRESENTATION = [
  "Ravenshallow — école de magie, côte de Norvège.",
  "",
  "Un château dressé à flanc de falaise, entre mer, lac et forêt sombre, où l’on enseigne encore ce que quatre fondateurs ont juré de garder scellé. Quatre maisons, sept années de cours, un tournoi entre maisons, et une côte où l’on ne s’aventure pas seul.",
  "",
  "Forum de jeu de rôle textuel francophone, réservé aux seize ans et plus.",
  ADRESSE_DU_SITE,
].join("\n");

export const TEXTES_PARTENARIAT = {
  meta: {
    titre: "Partenariat — Ravenshallow",
    description:
      "Nos bannières, notre présentation, et de quoi nous proposer un échange de liens. Ravenshallow est un forum de jeu de rôle textuel francophone.",
  },

  entete: {
    rune: "ᚷᛖᛒᛟ",
    eyebrow: "Partenariat",
    titre: "Échanger nos bannières",
    chapeau:
      "Vous tenez un forum, et vous cherchez des voisins. Nous aussi. Tout ce qu’il faut pour nous afficher chez vous est sur cette page — et le formulaire du bas suffit à nous le proposer.",
    retour: "Retour à l’accueil",
  },

  presentation: {
    titre: "Nous, en trois lignes",
    chapeau:
      "À coller dans votre bloc de partenaires, tel quel ou raccourci comme il vous arrange.",
    /** L'étiquette du bloc ne répète pas le titre de la section : deux fois
        la même phrase à trois lignes d'écart se lit comme une erreur. */
    etiquette: "Texte de présentation",
    texte: PRESENTATION,
  },

  bannieres: {
    titre: "Nos bannières",
    chapeau:
      "Trois formats, aux tailles habituelles des blocs de liens. Le code est donné en HTML et en BBCode : prenez celui que votre forum accepte.",
    apercu: "Aperçu",
    adresse: "Adresse de l’image",
    html: "HTML",
    bbcode: "BBCode",
    /** Le nom accessible du bouton porte ce qu'il copie, jamais « Copier ». */
    copier: "Copier {quoi}",
    copie: "Copié",
    /** Le navigateur a refusé l'accès au presse-papiers : le champ reste là. */
    copieImpossible: "Sélectionnez le texte pour le copier",
  },

  conditions: {
    titre: "Ce que nous demandons",
    chapeau:
      "Rien d’inhabituel, et rien qui coûte : le partenariat est un échange, pas un contrat.",
    points: [
      "Un forum de jeu de rôle en français, ouvert et vivant.",
      "Un lien retour vers Ravenshallow dans votre bloc de partenaires. C’est tout ce que l’échange demande.",
      "Rien d’illégal, rien de haineux, et aucun contenu réservé aux adultes en accès libre : le château est ouvert aux seize ans et plus.",
      "Pas de démarchage de nos membres en messagerie privée — c’est l’article 3.6 de notre règlement. Un partenariat se noue entre administrations, et la porte est grande ouverte de ce côté-là.",
    ],
    /** Ni promesse de délai, ni promesse de réponse à tous : on n'en tient aucune. */
    reponse:
      "Nous répondons à chaque demande, par courriel, à l’adresse que vous laissez.",
  },

  /**
   * Les annuaires. **Ce ne sont pas des partenaires**, et la page les range à
   * part : un annuaire ne nous affiche pas parce qu'on l'affiche, il classe des
   * forums au nombre de voix. Les confondre ferait passer un vote pour un
   * échange.
   */
  annuaires: {
    titre: "Nous donner de la voix",
    chapeau:
      "Sans partenariat, sans compte, et en un clic : un vote fait remonter le forum dans les annuaires, et c’est par là qu’arrive une bonne part des joueurs.",
    forumRpg: {
      /** Le lien et l'image viennent de l'annuaire : on ne les réécrit pas. */
      url: "https://www.forumrpg.fr/vote/ravenshallow-ecole-de-magie-ez646h",
      image: "https://www.forumrpg.fr/assets/mainLogo-DXM7fhnO.png",
      titre: "Voter pour Ravenshallow - École de magie",
      alt: "Voter pour Ravenshallow - École de magie sur Forum RPG Portal",
      legende: "Forum RPG Portal — un vote par jour et par personne.",
    },
  },

  partenaires: {
    titre: "Nos partenaires",
    chapeau: "Les forums avec lesquels nous échangeons nos bannières.",
    /**
     * Le jour de l'ouverture, le bloc est vide — et il le dit. Un cadre vide
     * sans un mot se lit comme une panne d'affichage.
     */
    aucun:
      "Aucun pour l’instant : le château vient d’ouvrir ses portes. La vôtre serait la première bannière du mur.",
    visiter: "Ouvrir {nom} dans un nouvel onglet",
    depuis: "Partenaires depuis le {jour}",
  },

  demande: {
    titre: "Nous proposer un partenariat",
    chapeau:
      "Quatre champs, et nous vous répondons. Vous pouvez aussi passer par notre Discord, si vous préférez parler avant d’écrire.",
    champs: {
      nom: "Le nom de votre forum",
      nomAide: "Tel qu’il s’écrit chez vous.",
      url: "Son adresse",
      urlAide: "Complète, en https — c’est le lien que nous afficherons.",
      courriel: "Votre adresse de courriel",
      courrielAide:
        "Elle ne sert qu’à vous répondre, et n’est jamais affichée nulle part.",
      message: "Votre mot",
      messageAide: `Ce que vous jouez, ce que vous cherchez, où vous nous afficheriez. Entre ${MESSAGE_DEMANDE_MIN} et ${MESSAGE_DEMANDE_MAX} signes.`,
      /**
       * Le pot de miel. **Son libellé doit rester crédible pour un robot** —
       * un champ nommé « ne_pas_remplir » se contourne en une ligne. Il est
       * caché à l'œil et retiré de l'ordre de tabulation, et un lecteur
       * d'écran s'entend dire de le laisser vide.
       */
      pot: "Votre site web",
      potAide: "Laissez ce champ vide.",
    },
    /**
     * ⚠️ **L'information est donnée AU MOMENT de la saisie**, et pas seulement
     * dans une page qu'il faudrait penser à ouvrir. C'est là que la loi la
     * veut, et c'est déjà ce que fait le formulaire du dossier d'admission.
     */
    confidentialite:
      "Ce que vous écrivez ici ne sert qu’à vous répondre et à tenir la trace de l’échange. Aucune adresse IP n’est conservée.",
    confidentialiteLien: "Ce que le site garde",
    bouton: "Envoyer la demande",
    envoi: "Envoi…",
    envoye:
      "C’est parti. Nous vous répondons à l’adresse que vous avez laissée — et sans faire attendre trois semaines.",
    discord: "Nous écrire sur Discord",
  },

  erreurs: {
    nomVide: "Le nom de votre forum, s’il vous plaît.",
    nomTropLong: "Ce nom dépasse {max} signes.",
    urlVide: "L’adresse de votre forum, s’il vous plaît.",
    urlIllisible:
      "Cette adresse ne ressemble à rien de joignable. Elle doit commencer par https:// — par exemple https://votre-forum.com",
    urlTropLongue: "Cette adresse dépasse {max} signes.",
    courrielVide: "Une adresse de courriel, pour que nous puissions répondre.",
    courrielIllisible:
      "Cette adresse de courriel ne semble pas valide. Vérifiez-la, elle est notre seul moyen de vous joindre.",
    messageVide: "Un mot, même court, sur votre forum.",
    messageTropCourt: "Un peu plus long, s’il vous plaît — {min} signes au moins.",
    messageTropLong: "Ce message dépasse {max} signes.",
    banniereIllisible:
      "L’adresse de la bannière doit commencer par https:// , ou rester vide.",
    descriptionTropLongue: "Cette description dépasse {max} signes.",
    dateRequise: "La date à laquelle le partenariat a été noué.",
    dateIllisible: "Cette date ne se lit pas.",
    dejaPartenaire:
      "Ce forum figure déjà au bloc des partenaires. Corrigez la ligne existante plutôt que d’en ajouter une seconde.",
    introuvable: "Ce partenaire n’existe pas, ou plus.",
    /**
     * ⚠️ **Le plafond n'est pas un refus**, et le texte doit le dire : ce qui
     * est refusé ne partira jamais, ceci partira dans un moment. C'est la
     * leçon d'`ATTENDRE` dans la Tour aux Corbeaux, et du frein du salon.
     */
    tropDeDemandes: `Le formulaire a reçu beaucoup d’envois dans l’heure — il n’en accepte pas plus de ${DEMANDES_PAR_HEURE}. Réessayez tout à l’heure, ou écrivez-nous sur Discord, qui est toujours ouvert.`,
    /** Ce que voit un robot. Pas d'explication : il n'y a personne à informer. */
    refuse: "Cette demande n’a pas pu être envoyée.",
  },

  administration: {
    metaTitre: "Partenaires — Administration Ravenshallow",
    eyebrow: "Le bloc de liens",
    titre: "Partenaires",
    accroche:
      "Les forums affichés sur la page publique de partenariat, et les demandes qui arrivent par son formulaire.",
    rappel:
      "Retirer un partenaire ne l’efface pas : sa ligne reste, et « Remettre » existe pour le cas où le clic était malheureux.",
    lienPublic: "Voir la page publique",

    formulaire: {
      titre: "Ajouter un partenaire",
      enregistrer: "Corriger ce partenaire",
      nom: "Nom du forum",
      url: "Adresse (https)",
      banniere: "Adresse de leur bannière (facultative)",
      banniereAide:
        "L’image reste chez eux : elle disparaîtra du bloc le jour où leur hébergeur fermera. Sans bannière, la ligne s’affiche en lien.",
      description: "Une ligne pour dire ce qu’on y joue (facultative)",
      noue: "Partenariat noué le",
      poser: "Ajouter au bloc",
      corriger: "Enregistrer",
      annuler: "Annuler la correction",
    },

    liste: {
      titre: "Le bloc",
      aucun: "Aucun partenaire pour l’instant.",
      retire: "Retiré le {jour}",
      modifie: "Modifié le {jour}",
      noue: "Noué le {jour}",
      corriger: "Corriger",
      retirer: "Retirer du bloc",
      remettre: "Remettre au bloc",
      /** Les noms accessibles sont entiers : dans une liste de vingt lignes,
          « Retirer » ne dit pas laquelle. */
      corrigerAria: "Corriger {nom}",
      retirerAria: "Retirer {nom} du bloc",
      remettreAria: "Remettre {nom} au bloc",
    },

    demandes: {
      titre: "Demandes reçues",
      aucune: "Aucune demande pour l’instant.",
      enAttente: "En attente",
      acceptee: "Acceptée",
      refusee: "Refusée",
      recueLe: "Reçue le {jour}",
      traiteeLe: "Traitée le {jour}",
      accepter: "Marquer acceptée",
      refuser: "Marquer refusée",
      rouvrir: "Remettre en attente",
      /**
       * Marquer une demande acceptée **n'ajoute pas** le partenaire : la ligne
       * du bloc se saisit à part. Deux gestes, parce qu'une demande porte ce
       * qu'ils ont écrit, et le bloc ce que nous affichons — et les deux ne
       * disent presque jamais la même chose.
       */
      rappel:
        "Marquer une demande acceptée ne l’ajoute pas au bloc : c’est un geste à part, au formulaire ci-dessus. La demande porte ce qu’ils ont écrit ; le bloc porte ce que nous affichons.",
      reprendre: "Reprendre dans le formulaire",
      ecrire: "Écrire à {nom}",
      accepterAria: "Marquer la demande de {nom} comme acceptée",
      refuserAria: "Marquer la demande de {nom} comme refusée",
      rouvrirAria: "Remettre la demande de {nom} en attente",
      reprendreAria: "Reprendre {nom} dans le formulaire d’ajout",
      ouvrir: "Ouvrir {nom} dans un nouvel onglet",
    },

    /** La carte du tableau de bord de `/admin`. */
    carte: {
      rune: "ᚷᛖᛒ",
      eyebrow: "Recrutement",
      titre: "Partenaires",
      accroche:
        "Les forums avec lesquels nous échangeons nos bannières, et les demandes qui arrivent par la page publique.",
      lien: "Ouvrir les partenaires",
      /** ⚠️ Zéro et un sont au singulier en français. C'est la faute que
          tout le monde fait, et elle se voit sur un tableau de bord. */
      uneEnAttente: "1 demande en attente",
      enAttente: "{n} demandes en attente",
    },

    /** « L'Administration » — la zone d'administration n'a pas de comptes. */
    posePar: "L’administration",
  },
} as const;
