-- Le calendrier du Grand Hall — la troisième des cinq choses que la bible
-- (§12) y met : « règlement, annonces, calendrier, résultats, événements à
-- venir ».
--
-- ── « Calendrier » et « événements à venir » sont la MÊME table ──
--
-- Décision du joueur, 28 août 2026. Un événement porte une date ; le
-- calendrier montre tout, « à venir » est le filtre de ce qui n'a pas eu
-- lieu. Deux tables finiraient par dire deux choses différentes de la même
-- fête — et c'est toujours celle qu'on a oublié de corriger qu'un joueur
-- lirait.
--
-- ── Les dates sont celles du MONDE RÉEL ──
--
-- Décision du joueur, le même jour. « 12 septembre 2026 », et non une année
-- scolaire fictive : c'est ce qu'un joueur note dans son agenda, et la seule
-- chose dont « à venir » et le panneau du bureau puissent se servir. Le titre
-- porte le monde — « Trimestre d'automne » —, la colonne porte le temps.
--
-- ⚠️ **On compare des JOURS et l'on stocke un instant**, comme pour l'entrée
-- en vigueur d'une annonce : la date choisie est posée à **midi**. À minuit
-- UTC, la moitié de la planète lirait la veille. `calendrier/schema.ts` s'en
-- charge, et c'est la seule porte.
--
-- ── Trois natures, et elles décident de quelque chose ──
--
-- `EPREUVE` est la seule qui remonte au bureau, sous « Prochaines épreuves » —
-- un panneau qui annoncerait une fête sous ce titre se contredirait. `FETE`
-- porte la veillée des braises et la commémoration d'Einar ; `SESSION` le
-- rythme scolaire — rentrée, trimestres, clôture.
--
-- Une colonne qui ne déciderait de rien finirait par décider de quelque
-- chose : celle-ci décide, et c'est pourquoi elle existe.
--
-- ── Ce que cette migration ne contient PAS ──
--
-- Aucune permission attribuable n'ouvre ce geste, et il ne faut pas en
-- ajouter : le préambule fait du Grand Hall le seul lieu officiel
-- d'annonce. C'est une décision d'administration, pas une charge qu'on
-- délègue. Même règle que les annonces.
--
-- Aucun lien vers une annonce non plus. Le détail d'un événement s'écrit dans
-- une annonce, et le lien se fait par le titre : une clé étrangère qu'aucun
-- écran n'affiche est une colonne qui attend de décider de quelque chose.

-- ─────────────────────────────────────────────────────────────
-- 1 — La nature d'un événement.
-- ─────────────────────────────────────────────────────────────

CREATE TYPE "NatureEvenement" AS ENUM ('EPREUVE', 'FETE', 'SESSION');

-- ─────────────────────────────────────────────────────────────
-- 2 — La table.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "evenements" (
  "id"          TEXT NOT NULL,
  "titre"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "nature"      "NatureEvenement" NOT NULL,

  -- La date qui classe. Un événement sans date n'en est pas un.
  "debuteLe"    TIMESTAMP(3) NOT NULL,
  -- **Facultative** : un trimestre dure des mois, une veillée un soir.
  "finitLe"     TIMESTAMP(3),

  "posePar"     TEXT NOT NULL,
  "modifieLe"   TIMESTAMP(3),

  -- Retirer n'efface pas : les deux colonnes vont ensemble ou pas du tout.
  "retireLe"    TIMESTAMP(3),
  "retirePar"   TEXT,

  "creeLe"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "majLe"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "evenements_pkey" PRIMARY KEY ("id")
);

-- La page lit dans l'ordre du temps, et le bureau cherche la prochaine
-- épreuve : les deux passent par cette colonne.
CREATE INDEX "evenements_debuteLe_idx" ON "evenements"("debuteLe");

-- ─────────────────────────────────────────────────────────────
-- 3 — Ce que la base tient elle-même.
--
-- Une précaution écrite en TypeScript ne protège que les chemins qu'on a
-- pensé à protéger. Celles-ci valent pour le site, pour un script, et pour
-- une commande tapée à la main un soir de fatigue.
-- ─────────────────────────────────────────────────────────────

-- ⚠️ `btrim` de Postgres ne retire que les ESPACES — ni les retours à la
-- ligne, ni les tabulations. Un titre fait de six retours passerait.
-- Rencontré pour de bon sur les corbeaux, corrigé par
-- `20260826101000_corbeau_vraiment_non_vide`.
ALTER TABLE "evenements" ADD CONSTRAINT "evenements_titre_non_vide" CHECK (
  "titre" ~ '[^[:space:]]' AND length("titre") <= 140
);

ALTER TABLE "evenements" ADD CONSTRAINT "evenements_description_non_vide" CHECK (
  "description" ~ '[^[:space:]]' AND length("description") <= 2000
);

ALTER TABLE "evenements" ADD CONSTRAINT "evenements_pose_par_non_vide" CHECK (
  "posePar" ~ '[^[:space:]]'
);

ALTER TABLE "evenements" ADD CONSTRAINT "evenements_retrait_complet" CHECK (
  ("retireLe" IS NULL AND "retirePar" IS NULL)
  OR ("retireLe" IS NOT NULL AND "retirePar" IS NOT NULL)
);

-- ⚠️ **Cette contrainte-ci compare deux dates du MÊME formulaire**, saisies
-- par la même personne au même moment — et c'est la seule raison pour
-- laquelle elle est sûre.
--
-- Le salon a payé le piège inverse le 28 août 2026 : `retireLe >= ecritLe`
-- comparait l'horloge de Postgres (Francfort) à celle de Vercel, et quelques
-- millisecondes d'écart faisaient tomber un clic normal en erreur 500. Ne
-- jamais poser une contrainte entre deux instants qui viennent de deux
-- horloges différentes.
ALTER TABLE "evenements" ADD CONSTRAINT "evenements_fin_apres_debut" CHECK (
  "finitLe" IS NULL OR "finitLe" >= "debuteLe"
);
