-- Le carnet des points, les saisons et le tournoi des maisons — art. 18 et 19.
--
-- La colonne `eleves.points` existait depuis le 27 août 2026 et **rien ne
-- l'écrivait**. Cette migration pose ce qui l'écrira, et surtout ce qui
-- permettra un jour de la reconstruire.
--
-- ── Deux compteurs, et il ne faut jamais les confondre ──
--
--   les points PERSONNELS — la progression de l'élève, `eleves.points`
--   les points de MAISON  — le tournoi et les tubes, `compteurs_maison`
--
-- Les deux se remplissent du même carnet, mais **un ajustement de
-- l'administration ne touche que le second** : une sanction jouée en RP
-- (art. 19.1) ne doit pas coûter son année à un élève (art. 18.4).
--
-- ── Le carnet est la seule vérité ──
--
-- Chaque point laisse une ligne : qui, quelle maison, d'où il vient, quel
-- post l'a produit, quand. Les compteurs, eux, ne sont qu'un résumé tenu à
-- jour pour que les tubes s'affichent d'un coup — et une commande sait les
-- refaire entièrement depuis le carnet. Sans cette trace, le jour où un total
-- serait faux, il n'y aurait rien à quoi le comparer.
--
-- ── Ce que cette migration ne fait PAS ──
--
-- Elle ne distribue aucun point : aucune route ne l'écrit encore, et les
-- quatre compteurs naissent à zéro. Elle ne clôt aucune année, n'archive
-- rien, et ne fait passer personne dans l'année suivante.
--
-- Elle est entièrement ADDITIVE : cinq tables neuves, trois colonnes ajoutées
-- au compte, deux valeurs au journal. Pas une ligne existante n'est réécrite.

-- ─────────────────────────────────────────────────────────────
-- 1 — Le journal apprend deux événements.
--
-- Posés en premier et jamais employés dans ce fichier : Postgres n'accepte
-- une nouvelle valeur d'enum qu'après validation de la transaction qui
-- l'ajoute. Même précaution qu'au lot des pouvoirs.
--
-- Le passage d'année, lui, n'en demande pas : c'est une `FONCTION_MODIFIEE`,
-- et elle existe depuis le premier jour. Deux façons d'écrire le même
-- événement finiraient par se contredire dans le journal d'un membre.
-- ─────────────────────────────────────────────────────────────
ALTER TYPE "EvenementMembre" ADD VALUE 'COMPTE_ARCHIVE';
ALTER TYPE "EvenementMembre" ADD VALUE 'COMPTE_RESTAURE';

-- ─────────────────────────────────────────────────────────────
-- 2 — D'où vient un point.
--
-- `QCM` et `EXAMEN` sont posés sans être employés : les cours n'existent pas
-- encore. C'est le point d'accroche demandé, et il ne coûte rien — au
-- contraire, le poser après coup obligerait à retoucher un type que des
-- milliers de lignes portent déjà.
-- ─────────────────────────────────────────────────────────────
CREATE TYPE "SourcePoint" AS ENUM ('POST', 'QCM', 'EXAMEN');

-- ─────────────────────────────────────────────────────────────
-- 3 — La saison scolaire : six mois (art. 18.3).
--
-- **Rien n'est jamais remis à zéro sur ce site**, et les compteurs ne font
-- pas exception : à la clôture, on n'efface pas — on ouvre une page neuve.
--
-- C'est ce qui permet à deux exigences de coexister. Le joueur veut que les
-- compteurs de maison repartent de zéro à chaque année, ET qu'une commande
-- sache les reconstruire depuis le carnet. Sans saison, ce recalcul
-- ramasserait toute l'histoire et rendrait les points de l'an dernier.
--
-- Les points PERSONNELS, eux, ne connaissent pas les saisons : ils portent la
-- progression de l'élève et traversent les années (art. 18.4).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "saisons_scolaires" (
  "id"        TEXT         NOT NULL,
  "nom"       TEXT         NOT NULL,
  "ouverteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closeLe"   TIMESTAMP(3),
  "creeLe"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "saisons_scolaires_pkey" PRIMARY KEY ("id")
);

-- Une saison ne se ferme pas avant de s'ouvrir.
ALTER TABLE "saisons_scolaires" ADD CONSTRAINT "saisons_scolaires_ordre_des_dates" CHECK (
  "closeLe" IS NULL OR "closeLe" >= "ouverteLe"
);

-- Un nom vide ne dit rien — et c'est lui qu'on lira dans l'archive dans deux
-- ans. `btrim` de Postgres ne retire QUE les espaces : la forme qui tient
-- compte des retours à la ligne et des tabulations, c'est celle-ci. Piège
-- déjà rencontré sur le corps d'un corbeau.
ALTER TABLE "saisons_scolaires" ADD CONSTRAINT "saisons_scolaires_nom_non_vide" CHECK (
  "nom" ~ '[^[:space:]]'
);

-- **Une seule saison ouverte à la fois**, et c'est la base qui le tient.
--
-- Sans cette garantie, une clôture à moitié faite laisserait deux saisons
-- ouvertes : les points partiraient dans l'une, les tubes liraient l'autre,
-- et le site afficherait des compteurs figés sans que rien ne signale
-- l'erreur. Un index unique sur une expression constante est la seule forme
-- qui exprime « au plus une ligne satisfaisant cette condition » ; Prisma ne
-- sait pas l'écrire, il vit donc ici et seulement ici.
CREATE UNIQUE INDEX "saisons_scolaires_une_seule_ouverte"
  ON "saisons_scolaires" ((TRUE))
  WHERE "closeLe" IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 4 — Le carnet.
--
-- Une ligne par point gagné. C'est la seule vérité : les compteurs s'en
-- déduisent, l'archive s'en déduit, et le jour où un total serait faux, c'est
-- d'ici qu'on le refera.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "points_gagnes" (
  "id"       TEXT         NOT NULL,
  "saisonId" TEXT         NOT NULL,

  -- La FICHE, et non le compte : un post RP est écrit par un personnage.
  -- Nulle si le compte a été supprimé — la ligne, elle, reste, et le compteur
  -- de la maison ne bouge pas. Un total qui baisserait parce que quelqu'un
  -- s'en va punirait sa maison de son départ.
  "eleveId"  TEXT,

  -- **La maison est figée au moment du gain**, comme l'année d'un sujet à son
  -- ouverture. Elle n'est pas relue sur la fiche, et c'est tout l'intérêt :
  -- une joueuse de Bryggeld nommée professeure quitte l'effectif sans que sa
  -- maison perde ce qu'elle a vraiment gagné pour elle.
  --
  -- Nulle quand le compte ne marquait pour personne — un professeur peut
  -- gagner des points personnels, jamais des points de maison.
  "maison"   "Maison",

  -- Un aujourd'hui. La colonne existe pour que « un post vaut un point » soit
  -- un réglage et non une vérité gravée dans la forme du carnet.
  "points"   INTEGER      NOT NULL DEFAULT 1,

  "source"   "SourcePoint" NOT NULL,

  -- Le post qui l'a produit. Nul pour les sources à venir.
  "postId"   TEXT,

  -- **Le point masqué.** Un post masqué le temps d'une correction (art. 19.3)
  -- cesse de rapporter, et retrouve son point au démasquage. La ligne n'est
  -- pas effacée : elle porte une date, et cesse de compter tant qu'elle la
  -- porte. C'est ce qui rend le geste réversible à l'identique.
  --
  -- ⚠️ À ne pas confondre avec un post RETIRÉ, qui garde ses points —
  -- décision du joueur, 27 août 2026 : « les points acquis restent acquis »
  -- (art. 17.2). Retirer est le geste de l'auteur sur son propre texte ;
  -- masquer est une mesure du staff, temporaire.
  "repriseLe" TIMESTAMP(3),

  "gagneLe"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "points_gagnes_pkey" PRIMARY KEY ("id")
);

-- Une ligne qui ne vaut rien n'est pas une trace, c'est du bruit.
ALTER TABLE "points_gagnes" ADD CONSTRAINT "points_gagnes_valeur_non_nulle" CHECK (
  "points" <> 0
);

-- L'accord entre la source et le post, **dans les deux sens** : un point de
-- post porte un post, un point de QCM n'en porte aucun. Vérifier un seul sens
-- laisserait passer la moitié des incohérences — même principe que l'accord
-- entre une permission et sa portée.
ALTER TABLE "points_gagnes" ADD CONSTRAINT "points_gagnes_source_et_post" CHECK (
  ("source" = 'POST'  AND "postId" IS NOT NULL)
  OR ("source" <> 'POST' AND "postId" IS NULL)
);

-- ⚠️ **Un post ne peut jamais donner deux points**, et c'est la base qui le
-- garantit : un double clic, un rejeu de route, un bug futur — rien ne peut
-- créditer deux fois le même texte.
--
-- L'index est PARTIEL, et ce n'est pas un raffinement. Dans un index unique,
-- Postgres tient deux `NULL` pour distincts : sans `WHERE`, il laisserait
-- passer autant de lignes sans post qu'on veut — ce qu'on souhaite pour les
-- futurs QCM — mais la clause rend la chose lisible plutôt que fortuite.
-- C'est le cousin exact des deux index partiels du lot des pouvoirs.
CREATE UNIQUE INDEX "points_gagnes_un_seul_par_post"
  ON "points_gagnes" ("postId")
  WHERE "postId" IS NOT NULL;

-- Le plafond quotidien se lit par élève et par jour ; le recalcul, par saison.
CREATE INDEX "points_gagnes_par_eleve" ON "points_gagnes" ("eleveId", "gagneLe");
CREATE INDEX "points_gagnes_par_saison" ON "points_gagnes" ("saisonId", "maison");

-- On ne supprime pas une saison qui porte des points : `RESTRICT`. Une saison
-- close est une archive, et une archive ne s'efface pas par mégarde.
ALTER TABLE "points_gagnes" ADD CONSTRAINT "points_gagnes_saisonId_fkey"
  FOREIGN KEY ("saisonId") REFERENCES "saisons_scolaires"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- La fiche part, la ligne reste. Voir le commentaire de la colonne.
ALTER TABLE "points_gagnes" ADD CONSTRAINT "points_gagnes_eleveId_fkey"
  FOREIGN KEY ("eleveId") REFERENCES "eleves"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- `RESTRICT` et non `CASCADE` : effacer un post pour de bon emporterait son
-- point sans passer par le compteur, qui resterait faux en silence. Le site
-- n'efface jamais vraiment un post — il le retire —, donc rien ne se heurte à
-- cette règle ; et le jour où quelqu'un tentera la commande à la main, elle
-- l'arrêtera au bon moment.
ALTER TABLE "points_gagnes" ADD CONSTRAINT "points_gagnes_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "posts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- **Une ligne du carnet ne se réécrit pas.** Seule la reprise se pose et se
-- retire — c'est le masquage et le démasquage. Sans ce déclencheur, la maison
-- figée ne serait qu'une intention, et une commande de reprise mal écrite
-- pourrait déplacer des points d'une maison à l'autre sans que personne le
-- voie. Même procédé que le type d'une conversation et que l'année d'un sujet.
--
-- La fiche peut être EFFACÉE, jamais REMPLACÉE : refuser aussi l'effacement
-- rendrait un compte indestructible. Même écart, et pour la même raison, que
-- la personne visée d'un signalement.
CREATE OR REPLACE FUNCTION "point_gagne_fige"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."saisonId" IS DISTINCT FROM OLD."saisonId"
     OR NEW."maison" IS DISTINCT FROM OLD."maison"
     OR NEW."points" IS DISTINCT FROM OLD."points"
     OR NEW."source" IS DISTINCT FROM OLD."source"
     OR NEW."postId" IS DISTINCT FROM OLD."postId"
     OR NEW."gagneLe" IS DISTINCT FROM OLD."gagneLe" THEN
    RAISE EXCEPTION 'Une ligne du carnet des points est figée (point %)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW."eleveId" IS DISTINCT FROM OLD."eleveId" AND NEW."eleveId" IS NOT NULL THEN
    RAISE EXCEPTION 'Un point ne change pas d''élève (point %)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "points_gagnes_figes"
  BEFORE UPDATE ON "points_gagnes"
  FOR EACH ROW EXECUTE FUNCTION "point_gagne_fige"();

-- ─────────────────────────────────────────────────────────────
-- 5 — Les ajustements de l'administration (art. 19.1).
--
-- Table séparée du carnet, et la séparation est la règle elle-même : un
-- ajustement n'a pas d'élève, et ne touche **que** le compteur de la maison.
-- Le ranger dans le carnet le ferait tôt ou tard entrer dans les points
-- personnels par une somme distraite.
--
-- Ce sont des points visibles de tous : ils ne doivent jamais apparaître sans
-- explication. D'où le motif obligatoire — en base, pas seulement à l'écran.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "ajustements_maison" (
  "id"       TEXT         NOT NULL,
  "saisonId" TEXT         NOT NULL,
  "maison"   "Maison"     NOT NULL,

  -- Signé : un retrait est un nombre négatif. Deux colonnes « sens » et
  -- « nombre » diraient la même chose en deux endroits.
  "points"   INTEGER      NOT NULL,

  -- Affiché dans l'historique public de la maison. Obligatoire.
  "motif"    TEXT         NOT NULL,

  -- « L'Administration » : la zone d'administration n'a pas de comptes
  -- distincts, il n'y a personne d'autre à nommer. Même choix que `closPar`
  -- et que `roleAffichePosePar`.
  "parNom"   TEXT         NOT NULL,

  -- **Réversible sans effacement.** Annuler pose une date ; l'histoire garde
  -- le geste ET son retrait. Un retrait de points qui disparaîtrait de
  -- l'historique serait pire qu'un retrait injuste.
  "annuleLe"  TIMESTAMP(3),
  "annulePar" TEXT,

  "creeLe"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ajustements_maison_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ajustements_maison" ADD CONSTRAINT "ajustements_maison_valeur_non_nulle" CHECK (
  "points" <> 0
);

ALTER TABLE "ajustements_maison" ADD CONSTRAINT "ajustements_maison_motif_non_vide" CHECK (
  "motif" ~ '[^[:space:]]'
);

ALTER TABLE "ajustements_maison" ADD CONSTRAINT "ajustements_maison_parNom_non_vide" CHECK (
  "parNom" ~ '[^[:space:]]'
);

-- Les deux colonnes de l'annulation vont ensemble ou pas du tout : une
-- annulation dont on ignore l'auteur ne se relit pas, et un nom
-- d'annulateur sans annulation ne veut rien dire.
ALTER TABLE "ajustements_maison" ADD CONSTRAINT "ajustements_maison_annulation_coherente" CHECK (
  ("annuleLe" IS NULL AND "annulePar" IS NULL)
  OR ("annuleLe" IS NOT NULL AND "annulePar" IS NOT NULL)
);

CREATE INDEX "ajustements_maison_par_saison"
  ON "ajustements_maison" ("saisonId", "maison", "creeLe");

ALTER TABLE "ajustements_maison" ADD CONSTRAINT "ajustements_maison_saisonId_fkey"
  FOREIGN KEY ("saisonId") REFERENCES "saisons_scolaires"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Le geste est figé, l'annulation est le seul champ mobile. Sans cela, un
-- ajustement de −50 points pourrait devenir un +50 après coup, motif compris,
-- et l'historique public mentirait.
CREATE OR REPLACE FUNCTION "ajustement_maison_fige"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."saisonId" IS DISTINCT FROM OLD."saisonId"
     OR NEW."maison" IS DISTINCT FROM OLD."maison"
     OR NEW."points" IS DISTINCT FROM OLD."points"
     OR NEW."motif"  IS DISTINCT FROM OLD."motif"
     OR NEW."parNom" IS DISTINCT FROM OLD."parNom"
     OR NEW."creeLe" IS DISTINCT FROM OLD."creeLe" THEN
    RAISE EXCEPTION 'Un ajustement de points est figé (ajustement %)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ajustements_maison_figes"
  BEFORE UPDATE ON "ajustements_maison"
  FOR EACH ROW EXECUTE FUNCTION "ajustement_maison_fige"();

-- ─────────────────────────────────────────────────────────────
-- 6 — Le tableau des quatre compteurs.
--
-- Le résumé, tenu à jour dans la même transaction que le carnet. Il n'apporte
-- aucune vérité nouvelle : il évite seulement de refaire l'addition de toute
-- une saison à chaque bureau ouvert — et le bureau est la page la plus
-- visitée du site.
--
-- **Aucune contrainte `points >= 0`**, à dessein, et pour la même raison qu'à
-- la migration précédente : le règlement fait perdre des points (art. 18.6) et
-- en retirer à une maison (art. 19.1) sans dire si un total peut passer sous
-- zéro. Poser la contrainte aujourd'hui trancherait à la place du joueur une
-- règle qu'il n'a pas écrite.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "compteurs_maison" (
  "id"       TEXT         NOT NULL,
  "saisonId" TEXT         NOT NULL,
  "maison"   "Maison"     NOT NULL,
  "points"   INTEGER      NOT NULL DEFAULT 0,
  "majLe"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "compteurs_maison_pkey" PRIMARY KEY ("id")
);

-- Quatre lignes par saison, jamais cinq, jamais deux fois la même maison.
CREATE UNIQUE INDEX "compteurs_maison_saison_maison_key"
  ON "compteurs_maison" ("saisonId", "maison");

ALTER TABLE "compteurs_maison" ADD CONSTRAINT "compteurs_maison_saisonId_fkey"
  FOREIGN KEY ("saisonId") REFERENCES "saisons_scolaires"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 7 — L'archive du classement.
--
-- À la clôture, quatre lignes figées : ce que valait chaque maison ce
-- jour-là. **Figées, jamais recalculées** — l'effectif de mars n'est pas
-- celui d'octobre, et un classement qui changerait après coup ne serait pas
-- une archive. Même principe que `placeConservee` et que
-- `anneeRequiseALOuverture`.
--
-- La moyenne y est recopiée telle quelle plutôt que redéduite des deux autres
-- colonnes : le plancher de trois élèves est un réglage, et il pourrait
-- changer. Ce qui est archivé doit rester lisible avec les règles de son
-- époque.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "classements_archives" (
  "id"       TEXT             NOT NULL,
  "saisonId" TEXT             NOT NULL,
  "maison"   "Maison"         NOT NULL,
  "points"   INTEGER          NOT NULL,
  "effectif" INTEGER          NOT NULL,
  "moyenne"  DOUBLE PRECISION NOT NULL,
  -- 1 à 4. La maison gagnante est celle de rang 1 — pas de colonne
  -- « gagnante » : deux façons de dire la même chose finiraient par se
  -- contredire. Les ex æquo partagent leur rang, il n'est donc pas unique.
  "rang"     INTEGER          NOT NULL,
  "figeLe"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "classements_archives_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "classements_archives" ADD CONSTRAINT "classements_archives_effectif_positif" CHECK (
  "effectif" >= 0
);

ALTER TABLE "classements_archives" ADD CONSTRAINT "classements_archives_rang_valide" CHECK (
  "rang" BETWEEN 1 AND 4
);

CREATE UNIQUE INDEX "classements_archives_saison_maison_key"
  ON "classements_archives" ("saisonId", "maison");

ALTER TABLE "classements_archives" ADD CONSTRAINT "classements_archives_saisonId_fkey"
  FOREIGN KEY ("saisonId") REFERENCES "saisons_scolaires"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Une archive ne se retouche pas. Aucune colonne mobile, aucune exception :
-- ce n'est pas un état, c'est un souvenir. Même procédé que la copie figée
-- d'un signalement.
CREATE OR REPLACE FUNCTION "classement_archive_fige"() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Un classement archivé ne se réécrit pas (ligne %)', OLD."id"
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "classements_archives_figes"
  BEFORE UPDATE ON "classements_archives"
  FOR EACH ROW EXECUTE FUNCTION "classement_archive_fige"();

-- ─────────────────────────────────────────────────────────────
-- 8 — L'archivage d'un compte (art. 7.3), et la dernière connexion.
--
-- « Après trois mois d'inactivité, le compte peut être archivé. Le retour
-- reste possible : le personnage est restauré avec sa progression. »
--
-- Un compte archivé **sort de l'effectif** de sa maison, et rien d'autre : il
-- n'est pas mis à la porte. C'est ce qui distingue l'archivage d'une sanction,
-- et c'est pourquoi il ne touche pas à `statutAcces`. Une connexion suffit à
-- le lever — l'article le promet, le code doit le tenir sans qu'il faille
-- écrire à l'administration.
--
-- `derniereConnexionLe` est ce qui permet de savoir QUI archiver. La base n'en
-- gardait aucune trace : ni date de connexion, ni date d'activité. On ne
-- pouvait donc pas appliquer l'article 7.3 du tout.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "utilisateurs"
  ADD COLUMN "derniereConnexionLe" TIMESTAMP(3),
  ADD COLUMN "archiveLe"           TIMESTAMP(3),
  ADD COLUMN "archivePar"          TEXT;

ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_archivage_coherent" CHECK (
  ("archiveLe" IS NULL AND "archivePar" IS NULL)
  OR ("archiveLe" IS NOT NULL AND "archivePar" IS NOT NULL)
);

-- L'écran d'archivage trie par ancienneté de connexion : les plus absents en
-- tête. L'index ne porte que les comptes encore actifs — les archivés n'ont
-- plus à être parcourus.
CREATE INDEX "utilisateurs_actifs_par_connexion"
  ON "utilisateurs" ("derniereConnexionLe")
  WHERE "archiveLe" IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 9 — La première saison, et ses quatre compteurs à zéro.
--
-- Une saison doit exister avant le premier point : sans elle, le premier post
-- écrit après cette migration n'aurait nulle part où poser sa ligne.
--
-- Les quatre compteurs sont posés ensemble, à zéro. Les créer à la demande
-- ferait qu'une maison sans point n'aurait pas de ligne, et disparaîtrait du
-- tableau — exactement ce que `totauxVides` évite depuis le premier jour.
-- ─────────────────────────────────────────────────────────────
INSERT INTO "saisons_scolaires" ("id", "nom", "ouverteLe")
VALUES ('saison-1', 'Première session — 2026', NOW());

INSERT INTO "compteurs_maison" ("id", "saisonId", "maison", "points", "majLe")
VALUES
  ('compteur-1-kaldrafn', 'saison-1', 'KALDRAFN', 0, NOW()),
  ('compteur-1-nattorm',  'saison-1', 'NATTORM',  0, NOW()),
  ('compteur-1-bryggeld', 'saison-1', 'BRYGGELD', 0, NOW()),
  ('compteur-1-tideal',   'saison-1', 'TIDEAL',   0, NOW());
