-- « La Grande Salle » redevient « La Salle de Banquet ».
--
-- Décision du joueur, 26 août 2026, et elle annule celle du même jour dans
-- `20260826130000_ecole`. La raison est meilleure que la mienne :
--
--   « la grande salle c'est Harry Potter »
--
-- La bible range la ressemblance avec les univers de magie existants parmi
-- les **interdits** de l'identité visuelle (§13) : « les visuels sont
-- systématiquement réorientés vers une identité propre ». Le vocabulaire suit
-- la même règle — un nom emprunté coûte plus cher qu'un nom qui se confond.
--
-- Mon argument d'origine — ne pas ajouter un troisième nom proche de « Grand
-- Hall » — tombe de lui-même : « Salle de Banquet » ne ressemble à rien
-- d'autre, et ne peut donc se confondre avec rien.
--
-- La description change aussi. Elle ouvrait sur « Quatre longues tables »,
-- qui est très exactement l'image qu'on fuit. Les tables se déplacent
-- désormais selon les soirs — c'est le détail qui rend la salle nôtre.
--
-- L'identifiant est repris avec le reste : aucun sujet n'y est encore
-- rattaché, et un identifiant qui dirait « grande-salle » serait un mensonge
-- de plus à traîner.

UPDATE "sections"
SET "id"   = 'piece-salle-de-banquet',
    "slug" = 'la-salle-de-banquet',
    "nom"  = 'La Salle de Banquet',
    "description" = 'Une salle longue et basse de plafond, chauffée par deux âtres qu’on ne laisse jamais mourir. Les tables se déplacent selon les soirs : en rangs pour les repas, repoussées contre les murs quand la veillée des braises s’installe, au plus creux de la nuit polaire.',
    "majLe" = NOW()
WHERE "id" = 'piece-grande-salle';
