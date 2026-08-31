import reglages from "@/config/veille.json";

/**
 * Les mesures de la ronde — et rien que des mesures.
 *
 * ── Ce qui est ici, et ce qui n'y est pas ──
 *
 * Le partage est celui que le projet applique déjà aux dix lignes d'un post :
 * « une ligne vaut 80 caractères » est un réglage et vit dans un JSON, « il en
 * faut dix » est l'article 12.2 et vit dans le code.
 *
 * Ici donc : ce qui s'ajuste après avoir vu de vraies rondes — un seuil de
 * lenteur, une durée maximale, un écart jugé notable.
 *
 * ⚠️ **Les durées du RÈGLEMENT ne sont pas là.** Un mois d'inactivité
 * (art. 7.2), trois mois (art. 7.3), un mois sans réponse dans une scène
 * (art. 17.2), sept jours pour corriger un post masqué (art. 19.3) : ce sont
 * des règles écrites par le joueur, pas des boutons. Elles vivent dans
 * `constantes.ts`, en clair, avec le numéro de leur article. Les glisser ici
 * les rendrait modifiables par mégarde, et un rapport qui appliquerait deux
 * mois là où le règlement en dit un serait faux sans que rien ne le signale.
 */

/** Au-delà, la page est lente : on le note, sans crier. */
export const REPONSE_LENTE_MS: number = reglages.reponseLenteMs;

/** Au-delà, c'est une anomalie : personne n'attend huit secondes. */
export const REPONSE_TRES_LENTE_MS: number = reglages.reponseTresLenteMs;

/** Le temps qu'on laisse à une page avant de la déclarer muette. */
export const DELAI_PAR_PAGE_MS: number = reglages.delaiParPageMs;

/**
 * La durée maximale d'une ronde.
 *
 * ⚠️ **Ce n'est pas le `timeout-minutes` du workflow**, qui est un filet et
 * tue le travail sans rien envoyer. Celui-ci est tenu par la ronde elle-même :
 * elle arrête les collecteurs restants et **envoie ce qu'elle a**.
 */
export const DUREE_MAX_RONDE_MS: number = reglages.dureeMaxRondeMs;

/** L'écart, en pourcentage, à partir duquel un chiffre mérite un mot. */
export const ECART_NOTABLE_POURCENT: number = reglages.ecartNotableEnPourcent;

/**
 * En dessous de ce nombre, un écart en pourcentage ne veut rien dire.
 *
 * Passer de 1 post à 3 est une hausse de 200 % qui n'apprend rien à personne.
 * Sur un forum qui démarre, sans ce plancher le rapport crierait tous les
 * matins — et l'on cesserait de le lire, ce qui est le seul vrai risque.
 */
export const PLANCHE_POUR_L_ECART: number = reglages.planchePourLEcart;

/** Sur combien de jours la moyenne se calcule. */
export const JOURS_D_HISTORIQUE: number = reglages.joursDHistorique;

/** Au-delà, une erreur enregistrée est effacée. */
export const RETENTION_ERREURS_JOURS: number = reglages.retentionErreursJours;

/** Deux ou trois pistes, jamais une liste. */
export const SUGGESTIONS_MAX: number = reglages.suggestionsMax;

/** Combien de familles d'erreurs le rapport détaille avant de résumer. */
export const ERREURS_DETAILLEES_MAX: number = reglages.erreursDetailleesMax;

/**
 * Au-delà, un dossier accepté qui n’a toujours ni maison ni baguette mérite
 * un mot.
 *
 * ⚠️ **Ce n’est pas une règle du règlement**, et c’est pourquoi elle est ici :
 * rien n’oblige un élève à passer au Miroir dans la quinzaine. Mais un dossier
 * accepté depuis un mois qui n’a jamais franchi ses premiers pas est le signe
 * d’un joueur perdu — ou d’un écran qui ne s’ouvre pas.
 */
export const PREMIERS_PAS_EN_ATTENTE_JOURS: number =
  reglages.premiersPasEnAttenteJours;
