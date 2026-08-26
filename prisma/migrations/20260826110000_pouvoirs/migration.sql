-- Les pouvoirs — permissions attribuables et préfets.
--
-- Jusqu'ici, les droits d'un membre tenaient à deux colonnes : l'état de son
-- dossier et son statut d'accès. Il manquait tout le reste — écrire les
-- annonces d'une maison, clore une scène, épingler un sujet. Ce sont des
-- charges qui ne suivent ni le rôle technique ni le titre affiché : la
-- directrice du château n'est pas modératrice du site, et peut pourtant
-- écrire les annonces des quatre maisons.
--
-- Cette migration est entièrement ADDITIVE : deux tables neuves, quatre
-- valeurs ajoutées au journal, et pas une ligne existante réécrite.
--
-- Trois règles sont posées ici plutôt que dans le code, parce qu'une
-- précaution écrite en TypeScript ne protège que les chemins qu'on a pensé à
-- protéger — pas un script, pas une commande tapée à la main :
--
--   • une permission de maison porte une maison, une permission globale n'en
--     porte aucune — dans les deux sens
--   • une même permission ne s'accorde pas deux fois au même compte, y
--     compris quand elle n'a pas de maison, ce que Postgres ne garantit PAS
--     tout seul
--   • un préfet ne se nomme pas deux fois pour la même maison
--
-- Ce que cette migration ne fait PAS, et ne fera jamais : ouvrir un accès aux
-- conversations privées. Aucune des cinq permissions ne nomme la Tour aux
-- Corbeaux. La sixième n'existe pas.

-- ─────────────────────────────────────────────────────────────
-- 1 — Le journal apprend quatre événements.
--
-- Posés en premier et jamais employés dans ce fichier : Postgres n'accepte
-- une nouvelle valeur d'enum qu'après validation de la transaction qui
-- l'ajoute. Même précaution que `20260825210000_role_affiche`.
--
-- C'est ce journal-là qui porte la traçabilité demandée — qui, quoi, quand,
-- sur quelle maison. Retirer une permission efface sa ligne ; seule
-- l'histoire, ici, garde la trace du retrait.
-- ─────────────────────────────────────────────────────────────
ALTER TYPE "EvenementMembre" ADD VALUE 'PERMISSION_ACCORDEE';
ALTER TYPE "EvenementMembre" ADD VALUE 'PERMISSION_RETIREE';
ALTER TYPE "EvenementMembre" ADD VALUE 'PREFET_NOMME';
ALTER TYPE "EvenementMembre" ADD VALUE 'PREFET_DEMIS';

-- ─────────────────────────────────────────────────────────────
-- 2 — La liste fermée des permissions.
--
-- Cinq valeurs. Les deux premières portent sur une maison, les trois autres
-- sur tout le forum — et c'est la contrainte du point 4 qui fait tenir cette
-- distinction, pas la bonne volonté de l'appelant.
-- ─────────────────────────────────────────────────────────────
CREATE TYPE "Permission" AS ENUM (
  'ANNONCES_MAISON',
  'LIRE_ESPACES_MAISON',
  'CLORE_SCENE',
  'EPINGLER_SUJET',
  'VERROUILLER_SECTION'
);

-- ─────────────────────────────────────────────────────────────
-- 3 — Les permissions accordées.
--
-- Une ligne par maison, jamais un NULL qui voudrait dire « toutes ». Les
-- quatre maisons s'écrivent avec quatre lignes, posées ensemble et retirées
-- ensemble. Le raccourci inverse ferait porter deux sens à la même case —
-- « toutes les maisons » ici, « sans objet » là —, et c'est exactement ce que
-- `EtatEtape` a été inventé pour éviter.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "permissions_accordees" (
  "id"            TEXT NOT NULL,
  "utilisateurId" TEXT NOT NULL,
  "permission"    "Permission" NOT NULL,
  "maison"        "Maison",
  "accordeeLe"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accordeePar"   TEXT NOT NULL,

  CONSTRAINT "permissions_accordees_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "permissions_accordees"
  ADD CONSTRAINT "permissions_accordees_utilisateurId_fkey"
  FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "permissions_accordees_utilisateurId_idx"
  ON "permissions_accordees"("utilisateurId");

-- « Qui détient quoi ? » — la page d'ensemble lit par là.
CREATE INDEX "permissions_accordees_permission_maison_idx"
  ON "permissions_accordees"("permission", "maison");

-- ─────────────────────────────────────────────────────────────
-- 4 — Une permission porte sa portée, et rien d'autre.
--
-- L'accord se vérifie dans les DEUX sens : une permission de maison sans
-- maison n'aurait aucune portée — à qui donne-t-elle le droit d'écrire ? —,
-- et une permission globale avec une maison en aurait deux, dont personne ne
-- saurait laquelle l'emporte.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "permissions_accordees"
  ADD CONSTRAINT "permissions_accordees_portee" CHECK (
    ("permission" IN ('ANNONCES_MAISON', 'LIRE_ESPACES_MAISON'))
    = ("maison" IS NOT NULL)
  );

-- ─────────────────────────────────────────────────────────────
-- 5 — Une permission ne s'accorde pas deux fois. Les DEUX index.
--
-- Le piège est ici, et il ne se voit pas : dans un index unique, Postgres
-- tient deux NULL pour DISTINCTS. Un unique ordinaire sur
-- ("utilisateurId", "permission", "maison") laisserait donc accorder
-- `CLORE_SCENE` autant de fois qu'on veut au même compte — la retirer une
-- fois n'en retirerait qu'une, et le pouvoir survivrait au retrait.
--
-- C'est le cousin exact du piège des trois valeurs déjà rencontré dans la
-- Tour, avec `not` de Prisma qui laissait tomber les auteurs nuls.
--
-- D'où deux index partiels qui se partagent la table sans se recouvrir.
-- ─────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX "permissions_accordees_globale_unique"
  ON "permissions_accordees"("utilisateurId", "permission")
  WHERE "maison" IS NULL;

CREATE UNIQUE INDEX "permissions_accordees_maison_unique"
  ON "permissions_accordees"("utilisateurId", "permission", "maison")
  WHERE "maison" IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 6 — Les préfets.
--
-- Ancrés sur la fiche et non sur le compte : être préfet est une charge du
-- personnage, et c'est la maison de la fiche qu'on lit à côté.
--
-- Plusieurs préfets par maison — un même élève peut même l'être de
-- plusieurs. La contrainte n'interdit que de le nommer deux fois pour la
-- même : sans elle, le démettre une fois le laisserait préfet.
--
-- La maison n'est PAS contrainte à être la sienne. C'est une décision du
-- joueur, prise le 26 août 2026, et non un oubli : le jour où il faudra
-- l'imposer, ce sera un déclencheur de plus, ici.
--
-- Le droit d'écrire les annonces DÉRIVE de cette table. Nommer un préfet ne
-- crée aucune ligne dans `permissions_accordees` : sans quoi lui retirer le
-- titre laisserait le pouvoir derrière lui.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "prefets" (
  "id"       TEXT NOT NULL,
  "eleveId"  TEXT NOT NULL,
  "maison"   "Maison" NOT NULL,
  "nommeLe"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nommePar" TEXT NOT NULL,

  CONSTRAINT "prefets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "prefets"
  ADD CONSTRAINT "prefets_eleveId_fkey"
  FOREIGN KEY ("eleveId") REFERENCES "eleves"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "prefets_eleveId_maison_key" ON "prefets"("eleveId", "maison");
CREATE INDEX "prefets_maison_idx" ON "prefets"("maison");
