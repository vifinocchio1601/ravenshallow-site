-- La Réserve cesse de promettre qu'elle ne cache rien.
--
-- Décision du joueur, 27 août 2026, à la relecture de l'aile ouest.
--
-- La description affirmait « ce qu'on y garde n'est pas interdit ». C'était
-- faux au regard de la bible, qui place précisément dans la réserve **l'un
-- des trois seuls signes par lesquels la magie noire existe en jeu** : « un
-- ouvrage interdit trouvé dans une réserve, une confidence de couloir, une
-- baguette qui noircit sans explication » (§ magie, art. 13.3).
--
-- Écrire « rien d'interdit ici », c'était donc fermer un crochet narratif que
-- le joueur a ouvert exprès — et le fermer dans un document que les élèves
-- lisent, c'est-à-dire de la façon la plus définitive qui soit.
--
-- Le remède tient en un mot posé seul : « L'essentiel. » Il laisse la place
-- au livre qui ne devrait pas y être sans jamais l'annoncer. Même principe
-- que la galerie des vents, qui montre des lumières sans nommer les Draugr.
--
-- **La Réserve n'est pas une invention** : la bible la nomme d'elle-même.
-- Ne pas la confondre avec un emprunt à rectifier.

UPDATE "sections"
SET "description" = 'La partie fermée de la bibliothèque, derrière une grille qu’un professeur ouvre ou n’ouvre pas. L’essentiel de ce qu’on y garde n’est pas interdit : c’est écrit pour des gens qui savent déjà. L’essentiel. On y entre accompagné, et l’on en ressort avec des questions.',
    "majLe" = NOW()
WHERE "slug" = 'la-reserve';
