/**
 * **Qui peut retirer quoi, et à quelles conditions.**
 *
 * Le calcul est **pur** : il reçoit un état, ne lit ni base ni horloge, et se
 * teste donc cas par cas. Le dépôt lui fournit les faits, l'écran lui demande
 * quoi proposer — et les deux obtiennent la même réponse, ce qui est tout
 * l'intérêt : un bouton offert que la route refuserait serait pire qu'un
 * bouton absent.
 *
 * ── Le principe, et il vient du règlement ──
 *
 * L'article 2.4 conserve les écrits RP partagés « pour ne pas mutiler les
 * histoires des autres », et l'article 6.4 laisse chacun propriétaire de ses
 * textes. Les deux se concilient ainsi : **on peut retirer ce qui n'est qu'à
 * soi ; dès qu'un autre a écrit, on ne peut plus que clore.**
 *
 * Le staff, lui, passe outre — mais jamais sans dire pourquoi, et jamais sans
 * que ceux qui y ont écrit l'apprennent.
 */

/** Ce qui empêche de retirer, et qu'il faut pouvoir dire en français. */
export type RaisonDeRefus =
  /** Ce n'est pas à moi, et je ne suis pas du staff. */
  | "PAS_A_MOI"
  /** Quelqu'un d'autre y a écrit : sa part ne m'appartient pas. */
  | "DEJA_ECRIT_PAR_D_AUTRES"
  /** Le post porte déjà une réponse : le retirer troue la scène. */
  | "DEJA_REPONDU_APRES";

export type VerdictScene =
  | { peut: false; raison: RaisonDeRefus }
  | {
      peut: true;
      /** Le staff doit dire pourquoi ; un auteur chez lui n'a rien à justifier. */
      motifRequis: boolean;
      /** Faut-il prévenir ceux qui y ont écrit ? Jamais quand on est seul. */
      previendra: boolean;
    };

/**
 * Ce que le dépôt sait d'une scène au moment où on demande à la retirer.
 *
 * `auteursAutres` porte les **auteurs distincts** des posts qui ne sont pas
 * du demandeur — pas le nombre de posts : quelqu'un qui a répondu six fois
 * n'est prévenu qu'une.
 */
export type EtatScene = {
  estStaff: boolean;
  estLAuteur: boolean;
  /** Combien d'autres membres ont écrit dans la scène. */
  auteursAutres: number;
};

/**
 * Peut-on retirer cette scène ?
 *
 * **Le staff passe toujours**, et doit toujours motiver — même sur une scène
 * vide : la trace au journal ne se relit pas six mois plus tard sans elle.
 */
export function peutRetirerLaScene(etat: EtatScene): VerdictScene {
  if (etat.estStaff) {
    return { peut: true, motifRequis: true, previendra: etat.auteursAutres > 0 };
  }
  if (!etat.estLAuteur) return { peut: false, raison: "PAS_A_MOI" };
  if (etat.auteursAutres > 0) {
    return { peut: false, raison: "DEJA_ECRIT_PAR_D_AUTRES" };
  }
  return { peut: true, motifRequis: false, previendra: false };
}

/**
 * Faut-il proposer la clôture plutôt que le retrait ?
 *
 * Vraie dès qu'un autre a écrit — pour l'auteur, c'est **le seul geste qui
 * lui reste** ; pour le staff, c'est **presque toujours le bon** : clore
 * ferme la scène sans effacer le travail de plusieurs joueurs.
 *
 * L'écran s'en sert pour l'ordre des boutons, jamais pour interdire.
 */
export function mieuxVautClore(etat: EtatScene): boolean {
  return etat.auteursAutres > 0;
}

/** Ce que le dépôt sait d'un post au moment où son auteur veut le retirer. */
export type EtatPost = {
  estStaff: boolean;
  estLAuteur: boolean;
  /** Un post plus récent existe-t-il dans la même scène ? */
  aDesPostsApres: boolean;
};

export type VerdictPost =
  | { peut: false; raison: RaisonDeRefus }
  | {
      peut: true;
      /**
       * **Faut-il laisser la place ?** Oui dès qu'on a répondu après : une
       * réponse qui suit un trou ne se comprend plus. Non quand le post
       * fermait la scène — il s'en va sans laisser de vide à expliquer.
       *
       * La question se tranche **au moment du geste** et se garde en base :
       * la recalculer plus tard donnerait une autre réponse le jour où
       * quelqu'un écrit après coup, et le post reparaîtrait sous une autre
       * forme sans que personne l'ait demandé.
       */
      placeConservee: boolean;
    };

/**
 * Peut-on retirer ce post ?
 *
 * **Retirer n'est jamais refusé à son auteur** — ce qu'il a écrit est à lui
 * (art. 6.4). Ce qui change, c'est ce qu'il en reste à l'écran.
 *
 * Le staff ne passe **pas** par ici : masquer un post est un autre geste, qui
 * laisse le texte lisible à son auteur pour qu'il le reprenne (art. 19.3).
 * Confondre les deux ferait disparaître ce qu'on demandait de corriger.
 */
export function peutRetirerSonPost(etat: EtatPost): VerdictPost {
  if (!etat.estLAuteur) return { peut: false, raison: "PAS_A_MOI" };
  return { peut: true, placeConservee: etat.aDesPostsApres };
}
