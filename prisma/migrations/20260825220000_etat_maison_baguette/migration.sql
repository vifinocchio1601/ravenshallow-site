-- Trois états au lieu d'une case vide.
--
-- Jusqu'ici, « pas de maison » et « pas de baguette » se lisaient à la seule
-- absence de valeur. Cette lecture confond deux situations opposées :
--
--   un nouvel élève accepté  — le Miroir l'attend, il faut l'y envoyer
--   la directrice            — il ne la concerne pas, il ne faut surtout pas
--
-- D'où une colonne d'état par étape. **Elle seule tranche.** La présence
-- d'une valeur ne décide plus de rien, nulle part.
--
-- Et rien ne s'efface : `SANS_OBJET` laisse la maison et la baguette dans
-- leurs colonnes. Une joueuse de Tideål nommée directrice les retrouve
-- intactes le jour où elle quitte le poste.

-- ─────────────────────────────────────────────────────────────
-- 1 — Deux traces de plus au journal.
--
-- Posées en premier et jamais employées dans ce fichier : Postgres n'accepte
-- une nouvelle valeur d'enum qu'après validation de la transaction.
-- ─────────────────────────────────────────────────────────────
ALTER TYPE "EvenementMembre" ADD VALUE 'ETAT_MAISON_MODIFIE';
ALTER TYPE "EvenementMembre" ADD VALUE 'ETAT_BAGUETTE_MODIFIE';

-- ─────────────────────────────────────────────────────────────
-- 2 — Les trois états, et les deux colonnes.
--
-- `NON_FAIT` par défaut : un compte créé demain est un élève qu'on attend au
-- Miroir. C'est le sens qui va dans la bonne direction pour l'immense
-- majorité des comptes, et le seul qu'on ne risque pas d'oublier de poser.
-- ─────────────────────────────────────────────────────────────
CREATE TYPE "EtatEtape" AS ENUM ('NON_FAIT', 'FAIT', 'SANS_OBJET');

ALTER TABLE "eleves"
  ADD COLUMN "etatMaison"   "EtatEtape" NOT NULL DEFAULT 'NON_FAIT',
  ADD COLUMN "etatBaguette" "EtatEtape" NOT NULL DEFAULT 'NON_FAIT';

-- ─────────────────────────────────────────────────────────────
-- 3 — L'état existant se déduit une dernière fois de la valeur.
--
-- C'est la seule fois où on le fait, et c'est pour cesser de le faire. Après
-- ce point, la déduction est un bug.
--
-- Personne ne devient `SANS_OBJET` ici : cet état est une décision
-- d'administration, elle se prend depuis la fiche du membre et se retrouve au
-- journal. La migration ne présume de rien.
-- ─────────────────────────────────────────────────────────────
UPDATE "eleves" SET "etatMaison"   = 'FAIT' WHERE "maison" IS NOT NULL;
UPDATE "eleves" SET "etatBaguette" = 'FAIT' WHERE "baguetteChoisieLe" IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 4 — Chaque état s'accorde avec sa valeur.
--
-- Deux sens sur trois sont contraints, le troisième est libre :
--
--   NON_FAIT   exige une case vide    — sinon on renverrait au Miroir
--              quelqu'un qui a déjà sa maison
--   FAIT       exige une valeur       — sinon on afficherait un blason
--              qui n'existe pas
--   SANS_OBJET n'exige rien           — la directrice garde sa maison,
--              un professeur venu de l'extérieur n'en a jamais eu
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_etat_maison_accorde" CHECK (
  ("etatMaison" = 'NON_FAIT' AND "maison" IS NULL)
  OR
  ("etatMaison" = 'FAIT' AND "maison" IS NOT NULL)
  OR
  "etatMaison" = 'SANS_OBJET'
);

ALTER TABLE "eleves" ADD CONSTRAINT "eleves_etat_baguette_accorde" CHECK (
  ("etatBaguette" = 'NON_FAIT' AND "baguetteChoisieLe" IS NULL)
  OR
  ("etatBaguette" = 'FAIT' AND "baguetteChoisieLe" IS NOT NULL)
  OR
  "etatBaguette" = 'SANS_OBJET'
);

-- ─────────────────────────────────────────────────────────────
-- 5 — La boutique ne sert plus un compte qu'elle ne concerne pas.
--
-- Le déclencheur posé par `20260825200000_baguette_definitive` refusait déjà
-- de MODIFIER une baguette écrite. Il lui manquait le cas symétrique : en
-- INSCRIRE une à un compte marqué sans objet.
--
-- Sans cette ligne, un compte passé en `SANS_OBJET` avant d'avoir eu de
-- baguette resterait écrivable — ses colonnes sont vides, l'ancienne règle
-- n'y voyait rien à redire — et une requête forgée sur la route d'API
-- pourrait lui en poser une. Le site l'en empêche déjà ; la base le doit
-- aussi, pour les chemins qu'on n'a pas prévus.
--
-- Pour corriger une baguette inscrite par erreur, la commande reste celle de
-- la migration d'origine :
--   ALTER TABLE "eleves" DISABLE TRIGGER "eleves_baguette_definitive";
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION "baguette_definitive"() RETURNS TRIGGER AS $$
BEGIN
  IF OLD."baguetteChoisieLe" IS NOT NULL AND (
       NEW."baguetteBois"      IS DISTINCT FROM OLD."baguetteBois"
    OR NEW."baguetteCoeur"     IS DISTINCT FROM OLD."baguetteCoeur"
    OR NEW."baguetteChoisieLe" IS DISTINCT FROM OLD."baguetteChoisieLe"
  ) THEN
    RAISE EXCEPTION 'Baguette déjà posée : elle est définitive (élève %)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;

  -- Nouveau : on n'inscrit pas de baguette à qui la boutique ne concerne pas.
  -- Le retrait de l'état, lui, reste libre — c'est ainsi qu'on rétablit.
  IF NEW."etatBaguette" = 'SANS_OBJET'
     AND NEW."baguetteChoisieLe" IS NOT NULL
     AND OLD."baguetteChoisieLe" IS NULL THEN
    RAISE EXCEPTION 'Baguette sans objet pour cet élève (%)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
