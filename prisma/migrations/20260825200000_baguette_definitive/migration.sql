-- La baguette de Bjornstav — le choix est définitif.
--
-- Les trois colonnes existent depuis la première migration, nullables et
-- vides. Rien à créer ici : cette migration ne pose que les deux garanties
-- qui manquaient, et elle les pose dans la BASE plutôt que dans le code —
-- une précaution écrite en TypeScript ne protège que les chemins qu'on a
-- pensé à protéger.

-- 1 — Les trois colonnes vont ensemble, ou pas du tout.
--
-- Sans elle, un bois sans cœur passerait, et la fiche afficherait un jour
-- « Sorbier, cœur de » suivi de rien.
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_baguette_complete" CHECK (
  ("baguetteBois" IS NULL AND "baguetteCoeur" IS NULL AND "baguetteChoisieLe" IS NULL)
  OR
  ("baguetteBois" IS NOT NULL AND "baguetteCoeur" IS NOT NULL AND "baguetteChoisieLe" IS NOT NULL)
);

-- 2 — Une baguette posée ne bouge plus, quelle que soit la main qui écrit.
--
-- Le code a sa propre sécurité — un `updateMany` conditionné à une baguette
-- encore vide, comme le Miroir pour la maison. Mais elle ne vaut que pour les
-- chemins qui pensent à l'écrire. Cette règle-ci vaut pour tous : le site,
-- un script, une commande tapée à la main.
--
-- `IS DISTINCT FROM` et non `<>` : une comparaison ordinaire avec NULL rend
-- NULL, jamais vrai, et la règle laisserait passer précisément les cas qu'on
-- veut arrêter.
--
-- Pour corriger une baguette inscrite par erreur, un administrateur doit
-- lever la règle de façon délibérée :
--   ALTER TABLE "eleves" DISABLE TRIGGER "eleves_baguette_definitive";
--   …la correction…
--   ALTER TABLE "eleves" ENABLE TRIGGER "eleves_baguette_definitive";
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- La règle ne se déclenche que si les colonnes de la baguette changent
-- vraiment : modifier l'âge, l'année ou la maison d'un élève reste libre.
CREATE TRIGGER "eleves_baguette_definitive"
  BEFORE UPDATE ON "eleves"
  FOR EACH ROW EXECUTE FUNCTION "baguette_definitive"();
