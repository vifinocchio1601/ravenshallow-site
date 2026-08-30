-- La grève quitte le pied de la falaise pour la baie de Kaldvik.
--
-- Première correction de la relecture des alentours, décision du joueur du
-- 30 août 2026 — et elle ne se voyait pas en lisant le texte. Il fallait
-- ouvrir la carte.
--
-- ── Ce qui n'allait pas ──
--
-- « La grève, sous la falaise » décrivait une bande de galets au pied du
-- château, découverte à marée basse, où l'on descendait « par une faille où
-- l'on ne passe qu'un par un ».
--
-- La carte ne porte aucune grève à cet endroit : sous le château, la mer bat
-- directement la roche, entre les récifs. Et surtout, la bible (§3) place la
-- grotte scellée « à flanc de falaise, accessible seulement par la mer ou par
-- un passage escarpé, juste en dessous du château », difficile d'accès « par
-- la marée, l'éboulement ». Le texte ouvrait donc un lieu de jeu libre au pied
-- de la falaise, avec une descente par une faille et un accès qui dépend de la
-- marée : **le chemin de la grotte, décrit sans la nommer.**
--
-- Une description de lieu ne nomme ni la grotte ni le sceau — celle-ci ne les
-- nommait pas, et y menait quand même. C'est la même leçon que les
-- souterrains, où l'interdit rappelé désignait l'endroit : **on ne construit
-- pas non plus la porte à côté du verrou.**
--
-- ── Ce qui change ──
--
-- Le texte était bon, c'est son emplacement qui ne l'était pas : le bois
-- flotté et les filets perdus sont même mieux à leur place dans une baie de
-- pêcheurs. La grève rejoint donc Kaldvik, sa descente par la faille disparaît
-- — on y arrive par le rivage — et son nom cesse de désigner la falaise.
--
-- Le slug ne bouge pas : `la-greve` était déjà générique, et aucune scène
-- n'existe encore dans aucun lieu des alentours. Rien ne se perd.

-- ─────────────────────────────────────────────────────────────
-- 1 — Faire de la place à Kaldvik : la grève se range juste après les quais,
--     parce qu'elle est le rivage, avant que le village ne monte.
-- ─────────────────────────────────────────────────────────────

UPDATE "sections"
SET "ordre" = "ordre" + 1
WHERE "espaceId" = (SELECT "id" FROM "espaces" WHERE "cle" = 'alentours')
  AND "parentId" = (
    SELECT "id" FROM "sections"
    WHERE "slug" = 'kaldvik'
      AND "espaceId" = (SELECT "id" FROM "espaces" WHERE "cle" = 'alentours')
  )
  AND "ordre" >= 2;

-- ─────────────────────────────────────────────────────────────
-- 2 — La grève change de zone, de nom et de texte.
-- ─────────────────────────────────────────────────────────────

UPDATE "sections"
SET
  "parentId" = (
    SELECT "id" FROM "sections"
    WHERE "slug" = 'kaldvik'
      AND "espaceId" = (SELECT "id" FROM "espaces" WHERE "cle" = 'alentours')
  ),
  "ordre" = 2,
  "nom" = 'La grève',
  "description" = 'Passé le dernier ponton, là où la baie se referme sur la roche noire, une bande de galets que la mer découvre à marée basse et reprend six heures plus tard. Le bois flotté s’y entasse, les filets perdus aussi, et de temps à autre quelque chose que les pêcheurs remontent sans le regarder de trop près. À marée haute il n’en reste rien : on attend, ou l’on renonce.',
  "majLe" = NOW()
WHERE "slug" = 'la-greve'
  AND "espaceId" = (SELECT "id" FROM "espaces" WHERE "cle" = 'alentours');

-- ─────────────────────────────────────────────────────────────
-- 3 — Refermer le trou laissé dans « La falaise et la mer ».
--
-- Il n'y reste que trois lieux : le chemin escarpé, le sentier des corniches,
-- et le large. Un ordre qui saute de 2 à 4 se relit mal le jour où l'on
-- voudra insérer quelque chose entre les deux.
-- ─────────────────────────────────────────────────────────────

UPDATE "sections"
SET "ordre" = 3
WHERE "slug" = 'le-large-et-les-epaves'
  AND "espaceId" = (SELECT "id" FROM "espaces" WHERE "cle" = 'alentours');
