-- La cascade cesse de contredire sa propre zone.
--
-- Le texte du lieu disait « Là où le **lac** se déverse et tombe d'un seul jet
-- vers le port » ; celui de la zone, trois lignes plus haut, dit que le lac
-- « se vide vers le sud par une **rivière** qui descend jusqu'à la mer ». Et
-- la carte donne raison à la zone : la rivière sort du lac, serpente
-- longuement à travers les bois, et ne bascule qu'au-dessus de Kaldvik.
--
-- **Deux textes voisins qui se contredisent coûtent plus cher qu'une
-- répétition** — c'est la leçon de la Salle de Banquet, payée le 27 août 2026.
-- Un joueur qui lit les deux ne sait plus si le lac touche la falaise ou s'il
-- en est à une heure de marche, et c'est toute la géographie du domaine qui
-- devient molle.
--
-- Seuls les cinq premiers mots changent. Le reste — le bruit qui couvre les
-- voix, la roche mouillée à dix pas, l'arc-en-ciel que personne n'admet être
-- venu voir — ne bouge pas d'une virgule.

UPDATE "sections"
SET
  "description" = 'Là où la rivière du lac bascule d’un seul jet vers le port, tout en bas. Le bruit couvre les voix : il faut crier, ou renoncer à parler. La roche reste mouillée à dix pas, l’air y est plein d’eau, et les rares matins de soleil bas il s’y tient un arc-en-ciel que personne n’admet être venu voir.',
  "majLe" = NOW()
WHERE "slug" = 'la-cascade'
  AND "espaceId" = (SELECT "id" FROM "espaces" WHERE "cle" = 'alentours');
