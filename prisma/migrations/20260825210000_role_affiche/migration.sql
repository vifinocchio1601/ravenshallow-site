-- Le rôle affiché — décoratif, et rien d'autre.
--
-- Un membre peut porter un titre au château : directrice, professeur
-- d'alchimie, bibliothécaire, intendant. Ces titres sont rares, variés, et on
-- en inventera d'autres : les enfermer dans un enum imposerait une migration
-- par nouveau titre. D'où un texte libre.
--
-- Ce texte REMPLACE l'année partout où elle s'affiche — une directrice n'est
-- pas en troisième année. Il n'OUVRE rien : aucun contrôle d'accès ne le lit,
-- et rien ici ne lui en donne le pouvoir. Les droits se décident dans
-- `lib/session/acces.ts`, sur le statut du dossier et le statut d'accès.

-- ─────────────────────────────────────────────────────────────
-- 1 — Le journal apprend un événement de plus.
--
-- Posé en premier et jamais employé dans ce fichier : Postgres n'accepte une
-- nouvelle valeur d'enum qu'après validation de la transaction qui l'ajoute.
-- ─────────────────────────────────────────────────────────────
ALTER TYPE "EvenementMembre" ADD VALUE 'ROLE_AFFICHE_MODIFIE';

-- ─────────────────────────────────────────────────────────────
-- 2 — Les trois colonnes.
--
-- Le titre, la date où il a été posé, et la main qui l'a posé. Cette dernière
-- vaut « Administration » tant que la zone d'administration n'est qu'un mot de
-- passe partagé : le site n'a personne d'autre à nommer. La colonne existe
-- quand même, pour le jour où des comptes distincts arriveront.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "eleves"
  ADD COLUMN "roleAffiche"        TEXT,
  ADD COLUMN "roleAffichePoseLe"  TIMESTAMP(3),
  ADD COLUMN "roleAffichePosePar" TEXT;

-- ─────────────────────────────────────────────────────────────
-- 3 — Les rôles déjà posés par la liste déroulante déménagent.
--
-- `PROFESSEUR` et `DIRECTION` vivaient jusqu'ici dans l'enum `Fonction`, à
-- côté des sept années. On les recopie en toutes lettres, accordés au genre
-- comme `libelleFonction` le faisait, puis on les retire de l'enum au point
-- suivant — sans quoi une directrice pourrait s'écrire de deux façons.
--
-- L'année, elle, doit rester renseignée : la colonne ne peut pas être vide, et
-- le rôle la masque de toute façon. On repose donc la valeur par défaut. Ce
-- n'est pas une affirmation sur le personnage — c'est une case invisible.
-- ─────────────────────────────────────────────────────────────
UPDATE "eleves"
SET "roleAffiche" = CASE
      WHEN "fonction" = 'DIRECTION'  AND "genre" = 'MASCULIN' THEN 'Directeur'
      WHEN "fonction" = 'DIRECTION'  AND "genre" = 'FEMININ'  THEN 'Directrice'
      WHEN "fonction" = 'DIRECTION'                           THEN 'Direction'
      WHEN "fonction" = 'PROFESSEUR' AND "genre" = 'FEMININ'  THEN 'Professeure'
      ELSE 'Professeur'
    END,
    "roleAffichePoseLe"  = NOW(),
    "roleAffichePosePar" = 'Administration',
    "fonction"           = 'PREMIERE_ANNEE'
WHERE "fonction" IN ('PROFESSEUR', 'DIRECTION');

-- ─────────────────────────────────────────────────────────────
-- 4 — `Fonction` ne garde que les sept années.
--
-- Postgres ne sait pas retirer une valeur d'un enum : il faut créer le type
-- neuf, y basculer la colonne, puis jeter l'ancien. La valeur par défaut est
-- retirée le temps de la bascule — elle porte encore l'ancien type.
--
-- L'index `eleves_fonction_idx` se reconstruit tout seul.
-- ─────────────────────────────────────────────────────────────
ALTER TYPE "Fonction" RENAME TO "Fonction_ancien";

CREATE TYPE "Fonction" AS ENUM (
  'PREMIERE_ANNEE',
  'DEUXIEME_ANNEE',
  'TROISIEME_ANNEE',
  'QUATRIEME_ANNEE',
  'CINQUIEME_ANNEE',
  'SIXIEME_ANNEE',
  'SEPTIEME_ANNEE'
);

ALTER TABLE "eleves" ALTER COLUMN "fonction" DROP DEFAULT;
ALTER TABLE "eleves"
  ALTER COLUMN "fonction" TYPE "Fonction" USING ("fonction"::text::"Fonction");
ALTER TABLE "eleves" ALTER COLUMN "fonction" SET DEFAULT 'PREMIERE_ANNEE';

DROP TYPE "Fonction_ancien";

-- ─────────────────────────────────────────────────────────────
-- 5 — Ce que la base garantit d'elle-même.
--
-- Comme pour la baguette : une précaution écrite en TypeScript ne protège que
-- les chemins qu'on a pensé à protéger. Celles-ci valent pour tous — le site,
-- un script, une commande tapée à la main.
--
-- Le format fin (lettres, espaces, apostrophes, tirets, points) reste dans le
-- schéma Zod partagé, seule source de vérité pour le formulaire et la route.
-- La base, elle, arrête seulement ce qui casserait l'affichage.
-- ─────────────────────────────────────────────────────────────

-- Les trois colonnes vont ensemble, ou pas du tout. Sans elle, un titre sans
-- date afficherait « Posé par l'Administration le » suivi de rien.
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_role_affiche_complet" CHECK (
  ("roleAffiche" IS NULL AND "roleAffichePoseLe" IS NULL AND "roleAffichePosePar" IS NULL)
  OR
  ("roleAffiche" IS NOT NULL AND "roleAffichePoseLe" IS NOT NULL AND "roleAffichePosePar" IS NOT NULL)
);

-- Un titre propre : 40 signes au plus, déjà rogné, sans espaces doublés, sans
-- chevron et sans caractère de contrôle — donc sans retour à la ligne.
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_role_affiche_propre" CHECK (
  "roleAffiche" IS NULL OR (
        char_length("roleAffiche") BETWEEN 1 AND 40
    AND "roleAffiche" = btrim("roleAffiche")
    AND "roleAffiche" !~ '  '
    AND "roleAffiche" !~ '[<>]'
    AND "roleAffiche" !~ '[[:cntrl:]]'
  )
);
