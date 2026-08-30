-- La grève s'ouvre à tous. Décision du joueur, 30 août 2026.
--
-- Conséquence directe du déplacement de la veille : elle exigeait la
-- **cinquième année**, ce qui se tenait au pied de la falaise du château — un
-- lieu qu'on atteignait par une faille, à marée basse, à deux pas du verrou.
--
-- Dans la baie de Kaldvik, la même exigence en faisait le lieu **le plus
-- fermé du village**, alors que les quais et la place, à trente pas de là,
-- n'exigent rien. Une grève où l'on ramasse du bois flotté n'a aucune raison
-- d'être interdite aux petits.
--
-- ⚠️ **Le déplacement d'un lieu ne déplace pas ses verrous avec lui**, et
-- c'est la leçon à retenir : l'année exigée dit ce qu'un endroit a de
-- dangereux, pas ce qu'il est. Changer l'endroit sans relire l'année laisse
-- une règle qui ne protège plus de rien et ferme une porte sans raison.
--
-- Le lieu reste ouvert, sans convocation, sans maison réservée : dehors,
-- personne n'est chez soi.

UPDATE "sections"
SET "anneeMinimale" = NULL, "majLe" = NOW()
WHERE "slug" = 'la-greve'
  AND "espaceId" = (SELECT "id" FROM "espaces" WHERE "cle" = 'alentours');
