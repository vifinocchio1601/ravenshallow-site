-- Le motif d'un point accordé à la main.
--
-- **Un point visible de tous ne doit jamais apparaître sans explication.**
-- C'est la même règle que pour un ajustement de maison, et elle est portée
-- ici par la base plutôt que par l'écran : un point accordé depuis un script
-- ou une commande tapée à la main doit s'expliquer aussi.
--
-- Les deux colonnes sont nulles pour tout ce qui vient du jeu : un post n'a
-- pas de motif, il EST son motif, et son texte est lisible par tout le monde.

ALTER TABLE "points_gagnes"
  ADD COLUMN "motif"  TEXT,
  ADD COLUMN "parNom" TEXT;

-- L'accord entre la provenance et l'explication, **dans les deux sens** :
-- un point de la main de l'administration porte un motif et un auteur, un
-- point du jeu n'en porte aucun. Vérifier un seul sens laisserait passer la
-- moitié des incohérences — un motif orphelin sur un point de post, par
-- exemple, que l'écran n'afficherait nulle part.
--
-- `btrim` de Postgres ne retire QUE les espaces : la forme qui tient compte
-- des retours à la ligne et des tabulations, c'est `~ '[^[:space:]]'`. Piège
-- déjà rencontré sur le corps d'un corbeau.
ALTER TABLE "points_gagnes" ADD CONSTRAINT "points_gagnes_motif_selon_la_source" CHECK (
  (
    "source" = 'ADMINISTRATION'
    AND "motif"  ~ '[^[:space:]]'
    AND "parNom" ~ '[^[:space:]]'
  )
  OR (
    "source" <> 'ADMINISTRATION'
    AND "motif"  IS NULL
    AND "parNom" IS NULL
  )
);

-- L'écran d'administration liste les points accordés à la main, du plus
-- récent au plus ancien. L'index ne porte qu'eux : ils sont rares au milieu
-- de milliers de points de posts, et un balayage complet du carnet pour en
-- afficher vingt serait du gâchis.
CREATE INDEX "points_gagnes_accordes_a_la_main"
  ON "points_gagnes" ("gagneLe" DESC)
  WHERE "source" = 'ADMINISTRATION';
