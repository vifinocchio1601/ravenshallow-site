-- La Salle de Banquet se décrit enfin comme on la traverse.
--
-- Décision du joueur, 27 août 2026 : « décris plutôt la salle telle qu'elle
-- est décrite dans la Cérémonie du Miroir ».
--
-- Elle revient en partie sur `20260826140000_salle_de_banquet`, qui avait
-- retiré « Quatre longues tables » comme étant l'image qu'on fuit. Le motif
-- reste juste, mais il visait à côté : **le texte de la Cérémonie contient
-- déjà les quatre tables et le ciel au plafond**, et il est en ligne depuis
-- des semaines. Seule la description de la pièce les évitait — si bien que la
-- salle décrite n'était pas celle qu'on traverse le soir du Miroir. Deux
-- textes qui se contredisent coûtent plus cher qu'une image reconnaissable.
--
-- Ce qui a été retiré au passage : « la veillée des braises », que j'avais
-- inventée et qui n'est nulle part dans la bible. Une invention glissée dans
-- une description de lieu devient du lore par la porte de service.
--
-- Le ciel reste **exceptionnel**, et ce n'est pas un adoucissement : la
-- Cérémonie le dit elle-même — « Ce n'est pas le ciel du dehors. C'est celui
-- que le château a décidé de vous montrer ce soir. » Une description
-- permanente qui l'annoncerait tous les jours contredirait la scène.

UPDATE "sections"
SET "description" = 'Immense, taillée en longueur, entièrement de pierre. De hautes arches nervurées montent de chaque côté et se rejoignent très haut, si bien qu’on ne voit jamais où la pierre s’arrête. Quatre longues tables la parcourent d’un bout à l’autre ; au fond, sur une estrade de pierre, celle des professeurs. Une nuit par an — celle du Miroir — la charpente cède la place à un ciel que le château choisit lui-même, et qui n’est pas celui du dehors.',
    "majLe" = NOW()
WHERE "id" = 'piece-salle-de-banquet';
