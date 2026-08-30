-- Le cœur de la forêt est interdit, et l'on y va quand même.
--
-- Décision du joueur, 30 août 2026, pendant la relecture des alentours.
--
-- ── Ce qui n'allait pas ──
--
-- Le texte disait « **les professeurs n'interdisent pas d'y aller** ; ils
-- demandent qu'on prévienne quelqu'un avant ». Or le lieu exige la cinquième
-- année : un deuxième année lisait donc, sur une porte qui lui est fermée,
-- qu'elle ne l'est pas. L'écran affiche bien la condition à côté — le texte,
-- lui, mentait.
--
-- ── Ce que le joueur a tranché ──
--
-- L'interdit est **dans le monde** : l'école le pose, et le pose chaque année.
-- Mais il n'empêche pas un élève d'y aller à ses risques et périls — c'est
-- même de la bonne matière à jouer. Le verrou de cinquième année, lui, ne
-- bouge pas.
--
-- ⚠️ **Ce n'est PAS le cas des souterrains**, et il faut savoir les
-- distinguer. Là-bas, rappeler l'interdit revenait à désigner la grotte : un
-- interdit posé sur une porte est une flèche. Ici, il n'y a rien de caché à
-- protéger — la bible fait de la forêt une « zone d'exploration et de danger
-- accessible aux élèves », et l'interdit ne montre que ce qu'il dit : des
-- arbres, une pente, et pas de repère.
--
-- Aucune créature n'est nommée. La Huldra vit là d'après le bestiaire, et
-- c'est précisément pour cela qu'on ne l'annonce pas : une description qui
-- annonce une créature revient à l'inviter (art. 13.6).

UPDATE "sections"
SET
  "description" = 'Là où les entailles s’arrêtent. Les troncs sont plus gros, l’humus étouffe le bruit des pas, et il ne reste de repère que la pente. L’école l’interdit aux élèves, et le redit chaque année — ce qui n’a jamais empêché personne d’aller voir, ni de rentrer sans le raconter.',
  "majLe" = NOW()
WHERE "slug" = 'le-coeur-de-la-foret'
  AND "espaceId" = (SELECT "id" FROM "espaces" WHERE "cle" = 'alentours');
