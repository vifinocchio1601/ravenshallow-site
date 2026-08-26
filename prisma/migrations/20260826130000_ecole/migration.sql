-- L'école — l'intérieur du château.
--
-- Cinq sections, vingt pièces. Les lieux vivent en base et non dans le code :
-- une description se corrige sans toucher au moteur, et c'est le joueur qui
-- l'écrit.
--
-- ── Ce qui a été arbitré avant d'écrire ──
--
-- • « La Salle de Banquet » devient **La Grande Salle**. La bible du lore
--   (§12) arrête le vocabulaire — Grand Hall pour les annonces, Grande Salle
--   pour les élèves — et interdit explicitement d'introduire un troisième nom
--   proche. Validé par le joueur le 26 août 2026.
--
-- • **Les ailes est et ouest sont inversées** par rapport à la première liste.
--   La carte du domaine fait autorité (bible §2, art. 12.4) : la rose des vents
--   met la Mer du Nord à l'EST et la Forêt Sombre à l'OUEST. Les appariements
--   maison/vue, eux, étaient justes et n'ont pas bougé. Validé le même jour.
--
-- • **Les salles de cours ne figurent pas ici**, à dessein : elles viendront
--   avec le système de cours, qui est un chantier à part.
--
-- ── Les deux points sensibles ──
--
-- • **Les souterrains** rappellent l'article 13.1 en toutes lettres, et ne
--   disent RIEN de ce que le sceau retient. Le contenu de la grotte est
--   marqué « confidentiel staff » dans la bible (§3) et ne doit figurer dans
--   aucun document accessible aux joueurs — celui-ci en est un.
--
-- • **La Tour aux Corbeaux** est à la fois ce lieu-ci, dans l'aile de
--   Kaldrafn, et le nom de la messagerie du site. C'est voulu. Sa description
--   reste dans le monde : elle dit que tout le monde y monte, elle ne parle
--   pas du site.

-- ─────────────────────────────────────────────────────────────
-- 1 — Les cinq sections.
--
-- Aucune n'est réservée à une maison : ce sont les dortoirs qui le sont, pas
-- les ailes. On traverse l'aile de Nattorm pour aller à la bibliothèque.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections" ("id", "espaceId", "slug", "nom", "description", "ordre", "majLe") VALUES
  ('sec-tours-centrales', 'espace-domaine', 'tours-centrales',
   'Les Tours centrales',
   'Ce que tout le monde traverse, plusieurs fois par jour : la pierre creusée au milieu des marches, le bruit qui monte des cours, la cloche qu’on n’entend plus à force de l’entendre. Aucune maison n’y est chez elle, et c’est pour cela qu’on s’y croise.',
   1, NOW()),

  ('sec-aile-est', 'espace-domaine', 'aile-est',
   'L’aile est — face à la mer · Tideål',
   'Battue par les tempêtes. Le bruit des vagues sous les fenêtres, le sel qui blanchit les carreaux et qu’on ne finit jamais de gratter. On y dort mal les nuits de gros temps — et les Tideål prétendent que c’est là qu’on entend le mieux.',
   2, NOW()),

  ('sec-aile-ouest', 'espace-domaine', 'aile-ouest',
   'L’aile ouest — face à la forêt · Nattorm',
   'L’aile enclavée, celle où l’on ne passe pas par hasard : un seul couloir la dessert, et il ne mène nulle part ailleurs. Les fenêtres donnent sur la lisière, assez près pour distinguer les troncs un par un.',
   3, NOW()),

  ('sec-aile-sud', 'espace-domaine', 'aile-sud',
   'L’aile sud — vers la falaise · Bryggeld',
   'La plus chaude, la seule à recevoir un peu de soleil — quelques heures les bons jours. La pierre en garde la tiédeur jusqu’au soir, et c’est l’aile où l’on traîne quand il fait trop froid ailleurs.',
   4, NOW()),

  ('sec-aile-nord', 'espace-domaine', 'aile-nord',
   'L’aile nord — face aux plateaux de givre · Kaldrafn',
   'La plus froide et la plus haute. Les fenêtres y gèlent de l’intérieur en hiver, et l’on voit les Hauts Plateaux de Givre par-dessus la forêt. Beaucoup d’escaliers pour pas grand-chose, disent les autres maisons.',
   5, NOW());

-- ─────────────────────────────────────────────────────────────
-- 2 — Les Tours centrales : le cœur commun.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre", "anneeMinimale", "quiOuvreUnSujet", "majLe")
VALUES
  ('piece-grande-salle', 'espace-domaine', 'sec-tours-centrales', 'la-grande-salle',
   'La Grande Salle',
   'Quatre longues tables sous des poutres qu’on ne devine qu’aux soirs de tempête, quand les chandelles montent. On y prend les repas, on y attend les annonces, et c’est là que se tient la veillée des braises, au plus creux de la nuit polaire.',
   1, NULL, NULL, NOW()),

  ('piece-grand-escalier', 'espace-domaine', 'sec-tours-centrales', 'le-grand-escalier',
   'Le grand escalier et les paliers',
   'Il monte en tournant, dessert les quatre ailes, et personne n’a jamais compté ses marches deux fois de la même façon. Les paliers sont l’endroit où l’on s’arrête pour se parler sans que ce soit une conversation.',
   2, NULL, NULL, NOW()),

  ('piece-cours-interieures', 'espace-domaine', 'sec-tours-centrales', 'les-cours-interieures',
   'Les cours intérieures',
   'Deux cours pavées, ouvertes sur le ciel et donc sur la pluie. On y sèche un cours, on y règle une dispute, on y regarde la neige tenir trois jours avant que le vent de mer ne l’emporte.',
   3, NULL, NULL, NOW()),

  ('piece-hall-entree', 'espace-domaine', 'sec-tours-centrales', 'le-hall-d-entree',
   'Le hall d’entrée et la cloche',
   'La première salle du château, et la dernière : c’est par là qu’on arrive de Kaldvik, trempé du chemin escarpé. La cloche sonne les heures, les repas, et deux ou trois choses qu’on préfère ne pas nommer devant les premières années.',
   4, NULL, NULL, NOW()),

  -- « Sur convocation » : le staff ouvre, l'élève répond. Ce n'est pas un lieu
  -- fermé — c'en serait un si l'on avait mis `ouverte` à faux, et le convoqué
  -- ne pourrait pas répondre.
  ('piece-bureau-direction', 'espace-domaine', 'sec-tours-centrales', 'le-bureau-de-la-direction',
   'Le bureau de la direction',
   'On n’y entre pas de son propre chef. Elena Tidevann y reçoit, entre un jeu de cartes qui ne doit rien à la tradition nordique et une fenêtre qui donne sur la mer — celle par où l’on voit le mieux ce qui monte.',
   5, NULL, 'STAFF_SEULEMENT', NOW());

-- ─────────────────────────────────────────────────────────────
-- 3 — L'aile est : la mer, et Tideål.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre", "anneeMinimale", "maisonReservee", "majLe")
VALUES
  ('piece-dortoir-tideal', 'espace-domaine', 'sec-aile-est', 'le-dortoir-de-tideal',
   'Le dortoir de Tideål',
   'Sarcelle et gris perle, des fenêtres trop grandes, et le bruit de l’eau en dessous à toute heure. On y parle bas des pressentiments qu’on a eus et qu’on n’oserait pas dire ailleurs.',
   1, NULL, 'TIDEAL', NOW()),

  ('piece-galerie-des-vents', 'espace-domaine', 'sec-aile-est', 'la-galerie-des-vents',
   'La galerie des vents',
   'Une longue coursive vitrée qui longe la façade de mer. Les carreaux tremblent, le sol reste humide, et par temps clair on voit jusqu’aux récifs — ceux qu’on montre du doigt sans jamais s’en approcher.',
   2, NULL, NULL, NOW()),

  ('piece-salle-de-duel', 'espace-domaine', 'sec-aile-est', 'la-salle-de-duel',
   'La salle de duel',
   'Plancher marqué, murs nus, rien qui puisse se casser. On y apprend à se défendre et surtout à perdre : un duel raté fait avancer une histoire mieux qu’un duel gagné.',
   3, 'DEUXIEME_ANNEE', NULL, NOW()),

  ('piece-observatoire-maree', 'espace-domaine', 'sec-aile-est', 'l-observatoire-de-la-maree',
   'L’observatoire de la marée',
   'Une salle ronde au bout de l’aile, avec des instruments que peu savent encore lire. On y suit les marées, les courants, et ce qui remonte parfois avec eux. Les uns y viennent pour la divination, les autres pour la vue.',
   4, 'QUATRIEME_ANNEE', NULL, NOW());

-- ─────────────────────────────────────────────────────────────
-- 4 — L'aile ouest : la forêt, et Nattorm.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre", "anneeMinimale", "maisonReservee", "quiOuvreUnSujet", "majLe")
VALUES
  ('piece-dortoir-nattorm', 'espace-domaine', 'sec-aile-ouest', 'le-dortoir-de-nattorm',
   'Le dortoir de Nattorm',
   'Noir et violet sombre, sous des voûtes basses. La maison porte le nom d’un homme qui a fui, et ses élèves le savent avant même d’arriver. On y apprend vite à qui l’on peut parler.',
   1, NULL, 'NATTORM', NULL, NOW()),

  ('piece-bibliotheque', 'espace-domaine', 'sec-aile-ouest', 'la-bibliotheque',
   'La bibliothèque',
   'Trois étages de rayonnages et un silence qui ne vient d’aucune règle affichée. On y trouve l’histoire du château telle qu’on l’enseigne aux jeunes élèves — et il faut monter plus haut, ou demander, pour trouver autre chose.',
   2, NULL, NULL, NULL, NOW()),

  ('piece-la-reserve', 'espace-domaine', 'sec-aile-ouest', 'la-reserve',
   'La Réserve',
   'La partie fermée de la bibliothèque, derrière une grille qu’un professeur ouvre ou n’ouvre pas. Ce qu’on y garde n’est pas interdit : c’est écrit pour des gens qui savent déjà. On y entre accompagné, et l’on en ressort avec des questions.',
   3, 'CINQUIEME_ANNEE', NULL, NULL, NOW()),

  ('piece-bureaux-professeurs', 'espace-domaine', 'sec-aile-ouest', 'les-bureaux-des-professeurs',
   'Les bureaux des professeurs',
   'Une enfilade de portes étroites, chacune avec son odeur — herbes séchées, encre, cendre froide. On y vient parce qu’on a été appelé, rarement pour une bonne nouvelle.',
   4, NULL, NULL, 'STAFF_SEULEMENT', NOW());

-- ─────────────────────────────────────────────────────────────
-- 5 — L'aile sud : la falaise, et Bryggeld.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre", "anneeMinimale", "maisonReservee", "majLe")
VALUES
  ('piece-dortoir-bryggeld', 'espace-domaine', 'sec-aile-sud', 'le-dortoir-de-bryggeld',
   'Le dortoir de Bryggeld',
   'Cuivre et brun, une cheminée qui ne s’éteint jamais tout à fait, et des affaires partout parce que personne ne range vraiment. C’est le dortoir où l’on entre sans frapper.',
   1, NULL, 'BRYGGELD', NOW()),

  ('piece-infirmerie', 'espace-domaine', 'sec-aile-sud', 'l-infirmerie',
   'L’infirmerie',
   'Lits blancs, volets mi-clos, et quelqu’un qui pose toujours une question de trop. On y répare les brûlures d’alchimie, les chutes du grand escalier, et ce qu’on préfère raconter comme une chute du grand escalier.',
   2, NULL, NULL, NOW()),

  ('piece-reserves-et-caves', 'espace-domaine', 'sec-aile-sud', 'les-reserves-et-les-caves',
   'Les réserves et les caves',
   'Sous l’aile sud : les provisions, les tonneaux, et les ingrédients d’alchimie rangés selon un ordre que Torvald aurait approuvé et que plus personne ne sait lire. On y descend pour l’herboristerie, et pour ce qu’on ne trouve pas ailleurs.',
   3, 'TROISIEME_ANNEE', NULL, NOW()),

  -- Art. 13.1 — rappelé en toutes lettres, et pas un mot sur ce que le sceau
  -- retient : la bible marque ce contenu « confidentiel staff ».
  ('piece-souterrains', 'espace-domaine', 'sec-aile-sud', 'les-souterrains',
   'Les souterrains',
   'Des galeries taillées dans la roche sous le château, froides et sèches, qui servaient au stockage avant qu’on les oublie. Elles ne mènent pas à la grotte. Le sceau est inaccessible : aucun personnage ne le franchit, n’en force les protections, ni ne prétend savoir ce qu’il retient — on peut redouter, colporter des rumeurs qui se contredisent, se tromper. Toute intrigue qui s’en approche est menée par l’administration, lors d’événements officiels.',
   4, 'SIXIEME_ANNEE', NULL, NOW());

-- ─────────────────────────────────────────────────────────────
-- 6 — L'aile nord : le givre, et Kaldrafn.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre", "anneeMinimale", "maisonReservee", "majLe")
VALUES
  ('piece-dortoir-kaldrafn', 'espace-domaine', 'sec-aile-nord', 'le-dortoir-de-kaldrafn',
   'Le dortoir de Kaldrafn',
   'Bleu nuit et argent, tout en haut de la tour, avec des couvertures en trop et des fenêtres qu’on n’ouvre pas. On y parle peu, et rarement pour ne rien dire.',
   1, NULL, 'KALDRAFN', NOW()),

  -- Le lieu, pas la messagerie. Ouvert à tous en écriture, malgré l'aile.
  ('piece-tour-aux-corbeaux', 'espace-domaine', 'sec-aile-nord', 'la-tour-aux-corbeaux',
   'La Tour aux Corbeaux',
   'Le colombier de l’école, au sommet de l’aile nord — l’aile au corbeau, ce qui n’est pas un hasard. Tout le monde y monte, quelle que soit sa maison : on confie sa lettre, on regarde l’oiseau prendre le vent, et l’on redescend en se frottant les mains.',
   2, NULL, NULL, NOW()),

  ('piece-combles-et-toits', 'espace-domaine', 'sec-aile-nord', 'les-combles-et-les-toits',
   'Les combles et les toits',
   'Charpente, ardoises, et un accès que personne n’a jamais officiellement condamné. On y monte pour être seul, pour voir loin, ou pour la raison qu’on ne donne pas. Le vent y décide de tout.',
   3, 'TROISIEME_ANNEE', NULL, NOW());
