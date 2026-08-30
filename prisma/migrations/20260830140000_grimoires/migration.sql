-- Les Grimoires — la bibliothèque de consultation, sous « Le domaine ».
--
-- Une étagère d'ouvrages et un lecteur qui tourne les pages. Le premier
-- volume est le grimoire des Sortilèges, écrit par le joueur : vingt-quatre
-- runes, soixante-cinq sorts, quatre interdits.
--
-- ── Ce que le joueur a tranché, le 30 août 2026 ──
--
-- **Tout est lisible.** L'année de déblocage s'affiche sur chaque fiche et
-- une mention rappelle qu'un sort ne se lance pas avant (art. 14.4) — mais
-- elle ne ferme aucune porte : le règlement interdit de LANCER un sort hors
-- de son année, pas d'en lire la fiche. C'est le principe qui vaut déjà sur
-- le forum, où presque tout se lit et où l'écriture seule porte les verrous.
--
-- D'où une condition d'accès à **deux valeurs**, et non trois. Une troisième,
-- « à partir de la Ne année », ne déciderait de rien aujourd'hui — et une
-- colonne qui ne décide de rien finit par décider de quelque chose.
--
-- **Les quatre sortilèges interdits (art. 13.2 et 13.3) sont la seule chose
-- que le serveur retient.** Le chapitre qui les porte ne descend pas dans le
-- navigateur d'un joueur : ni son contenu, ni son titre, ni sa ligne au
-- sommaire, ni un grisé sur l'étagère. Il n'existe pas pour lui.
--
-- ── Un seul niveau de chapitres ──
--
-- Le document porte deux niveaux de titres ; le second devient un bloc
-- `SOUS_TITRE` dans le flux, et le sommaire le retrouve. Deux niveaux de
-- chapitres auraient demandé le déclencheur du forum — « deux niveaux et
-- jamais trois » — pour un besoin que personne n'a. Cela tombe juste : « Les
-- quatre sorts interdits » est un chapitre entier, avec son « Pourquoi
-- quatre, et pas davantage » dedans.
--
-- ── Ce que cette migration ne contient PAS ──
--
-- Aucune permission attribuable, comme les annonces et le calendrier :
-- écrire un grimoire est une décision d'administration, pas une charge qu'on
-- délègue. Ne pas l'ajouter à `Permission`.
--
-- Aucune table de sorts : décision du joueur, une fiche est un bloc parmi
-- d'autres. Conséquence assumée — pas de recherche ni de filtre par matière
-- sans reprendre l'import.
--
-- Aucun numéro de page nulle part : la pagination se mesure à l'écran, elle
-- dépend de la largeur et de la taille du texte. Ce qui voyage dans un lien,
-- c'est l'ancre d'un bloc.

-- ─────────────────────────────────────────────────────────────
-- 1 — Les trois énumérations.
-- ─────────────────────────────────────────────────────────────

CREATE TYPE "AccesGrimoire" AS ENUM ('TOUS', 'ADMINISTRATION');

CREATE TYPE "TypeBlocGrimoire" AS ENUM (
  'PARAGRAPHE', 'SOUS_TITRE', 'FICHE_SORT', 'FICHE_INTERDITE', 'TABLEAU', 'SEPARATEUR'
);

CREATE TYPE "ReliureGrimoire" AS ENUM (
  'CUIR_SOMBRE', 'CUIR_FAUVE', 'TOILE_BLEUE', 'PARCHEMIN'
);

-- ─────────────────────────────────────────────────────────────
-- 2 — Le volume.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "grimoires" (
  "id"          TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "titre"       TEXT NOT NULL,
  "exergue"     TEXT,
  "description" TEXT NOT NULL,
  "reliure"     "ReliureGrimoire" NOT NULL,
  "ordre"       INTEGER NOT NULL,
  "posePar"     TEXT NOT NULL,
  "modifieLe"   TIMESTAMP(3),

  -- Retirer n'efface pas : les deux colonnes vont ensemble ou pas du tout.
  "retireLe"    TIMESTAMP(3),
  "retirePar"   TEXT,

  "creeLe"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "majLe"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "grimoires_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grimoires_slug_key" ON "grimoires"("slug");
CREATE INDEX "grimoires_ordre_idx" ON "grimoires"("ordre");

-- Une adresse propre, et qui ne peut pas devenir un piège d'échappement.
ALTER TABLE "grimoires" ADD CONSTRAINT "grimoires_slug_forme"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") <= 80);

-- ⚠️ `btrim` ne retire que les ESPACES — ni les retours à la ligne, ni les
-- tabulations. Un titre fait de six retours passerait. D'où la classe
-- POSIX : au moins un signe qui ne soit pas un blanc. Piège déjà payé sur le
-- corps d'un corbeau.
ALTER TABLE "grimoires" ADD CONSTRAINT "grimoires_titre_non_vide"
  CHECK ("titre" ~ '[^[:space:]]' AND length("titre") <= 120);

ALTER TABLE "grimoires" ADD CONSTRAINT "grimoires_description_non_vide"
  CHECK ("description" ~ '[^[:space:]]' AND length("description") <= 300);

ALTER TABLE "grimoires" ADD CONSTRAINT "grimoires_exergue_non_vide"
  CHECK ("exergue" IS NULL OR ("exergue" ~ '[^[:space:]]' AND length("exergue") <= 200));

ALTER TABLE "grimoires" ADD CONSTRAINT "grimoires_pose_par_non_vide"
  CHECK ("posePar" ~ '[^[:space:]]');

ALTER TABLE "grimoires" ADD CONSTRAINT "grimoires_ordre_positif"
  CHECK ("ordre" >= 0);

ALTER TABLE "grimoires" ADD CONSTRAINT "grimoires_retrait_complet"
  CHECK (("retireLe" IS NULL) = ("retirePar" IS NULL));

-- ─────────────────────────────────────────────────────────────
-- 3 — Le chapitre. C'est lui qui porte la condition d'accès.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "chapitres_grimoire" (
  "id"         TEXT NOT NULL,
  "grimoireId" TEXT NOT NULL,
  "slug"       TEXT NOT NULL,
  "titre"      TEXT NOT NULL,
  "ordre"      INTEGER NOT NULL,
  "acces"      "AccesGrimoire" NOT NULL DEFAULT 'TOUS',
  "creeLe"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "majLe"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "chapitres_grimoire_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chapitres_grimoire_grimoireId_slug_key"
  ON "chapitres_grimoire"("grimoireId", "slug");
CREATE INDEX "chapitres_grimoire_grimoireId_ordre_idx"
  ON "chapitres_grimoire"("grimoireId", "ordre");

ALTER TABLE "chapitres_grimoire" ADD CONSTRAINT "chapitres_grimoire_grimoireId_fkey"
  FOREIGN KEY ("grimoireId") REFERENCES "grimoires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chapitres_grimoire" ADD CONSTRAINT "chapitres_grimoire_slug_forme"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") <= 80);

ALTER TABLE "chapitres_grimoire" ADD CONSTRAINT "chapitres_grimoire_titre_non_vide"
  CHECK ("titre" ~ '[^[:space:]]' AND length("titre") <= 120);

ALTER TABLE "chapitres_grimoire" ADD CONSTRAINT "chapitres_grimoire_ordre_positif"
  CHECK ("ordre" >= 0);

-- ─────────────────────────────────────────────────────────────
-- 4 — Le bloc.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "blocs_grimoire" (
  "id"         TEXT NOT NULL,
  "chapitreId" TEXT NOT NULL,
  "ordre"      INTEGER NOT NULL,
  "type"       "TypeBlocGrimoire" NOT NULL,

  -- Le contenu, selon le type. La base ne garantit que la forme générale ;
  -- le détail vit dans `grimoires/schema.ts`, seule porte d'entrée.
  "donnees"    JSONB NOT NULL,

  -- L'ancre d'un lien précis. Facultative : un séparateur n'en a pas.
  "ancre"      TEXT,

  CONSTRAINT "blocs_grimoire_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blocs_grimoire_chapitreId_ancre_key"
  ON "blocs_grimoire"("chapitreId", "ancre");
CREATE INDEX "blocs_grimoire_chapitreId_ordre_idx"
  ON "blocs_grimoire"("chapitreId", "ordre");

ALTER TABLE "blocs_grimoire" ADD CONSTRAINT "blocs_grimoire_chapitreId_fkey"
  FOREIGN KEY ("chapitreId") REFERENCES "chapitres_grimoire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Un objet, jamais une liste ni un nombre : tout le code qui lit un bloc
-- suppose des champs nommés.
ALTER TABLE "blocs_grimoire" ADD CONSTRAINT "blocs_grimoire_donnees_objet"
  CHECK (jsonb_typeof("donnees") = 'object');

ALTER TABLE "blocs_grimoire" ADD CONSTRAINT "blocs_grimoire_ancre_forme"
  CHECK ("ancre" IS NULL OR ("ancre" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("ancre") <= 120));

ALTER TABLE "blocs_grimoire" ADD CONSTRAINT "blocs_grimoire_ordre_positif"
  CHECK ("ordre" >= 0);

-- ─────────────────────────────────────────────────────────────
-- 5 — Le verrou des quatre interdits, et il regarde les DEUX bouts.
-- ─────────────────────────────────────────────────────────────
--
-- Une `FICHE_INTERDITE` ne peut vivre que dans un chapitre réservé à
-- l'administration. Vérifier seulement à l'écriture du bloc laisserait
-- ouvrir le chapitre après coup, par l'autre côté — c'est exactement la
-- leçon du déclencheur des deux niveaux de sections du forum.
--
-- Ce n'est pas une ceinture de plus sur le filtrage serveur : c'est ce qui
-- rend une faute de saisie impossible. Le filtrage protège la lecture ; ce
-- déclencheur protège de l'écriture.

CREATE OR REPLACE FUNCTION "grimoire_interdit_reste_au_chateau"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."type" = 'FICHE_INTERDITE' THEN
    IF (
      SELECT "acces" FROM "chapitres_grimoire" WHERE "id" = NEW."chapitreId"
    ) <> 'ADMINISTRATION' THEN
      RAISE EXCEPTION
        'Un sortilege interdit ne peut vivre que dans un chapitre reserve a l''administration (art. 13.2).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "blocs_grimoire_interdit_reste_au_chateau"
  BEFORE INSERT OR UPDATE ON "blocs_grimoire"
  FOR EACH ROW EXECUTE FUNCTION "grimoire_interdit_reste_au_chateau"();

CREATE OR REPLACE FUNCTION "grimoire_chapitre_ne_souvre_pas_sur_un_interdit"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."acces" <> 'ADMINISTRATION' AND EXISTS (
    SELECT 1 FROM "blocs_grimoire"
    WHERE "chapitreId" = NEW."id" AND "type" = 'FICHE_INTERDITE'
  ) THEN
    RAISE EXCEPTION
      'Ce chapitre porte un sortilege interdit : il ne peut pas s''ouvrir aux joueurs (art. 13.2).';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "chapitres_grimoire_ne_souvre_pas_sur_un_interdit"
  BEFORE UPDATE ON "chapitres_grimoire"
  FOR EACH ROW EXECUTE FUNCTION "grimoire_chapitre_ne_souvre_pas_sur_un_interdit"();
