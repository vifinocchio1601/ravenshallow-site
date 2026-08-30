-- Le phare quitte une digue qui n'existe pas.
--
-- Décision du joueur, 30 août 2026, quatrième et dernière correction de la
-- relecture des alentours.
--
-- Le texte le posait « au bout de la digue ». La carte le montre sur un rocher,
-- au bout de la **pointe naturelle** qui ferme la baie de Kaldvik : il n'y a
-- aucun ouvrage construit à cet endroit. Une digue suppose des moyens, un
-- chantier, une décision du village — trois choses qu'on invente en un mot et
-- qu'un joueur reprendra ensuite comme un fait acquis.
--
-- ⚠️ **Le phare, lui, EST sur la carte** — je l'avais cru inventé. C'est
-- l'inverse du réflexe attendu : on se méfie de ce qu'on a écrit, et l'on
-- oublie de regarder si la source ne le portait pas déjà. La carte se
-- **regarde**, elle ne se déduit pas du nom des lieux.
--
-- Le gardien, en revanche, est bien une invention — la seule figure ajoutée
-- des vingt et un textes —, et le joueur l'a accordée le même jour. Il fait
-- donc autorité pour le RP au même titre que le reste.

UPDATE "sections"
SET
  "description" = 'Au bout de la pointe qui ferme la baie, sur un rocher que la mer couvre à moitié les soirs de tempête. On y accède par une chaussée de blocs, quand la mer le veut bien. Le gardien parle peu, laisse monter qui le demande poliment, et éteint la conversation en même temps que la lampe, au petit matin.',
  "majLe" = NOW()
WHERE "slug" = 'le-phare'
  AND "espaceId" = (SELECT "id" FROM "espaces" WHERE "cle" = 'alentours');
