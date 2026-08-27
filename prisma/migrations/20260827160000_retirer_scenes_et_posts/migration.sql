-- Retirer une scène, retirer son post — sans jamais rien effacer.
--
-- Décision du joueur, 27 août 2026. L'article 2.4 conserve les écrits RP
-- partagés « pour ne pas mutiler les histoires des autres », l'article 6.4
-- laisse chacun propriétaire de ses textes : les deux se concilient en ne
-- laissant retirer que ce qui n'est qu'à soi.
--
-- **Tout est logique, rien n'est effacé** — pour l'auteur comme pour le
-- staff. Un clic malheureux se rattrape, et il n'y a qu'un chemin de code à
-- vérifier. Le joueur, lui, ne voit aucune différence : pour lui, c'est
-- supprimé.

-- ─────────────────────────────────────────────────────────────
-- 1 — La scène retirée du forum.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "sujets"
  ADD COLUMN "supprimeLe"       TIMESTAMP(3),
  ADD COLUMN "supprimePar"      TEXT,
  ADD COLUMN "motifSuppression" TEXT;

-- Les deux premières colonnes vont ensemble ou pas du tout — le même principe
-- que `posts_masquage_complet` : une scène supprimée sans qu'on sache par qui
-- ne se relit pas, et un nom de suppresseur sans suppression ne veut rien
-- dire. Le motif, lui, reste facultatif EN BASE : le staff doit toujours en
-- donner un, mais un auteur qui retire sa propre scène n'a personne à qui se
-- justifier. C'est le dépôt qui fait cette différence-là.
--
-- En revanche, un motif sans suppression est une incohérence, et celui-là est
-- refusé ici.
ALTER TABLE "sujets" ADD CONSTRAINT "sujets_suppression_coherente" CHECK (
  (
    "supprimeLe" IS NULL
    AND "supprimePar" IS NULL
    AND "motifSuppression" IS NULL
  )
  OR ("supprimeLe" IS NOT NULL AND "supprimePar" IS NOT NULL)
);

-- Les listes filtreront sur `supprimeLe IS NULL`. L'index partiel ne porte
-- que les scènes vivantes : les retirées ne sont jamais parcourues, et il
-- serait dommage qu'elles alourdissent le tri de celles qui restent.
CREATE INDEX "sujets_vivants_par_activite"
  ON "sujets" ("sectionId", "epingle", "dernierPostLe")
  WHERE "supprimeLe" IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 2 — Le post retiré par son auteur.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "posts"
  ADD COLUMN "retireLe"       TIMESTAMP(3),
  ADD COLUMN "placeConservee" BOOLEAN NOT NULL DEFAULT false;

-- ⚠️ **À ne pas confondre avec le masquage**, juste au-dessus dans la table.
-- Masquer est une mesure du staff qui laisse le texte lisible à son auteur
-- pour qu'il le reprenne dans les sept jours (art. 19.3). Retirer est le
-- geste de l'auteur, et le texte n'est plus lu de personne.
--
-- `placeConservee` n'a de sens que sur un post retiré : vrai quand un post
-- plus récent existait au moment du geste, parce qu'une réponse qui suit un
-- trou ne se comprend plus. La valeur est **tranchée à cet instant et gardée**
-- — la recalculer donnerait une autre réponse le jour où quelqu'un écrit
-- après coup, et le post reparaîtrait sous une autre forme sans que personne
-- l'ait demandé.
ALTER TABLE "posts" ADD CONSTRAINT "posts_retrait_coherent" CHECK (
  "retireLe" IS NOT NULL OR "placeConservee" = false
);

-- ─────────────────────────────────────────────────────────────
-- 3 — La trace au journal.
-- ─────────────────────────────────────────────────────────────

-- Son propre événement, et non un `ACCES_MODIFIE` détourné : suspendre un
-- compte et retirer une scène ne se lisent pas de la même façon. Même raison
-- que `ROLE_MODIFIE` en son temps.
--
-- Postgres accepte d'ajouter une valeur à un enum dans une transaction tant
-- qu'elle n'y est pas employée — c'est le cas ici, la migration ne fait
-- qu'ajouter des colonnes.
ALTER TYPE "EvenementMembre" ADD VALUE 'SCENE_SUPPRIMEE';
