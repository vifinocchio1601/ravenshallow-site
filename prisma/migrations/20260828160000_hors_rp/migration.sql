-- « Le monde des non-mages » devient l'espace hors RP.
--
-- ── Ce qui change, et pourquoi ──
--
-- L'espace `non-mages` a été posé le 26 août avec cette description :
--
--     « Ce qui se joue loin des falaises, chez ceux qui ne savent rien de la
--       magie. Aucune longueur minimale, aucun point. »
--
-- C'était du **jeu de rôle hors du château**, et ce texte-là n'a jamais été
-- tranché par le joueur : il venait de la migration du forum, pas de sa bible
-- ni de son règlement, qui ne parlent d'aucun espace non-mage.
--
-- Le 28 août 2026, il a décidé : **c'est l'espace HORS RP**. Le nom tient
-- debout tel quel — « le monde des non-mages » est celui d'où l'on parle
-- quand on n'est pas son personnage. Seule la description change.
--
-- ── Ce qui ne change pas, et c'est le point ──
--
-- Aucun paramètre de l'espace n'a besoin de bouger : ni ligne minimum, ni
-- points, ni décompte de scènes, ouvert à tout membre en lecture comme en
-- écriture, visible de tous. Il était déjà réglé pour ça.
--
-- ── Pourquoi le site en avait besoin ──
--
-- Deux textes du joueur le supposaient sans qu'il existe :
--
--   • l'article 12.3 — les échanges hors RP nourris « se poursuivent en
--     messagerie ou SUR LE FORUM » ;
--   • la bible — « Absence à signaler à partir de 2 semaines », et il n'y
--     avait nulle part où la signaler.
--
-- ── Un seul étage de sections ──
--
-- Pas de sous-sections, à la différence de l'école. Une aile du château
-- contient des pièces qui contiennent des scènes ; « Présentations » et
-- « Absences » sont des choses de même niveau, et un étage de plus n'ajouterait
-- que des clics.
--
-- ⚠️ **Les partenariats n'ont PAS de section ici**, et ce n'est pas un oubli :
-- tout le site est derrière la connexion, et une section que les forums
-- démarcheurs ne peuvent pas atteindre ne sert à personne. La bible en fait
-- pourtant une priorité de recrutement — cela demande une page publique sur la
-- vitrine, et c'est un autre chantier.

-- ─────────────────────────────────────────────────────────────
-- 1 — L'espace dit ce qu'il est.
-- ─────────────────────────────────────────────────────────────

UPDATE "espaces"
SET "description" = 'Le monde d’où l’on parle quand on n’est pas son personnage. Présentations, recherches de liens, absences, questions : ici on écrit en son nom, pas en celui de son élève. Aucune longueur minimale, aucun point.',
    "majLe" = NOW()
WHERE "cle" = 'non-mages';

-- ─────────────────────────────────────────────────────────────
-- 2 — Cinq sections, un seul étage.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections" ("id", "espaceId", "slug", "nom", "description", "ordre", "majLe") VALUES
  ('sec-hrp-presentations', 'espace-non-mages', 'presentations',
   'Présentations',
   'Qui êtes-vous, derrière votre personnage ? On n’attend ni roman ni curriculum : de quoi mettre un visage sur un nom, et savoir à qui l’on écrit. Chacun en dit ce qu’il veut, et rien de plus.',
   1, NOW()),

  ('sec-hrp-liens', 'espace-non-mages', 'recherche-de-liens',
   'Recherche de liens',
   'Une scène à proposer, un lien à nouer, une place à pourvoir dans l’histoire de votre personnage. C’est ici qu’on se trouve avant de se croiser dans un couloir — et le plus sûr moyen de ne pas jouer seul.',
   2, NOW()),

  ('sec-hrp-roles', 'espace-non-mages', 'demandes-de-roles',
   'Demandes de rôles',
   'Un poste au château, un personnage que quelqu’un cherche à faire vivre, une charge dont vous voudriez. Les postes réellement ouverts sont annoncés au Grand Hall ; ici, on demande et on en discute.',
   3, NOW()),

  ('sec-hrp-absences', 'espace-non-mages', 'absences-et-retours',
   'Absences et retours',
   'Prévenez quand vous partez, dites-le quand vous revenez. Au-delà de deux semaines de silence, l’annonce est attendue : elle protège vos scènes en cours, et évite qu’on vous croie parti pour de bon.',
   4, NOW()),

  ('sec-hrp-suggestions', 'espace-non-mages', 'suggestions-et-questions',
   'Suggestions et questions',
   'Ce qui manque, ce qui cloche, ce que vous n’avez pas compris. Une remarque de travers vaut mieux qu’un agacement gardé pour soi — et beaucoup de ce qui existe ici est venu d’une question posée en passant.',
   5, NOW());
