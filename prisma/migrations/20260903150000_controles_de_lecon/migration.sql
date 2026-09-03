-- ═══════════════════════════════════════════════════════════════
--  Le contrôle d'une leçon — art. 18.2, et REGLES du cursus
-- ═══════════════════════════════════════════════════════════════
--
-- Une ligne par contrôle envoyé, et il n'y en a jamais deux : c'est
-- `REGLES.controleEnvoiUnique`, écrit par le joueur dans `cours/cursus.ts`,
-- et c'est l'index unique qui le tient — pas une lecture avant écriture, qui
-- laisserait passer deux envois simultanés.
--
-- ⚠️ **La table ne garde AUCUNE question et AUCUNE bonne réponse.** Celles-ci
-- vivent dans `lib/cours/questionnaires.ts`, qui est `server-only` — même
-- parti pris que le barème de la Cérémonie du Miroir. La ligne ne porte que
-- ce que l'élève a répondu et ce que cela valait.
--
-- ⚠️ **Le brouillon n'existe pas en base.** La page du joueur dit
-- « Brouillon enregistré » ; ce brouillon vit dans l'onglet, et rien d'autre.
-- Une table de brouillons demanderait un second geste d'écriture à chaque
-- clic sur une réponse, pour une promesse que personne n'a demandée. Ce qui
-- est écrit ici est un contrôle ENVOYÉ, et il l'est pour toujours.

CREATE TABLE "controles_envoyes" (
  "id" TEXT NOT NULL,

  -- La FICHE, et non le compte : un contrôle est passé par un personnage.
  -- Nulle si le compte a été supprimé — la ligne reste, comme au carnet des
  -- points, et pour la même raison : ce qui a été gagné a été gagné.
  "eleveId" TEXT,

  -- L'identifiant de matière du cursus — « sortileges », jamais son nom.
  -- Aucune clé étrangère : le cursus vit dans le code, il n'a pas de table.
  "matiereId" TEXT NOT NULL,
  -- L'année et le rang de la leçon. Les deux, parce qu'une matière porte
  -- plusieurs leçons par année et une leçon 1 dans plusieurs années.
  "annee" SMALLINT NOT NULL,
  "rang" SMALLINT NOT NULL,

  -- Ce qu'il a répondu, dans l'ordre des questions : l'indice de la réponse
  -- choisie, tel que le questionnaire les numérote. **Jamais l'ordre affiché**,
  -- qui est mélangé à chaque ouverture et ne veut rien dire hors de la page.
  "reponses" SMALLINT[] NOT NULL,

  -- Le nombre de bonnes réponses, et le nombre de questions. Les deux sont
  -- figés : le second parce qu'un questionnaire corrigé un jour ne doit pas
  -- voir sa note changer de sens le jour où l'on y ajoute une question.
  "note" SMALLINT NOT NULL,
  "surCombien" SMALLINT NOT NULL,

  "envoyeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "controles_envoyes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "controles_envoyes"
  ADD CONSTRAINT "controles_envoyes_eleveId_fkey"
  FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Un seul envoi par élève et par leçon ──
--
-- ⚠️ **Partiel, sur `eleveId IS NOT NULL`.** Dans un index unique, Postgres
-- tient deux NULL pour DISTINCTS : sans le WHERE, l'index existerait mais ne
-- garantirait rien pour les lignes orphelines — et surtout, il refuserait
-- d'exister le jour où deux comptes supprimés auraient passé le même contrôle.
-- C'est le piège des NULL déjà payé sur `permissions_accordees`.
CREATE UNIQUE INDEX "controles_envoyes_un_seul_envoi"
  ON "controles_envoyes" ("eleveId", "matiereId", "annee", "rang")
  WHERE "eleveId" IS NOT NULL;

-- Lire « où en est cet élève » d'un seul aller-retour.
CREATE INDEX "controles_envoyes_eleve" ON "controles_envoyes" ("eleveId", "envoyeLe");

-- ── Ce que la base tient elle-même ──

-- La note ne dépasse pas le nombre de questions, et rien n'est négatif.
ALTER TABLE "controles_envoyes" ADD CONSTRAINT "controles_envoyes_note_tenable" CHECK (
  "surCombien" > 0 AND "note" >= 0 AND "note" <= "surCombien"
);

-- Autant de réponses que de questions. Sans cela, une note de 3 sur 5 pourrait
-- reposer sur deux réponses, et l'on ne saurait plus jamais laquelle manque.
ALTER TABLE "controles_envoyes" ADD CONSTRAINT "controles_envoyes_autant_de_reponses" CHECK (
  array_length("reponses", 1) = "surCombien"
);

-- L'année est une année du cursus, le rang un rang de leçon.
ALTER TABLE "controles_envoyes" ADD CONSTRAINT "controles_envoyes_annee" CHECK (
  "annee" BETWEEN 1 AND 7 AND "rang" >= 1
);

-- La matière n'est pas une chaîne vide, et s'écrit comme le cursus l'écrit.
ALTER TABLE "controles_envoyes" ADD CONSTRAINT "controles_envoyes_matiere" CHECK (
  "matiereId" ~ '^[a-z_]+$'
);

-- ── Un contrôle envoyé ne se réécrit pas ──
--
-- Même procédé que la copie figée d'un signalement et que la ligne du carnet :
-- l'envoi est définitif (REGLES.controleEnvoiUnique), et une note qui pourrait
-- bouger après coup ne serait pas une note. L'EFFACEMENT reste permis — refuser
-- les deux rendrait un compte indestructible, comme un vieux signalement
-- l'aurait fait.
CREATE OR REPLACE FUNCTION "controle_envoye_fige"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."matiereId"  IS DISTINCT FROM OLD."matiereId"
     OR NEW."annee"   IS DISTINCT FROM OLD."annee"
     OR NEW."rang"    IS DISTINCT FROM OLD."rang"
     OR NEW."reponses" IS DISTINCT FROM OLD."reponses"
     OR NEW."note"    IS DISTINCT FROM OLD."note"
     OR NEW."surCombien" IS DISTINCT FROM OLD."surCombien"
     OR NEW."envoyeLe" IS DISTINCT FROM OLD."envoyeLe"
  THEN
    RAISE EXCEPTION 'Un controle envoye ne se reecrit pas (seul le lien vers l''eleve peut s''annuler).';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "controles_envoyes_figes"
  BEFORE UPDATE ON "controles_envoyes"
  FOR EACH ROW EXECUTE FUNCTION "controle_envoye_fige"();
