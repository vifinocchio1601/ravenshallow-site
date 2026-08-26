-- Le moteur du forum, et ses trois espaces.
--
-- Trois espaces reposent sur le même moteur — le domaine, le monde des
-- non-mages, et celui d'une maison. Ce qui les distingue tient dans des
-- COLONNES, jamais dans du code : construire trois fois le même forum serait
-- le meilleur moyen d'en avoir trois qui divergent.
--
-- Entièrement ADDITIVE : quatre tables neuves, trois listes fermées, et pas
-- une ligne existante réécrite.
--
-- Ce que la base tient elle-même, parce qu'une précaution écrite en TypeScript
-- ne protège que les chemins qu'on a pensé à protéger :
--
--   • une section a un parent au plus, jamais un grand-parent
--   • un sujet a un titre, un post a un corps — ni vides ni démesurés
--   • l'année exigée à l'ouverture d'un sujet NE CHANGE JAMAIS
--   • les quatre colonnes d'un masquage vont ensemble ou pas du tout
--
-- Ce que cette migration ne contient PAS, et c'est délibéré : aucune colonne
-- « mode de participation ». Libre, sur invitation, réservé s'écrivent dans le
-- titre du sujet et tiennent à la bonne foi — décision du joueur, 26 août 2026.
-- Une colonne qui ne décide de rien finit toujours par décider de quelque
-- chose.

-- ─────────────────────────────────────────────────────────────
-- 1 — Les trois listes fermées.
-- ─────────────────────────────────────────────────────────────

CREATE TYPE "QuiOuvreUnSujet" AS ENUM ('TOUT_MEMBRE', 'MEMBRES_MAISON', 'DETENTEUR_PERMISSION');

-- Pas de valeur « selon le mode de participation » : le mode n'est pas une
-- règle du site.
CREATE TYPE "QuiRepond" AS ENUM ('TOUT_MEMBRE', 'MEMBRES_MAISON');

CREATE TYPE "Visibilite" AS ENUM ('TOUS', 'MAISON');

-- ─────────────────────────────────────────────────────────────
-- 2 — Les espaces, et leurs paramètres.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "espaces" (
  "id"                  TEXT NOT NULL,
  "cle"                 TEXT NOT NULL,
  "nom"                 TEXT NOT NULL,
  "description"         TEXT NOT NULL,
  "ordre"               INTEGER NOT NULL,
  "lignesMinimum"       INTEGER,
  "quiOuvreUnSujet"     "QuiOuvreUnSujet" NOT NULL DEFAULT 'TOUT_MEMBRE',
  "quiRepond"           "QuiRepond" NOT NULL DEFAULT 'TOUT_MEMBRE',
  "comptePourLesPoints" BOOLEAN NOT NULL DEFAULT false,
  "compteLesScenes"     BOOLEAN NOT NULL DEFAULT false,
  "visibilite"          "Visibilite" NOT NULL DEFAULT 'TOUS',
  "anneeMinimale"       "Fonction",
  "ouvert"              BOOLEAN NOT NULL DEFAULT true,
  "creeLe"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "majLe"               TIMESTAMP(3) NOT NULL,

  CONSTRAINT "espaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "espaces_cle_key" ON "espaces"("cle");
CREATE INDEX "espaces_ordre_idx" ON "espaces"("ordre");

-- Un minimum de lignes qui serait nul ou négatif n'aurait aucun sens, et
-- ferait passer « aucune exigence » pour « zéro ligne exigée ».
ALTER TABLE "espaces" ADD CONSTRAINT "espaces_lignes_minimum_sensee" CHECK (
  "lignesMinimum" IS NULL OR "lignesMinimum" > 0
);

-- ─────────────────────────────────────────────────────────────
-- 3 — Les sections, et les sous-sections : la même table.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "sections" (
  "id"             TEXT NOT NULL,
  "espaceId"       TEXT NOT NULL,
  "parentId"       TEXT,
  "slug"           TEXT NOT NULL,
  "nom"            TEXT NOT NULL,
  "description"    TEXT NOT NULL,
  "ordre"          INTEGER NOT NULL,
  "anneeMinimale"  "Fonction",
  "maisonReservee" "Maison",
  "visibilite"     "Visibilite",
  "ouverte"        BOOLEAN NOT NULL DEFAULT true,
  "creeLe"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "majLe"          TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "sections"
  ADD CONSTRAINT "sections_espaceId_fkey"
  FOREIGN KEY ("espaceId") REFERENCES "espaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sections"
  ADD CONSTRAINT "sections_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique dans l'espace et non par parent : les adresses restent plates, et
-- déplacer une pièce d'une aile à l'autre ne casse aucun lien.
CREATE UNIQUE INDEX "sections_espaceId_slug_key" ON "sections"("espaceId", "slug");
CREATE INDEX "sections_espaceId_parentId_ordre_idx" ON "sections"("espaceId", "parentId", "ordre");

-- Une section ne se range pas sous elle-même.
ALTER TABLE "sections" ADD CONSTRAINT "sections_pas_son_propre_parent" CHECK (
  "parentId" IS NULL OR "parentId" <> "id"
);

-- ─────────────────────────────────────────────────────────────
-- 4 — DEUX NIVEAUX, JAMAIS TROIS.
--
-- « L'école » a besoin de trois étages — l'aile, la pièce, le sujet ; « Le
-- monde des non-mages » de deux. Une table auto-référente laisse les deux
-- coexister — et laisserait aussi passer une arborescence sans fond, que
-- l'interface ne saurait pas dessiner.
--
-- Le déclencheur porte aussi sur le PARENT : sans la seconde condition, on
-- pourrait donner un parent à une section qui a déjà des enfants, et fabriquer
-- trois niveaux d'un seul UPDATE, par l'autre bout.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "sections_deux_niveaux"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."parentId" IS NOT NULL THEN
    -- Le parent ne doit pas lui-même avoir un parent.
    IF EXISTS (
      SELECT 1 FROM "sections" p
      WHERE p."id" = NEW."parentId" AND p."parentId" IS NOT NULL
    ) THEN
      RAISE EXCEPTION
        'Une sous-section ne peut pas avoir de sous-sections : deux niveaux au maximum.';
    END IF;

    -- Et cette section-ci ne doit pas déjà en avoir.
    IF EXISTS (SELECT 1 FROM "sections" e WHERE e."parentId" = NEW."id") THEN
      RAISE EXCEPTION
        'Cette section a déjà des sous-sections : lui donner un parent ferait trois niveaux.';
    END IF;

    -- Un parent vit forcément dans le même espace.
    IF EXISTS (
      SELECT 1 FROM "sections" p
      WHERE p."id" = NEW."parentId" AND p."espaceId" <> NEW."espaceId"
    ) THEN
      RAISE EXCEPTION 'Une sous-section appartient au même espace que sa section.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "sections_deux_niveaux_trigger"
  BEFORE INSERT OR UPDATE ON "sections"
  FOR EACH ROW EXECUTE FUNCTION "sections_deux_niveaux"();

-- ─────────────────────────────────────────────────────────────
-- 5 — Les sujets.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "sujets" (
  "id"                      TEXT NOT NULL,
  "sectionId"               TEXT NOT NULL,
  "auteurId"                TEXT,
  "titre"                   TEXT NOT NULL,
  "epingle"                 BOOLEAN NOT NULL DEFAULT false,
  "closLe"                  TIMESTAMP(3),
  "closPar"                 TEXT,
  "anneeRequiseALOuverture" "Fonction",
  "dernierPostLe"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "creeLe"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sujets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "sujets"
  ADD CONSTRAINT "sujets_sectionId_fkey"
  FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- L'auteur se détache, il ne s'efface pas : le sujet reste lisible quand un
-- compte disparaît. Même principe que les corbeaux.
ALTER TABLE "sujets"
  ADD CONSTRAINT "sujets_auteurId_fkey"
  FOREIGN KEY ("auteurId") REFERENCES "eleves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "sujets_sectionId_epingle_dernierPostLe_idx"
  ON "sujets"("sectionId", "epingle", "dernierPostLe");
CREATE INDEX "sujets_auteurId_idx" ON "sujets"("auteurId");

-- `btrim` de Postgres ne retire QUE les espaces — ni les retours à la ligne,
-- ni les tabulations. Le piège rencontré sur les corbeaux : un titre de six
-- lignes vides passait le test du non-vide. Au moins un signe qui ne soit pas
-- un blanc, donc, et une longueur tenable dans une liste.
ALTER TABLE "sujets" ADD CONSTRAINT "sujets_titre_sense" CHECK (
  "titre" ~ '[^[:space:]]' AND char_length("titre") <= 140
);

-- Clos par quelqu'un, ou pas clos du tout. Sans cela, une liste afficherait
-- « close le » suivi de rien, ou « close par » sans date.
ALTER TABLE "sujets" ADD CONSTRAINT "sujets_cloture_complete" CHECK (
  ("closLe" IS NULL AND "closPar" IS NULL)
  OR ("closLe" IS NOT NULL AND "closPar" IS NOT NULL)
);

-- ─────────────────────────────────────────────────────────────
-- 6 — L'ANNÉE EXIGÉE NE CHANGE JAMAIS.
--
-- « Le verrouillage n'est pas rétroactif : une scène en cours ne se ferme pas
-- si les règles changent. » Cette promesse ne tient que si la valeur recopiée
-- à l'ouverture est intouchable — sinon il suffirait d'un script de reprise
-- pour refermer des scènes en cours sans que personne le voie.
--
-- Même procédé que le type d'une conversation, dans la Tour.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "sujets_annee_figee"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."anneeRequiseALOuverture" IS DISTINCT FROM OLD."anneeRequiseALOuverture" THEN
    RAISE EXCEPTION
      'L''année exigée à l''ouverture d''un sujet ne se réécrit pas : le verrouillage n''est pas rétroactif.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "sujets_annee_figee_trigger"
  BEFORE UPDATE ON "sujets"
  FOR EACH ROW EXECUTE FUNCTION "sujets_annee_figee"();

-- ─────────────────────────────────────────────────────────────
-- 7 — Les posts.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "posts" (
  "id"                   TEXT NOT NULL,
  "sujetId"              TEXT NOT NULL,
  "auteurId"             TEXT,
  "corps"                TEXT NOT NULL,
  "avertissementContenu" TEXT,
  "publieLe"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "modifieLe"            TIMESTAMP(3),
  "masqueLe"             TIMESTAMP(3),
  "masquePar"            TEXT,
  "motifMasquage"        TEXT,
  "corrigerAvantLe"      TIMESTAMP(3),

  CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "posts"
  ADD CONSTRAINT "posts_sujetId_fkey"
  FOREIGN KEY ("sujetId") REFERENCES "sujets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "posts"
  ADD CONSTRAINT "posts_auteurId_fkey"
  FOREIGN KEY ("auteurId") REFERENCES "eleves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "posts_sujetId_publieLe_idx" ON "posts"("sujetId", "publieLe");
CREATE INDEX "posts_auteurId_idx" ON "posts"("auteurId");

-- Le même piège que le titre, et que les corbeaux avant lui.
ALTER TABLE "posts" ADD CONSTRAINT "posts_corps_non_vide" CHECK (
  "corps" ~ '[^[:space:]]' AND char_length("corps") <= 60000
);

-- Art. 19.3 — masqué le temps d'une correction, sept jours. Les quatre
-- colonnes vont ensemble ou pas du tout : un post masqué sans délai laisserait
-- le joueur sans échéance, et un délai sans masquage ne voudrait rien dire.
ALTER TABLE "posts" ADD CONSTRAINT "posts_masquage_complet" CHECK (
  ("masqueLe" IS NULL AND "masquePar" IS NULL AND "corrigerAvantLe" IS NULL)
  OR ("masqueLe" IS NOT NULL AND "masquePar" IS NOT NULL AND "corrigerAvantLe" IS NOT NULL)
);

-- ─────────────────────────────────────────────────────────────
-- 8 — Les trois espaces, et leur paramétrage.
--
-- Sans sections : « L'école » est remplie par le lot suivant, les deux autres
-- attendent qu'on ait de quoi les remplir. Les créer maintenant fige leur
-- paramétrage, qui est la vraie décision.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "espaces" (
  "id", "cle", "nom", "description", "ordre",
  "lignesMinimum", "quiOuvreUnSujet", "quiRepond",
  "comptePourLesPoints", "compteLesScenes", "visibilite", "ouvert", "majLe"
) VALUES
  (
    'espace-domaine', 'domaine', 'Le domaine',
    'Le château et ce qui l''entoure. Tout ce qui s''y écrit est du jeu de rôle : dix lignes au minimum, et les points s''y gagnent.',
    1,
    10, 'TOUT_MEMBRE', 'TOUT_MEMBRE',
    true, true, 'TOUS', true, NOW()
  ),
  (
    'espace-non-mages', 'non-mages', 'Le monde des non-mages',
    'Ce qui se joue loin des falaises, chez ceux qui ne savent rien de la magie. Aucune longueur minimale, aucun point.',
    2,
    NULL, 'TOUT_MEMBRE', 'TOUT_MEMBRE',
    false, false, 'TOUS', true, NOW()
  ),
  (
    'espace-maison', 'maison', 'Ma maison',
    'Le dortoir, les annonces et les espaces réservés à une maison. Les annonces s''écrivent par les préfets et les détenteurs de la permission ; la lecture est réservée à la maison.',
    3,
    NULL, 'DETENTEUR_PERMISSION', 'MEMBRES_MAISON',
    false, false, 'MAISON', true, NOW()
  );
