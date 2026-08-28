/**
 * **Les plafonds d'un partenariat**, alignés sur les contraintes `CHECK` de
 * `20260828190000_partenariats`.
 *
 * Séparés des textes pour la même raison que ceux d'un événement : le champ de
 * saisie a besoin de connaître la longueur maximale, et rien d'autre.
 */

/** Le nom d'un forum. « Les Chroniques de quelque chose de très long » tient. */
export const NOM_FORUM_MAX = 80;

/** Une adresse de forum. Les adresses de Forumactif sont courtes ; d'autres non. */
export const URL_MAX = 300;

/** L'adresse de leur bannière, souvent longue — les hébergeurs d'images signent. */
export const BANNIERE_URL_MAX = 400;

/** Une ligne pour dire ce qu'on y joue. */
export const DESCRIPTION_PARTENAIRE_MAX = 300;

/** Une adresse de courriel. */
export const COURRIEL_MAX = 200;

/**
 * Le message d'une demande.
 *
 * ⚠️ **Un minimum, et il est bas.** Vingt signes écartent le champ rempli d'un
 * point par un robot, sans obliger personne à rédiger : « Partenariat ? Notre
 * forum vous plaira » en fait cinquante. Un minimum haut ferait fuir la
 * demande courte et honnête, qui est la plus fréquente.
 */
export const MESSAGE_DEMANDE_MIN = 20;
export const MESSAGE_DEMANDE_MAX = 2000;

/**
 * **Le frein anti-spam**, et il tient en trois nombres.
 *
 * C'est le seul formulaire du site ouvert à qui n'a pas de compte : sans lui,
 * un robot déposerait trois mille lignes dans la nuit et l'écran
 * d'administration deviendrait inutilisable.
 *
 * ⚠️ **Aucune adresse IP n'entre là-dedans**, pas même sous forme
 * d'empreinte : la politique de confidentialité écrit que le site n'en
 * conserve pas, et une page légale fausse est pire qu'absente. Le plafond est
 * donc **global** — un robot acharné peut fermer le formulaire une heure, et
 * la page dit alors d'écrire sur Discord. Le compromis est assumé : un forum
 * de jeu de rôle reçoit deux demandes par mois, pas deux par minute.
 */
export const DEMANDES_PAR_HEURE = 10;

/**
 * Le temps qu'il faut, au minimum, pour remplir quatre champs.
 *
 * Un robot poste dans la seconde ; un humain met une demi-minute. Trois
 * secondes n'arrêtent personne de réel et écartent l'envoi automatique — c'est
 * le pendant du pot de miel, qui attrape l'autre moitié.
 */
export const DELAI_MINIMAL_MS = 3000;
