-- L'aile nord regarde le lac, et non la forêt.
--
-- Décision du joueur, 27 août 2026, à la relecture de la dernière aile.
--
-- La carte du domaine fait autorité (bible §2, art. 12.4), et elle tranche :
-- sa rose des vents met le nord en haut, le château à l'est sur la falaise,
-- la Forêt Sombre à l'ouest — et **entre le château et les Hauts Plateaux de
-- Givre, c'est le Lac qu'on traverse**, pas la forêt. La forêt se regarde
-- depuis l'aile ouest, où c'est déjà écrit.
--
-- L'erreur ne se voyait pas en lisant le texte : il fallait ouvrir la carte.
-- C'est exactement ce que l'article 12.4 demande — « toute description de
-- lieu en RP doit s'y conformer » —, et la seule façon de le vérifier est de
-- la regarder, pas de se fier au nom des lieux.
--
-- L'image y gagne : un lac gelé au premier plan et le massif derrière, c'est
-- ce que la carte montre.

UPDATE "sections"
SET "description" = 'La plus froide et la plus haute. Les fenêtres y gèlent de l’intérieur en hiver, et l’on voit les Hauts Plateaux de Givre par-dessus le lac. Beaucoup d’escaliers pour pas grand-chose, disent les autres maisons.',
    "majLe" = NOW()
WHERE "slug" = 'aile-nord';
