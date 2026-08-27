-- Les souterrains redeviennent un lieu, et cessent de désigner quoi que ce soit.
--
-- Décision du joueur, 27 août 2026, à la relecture de l'aile sud, et elle
-- vaut pour les vingt-cinq textes : **une description de lieu ne nomme ni la
-- grotte ni le sceau.** Pas même pour en interdire l'approche.
--
-- Le texte précédent faisait deux choses de trop. Il récitait l'article 13.1
-- — les seize autres pièces décrivent un lieu, celle-ci affichait un panneau
-- d'interdiction. Et surtout il **désignait l'endroit** : rappeler la règle
-- dans cette pièce-là, c'est dire aux joueurs où elle s'applique, donc où
-- regarder. Un interdit posé sur une porte est une flèche.
--
-- La règle n'est pas affaiblie pour autant : l'article 13.1 vit dans le
-- règlement, approuvé à l'inscription, et il oblige sans avoir besoin d'être
-- répété ici.
--
-- Le remède n'est pas le mystère mais **l'ennui** : des casiers vides, de la
-- poussière, rien à y chercher. Une pièce intrigante appelle ; une pièce
-- terne est le meilleur des verrous.
--
-- Vérifié le même jour : aucun des vingt-cinq autres textes ne nommait l'un
-- ni l'autre. Celui-ci était le seul.

UPDATE "sections"
SET "description" = 'Des galeries taillées dans la roche sous le château, froides et sèches, qui servaient au stockage avant qu’on cesse d’y descendre. Il n’y reste que des casiers vides et de la poussière qui ne bouge pas. On n’y va plus guère : il n’y a rien à y chercher.',
    "majLe" = NOW()
WHERE "slug" = 'les-souterrains';
