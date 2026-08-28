-- Le Grand Hall — les annonces officielles du château.
--
-- ── Pourquoi cette table existe ──
--
-- Le site promet déjà le Grand Hall, dans le texte que chaque membre accepte
-- à l'inscription : « toute adaptation d'une règle existante comme tout ajout
-- est affiché dans le Grand Hall, et entre en vigueur sept jours après son
-- affichage […] le Grand Hall est le seul lieu officiel d'annonce en la
-- matière. » Ce lieu n'existait pas. Tant qu'il manquait, il n'y avait aucun
-- moyen conforme de faire évoluer le règlement.
--
-- ── Une table à part, et non un quatrième espace de forum ──
--
-- Décision du joueur, 28 août 2026. La bible (§12) dit du Grand Hall qu'« on
-- y lit, on n'y débat pas » — or le moteur du forum ne sait pas exprimer
-- cela : `QuiRepond` ne connaît que TOUT_MEMBRE et MEMBRES_MAISON, et fermer
-- le lieu ferait taire le staff avec les autres. Il aurait fallu lui ajouter
-- une valeur, c'est-à-dire une porte qu'on peut rouvrir par mégarde.
--
-- Et une annonce n'est pas une scène : ni année exigée, ni clôture, ni
-- épinglage, ni réponses. Ces colonnes-là auraient été vides, et une colonne
-- qui ne décide de rien finit toujours par décider de quelque chose.
--
-- ── Ce que la base garantit elle-même ──
--
-- Six garanties, et aucune ne se déduit du schéma Prisma.
--
-- Elle est entièrement ADDITIVE : une table neuve, pas une ligne existante
-- réécrite.

-- ─────────────────────────────────────────────────────────────
-- La table.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "annonces" (
  "id"    TEXT NOT NULL,
  "titre" TEXT NOT NULL,

  -- Le texte, **en balisage** — la même liste blanche que les posts, le même
  -- éditeur. Une annonce qui ne pourrait ni mettre un mot en gras ni poser un
  -- lien vers le règlement serait un pense-bête, pas une annonce.
  "corps" TEXT NOT NULL,

  -- La date d'AFFICHAGE, et c'est elle qui fait courir les sept jours du
  -- préambule. Elle est choisie à la publication et ne bouge plus : une
  -- annonce qu'on antidaterait ferait courir un délai déjà écoulé.
  "publieeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- **Facultative.** Renseignée, l'écran annonce « En vigueur le 4 septembre »
  -- ; vide, l'annonce est ordinaire et ne promet aucune date. Le site ne
  -- calcule rien tout seul et ne bloque rien : les sept jours sont une règle
  -- du joueur, pas un minuteur.
  "entreeEnVigueurLe" TIMESTAMP(3),

  -- La marque « modifié le », comme sur un post : on doit voir qu'un texte a
  -- bougé depuis qu'on l'a lu. Une annonce est justement ce qu'on lit une
  -- fois.
  "modifieLe" TIMESTAMP(3),

  -- **Retirer n'efface pas** — rien ne s'efface sur ce site. L'annonce sort
  -- du Grand Hall et du journal, et reste entière en base : une annonce qui
  -- a fait courir un délai doit rester consultable, ne serait-ce que pour
  -- savoir ce qui a été annoncé et quand.
  "retireeLe"  TIMESTAMP(3),
  "retireePar" TEXT,

  -- « Administration » : la zone d'administration n'a pas de comptes
  -- distincts, il n'y a personne d'autre à nommer. Même convention que
  -- `eleves.roleAffichePosePar`.
  "posePar" TEXT NOT NULL,

  "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "annonces_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────────────────────
-- Ce que la base refuse.
-- ─────────────────────────────────────────────────────────────

-- `btrim` de Postgres ne retire QUE les espaces : ni les retours à la ligne,
-- ni les tabulations. La forme qui les compte, c'est celle-ci. Piège déjà
-- rencontré sur le corps d'un corbeau, puis sur le nom d'une saison.
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_titre_non_vide" CHECK (
  "titre" ~ '[^[:space:]]'
);

ALTER TABLE "annonces" ADD CONSTRAINT "annonces_titre_borne" CHECK (
  length("titre") <= 140
);

-- Volontairement GROSSIER, comme pour un post : la base n'arrête que ce qui
-- casserait l'affichage, et le fait sur tous les chemins — le site, un
-- script, une commande tapée à la main. Le travail fin — « <p></p> » ne porte
-- rien — vit dans `lib/annonces/schema.ts`, seule porte d'entrée.
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_corps_non_vide" CHECK (
  "corps" ~ '[^[:space:]]'
);

ALTER TABLE "annonces" ADD CONSTRAINT "annonces_corps_borne" CHECK (
  length("corps") <= 60000
);

-- Les deux colonnes du retrait vont ENSEMBLE ou pas du tout. Une annonce
-- retirée sans qui l'a retirée ne se relit pas six mois plus tard ; un
-- « retirée par » sans date ne veut rien dire du tout. Même forme que les
-- trois colonnes du rôle affiché et que la clôture d'une scène.
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_retrait_complet" CHECK (
  ("retireeLe" IS NULL) = ("retireePar" IS NULL)
);

ALTER TABLE "annonces" ADD CONSTRAINT "annonces_pose_par_non_vide" CHECK (
  "posePar" ~ '[^[:space:]]'
);

-- **Une entrée en vigueur n'est jamais antérieure à l'affichage.** Le
-- préambule fait courir le délai depuis l'affichage : une date d'avant
-- annoncerait une règle déjà en vigueur avant d'avoir été publiée, ce qui est
-- exactement ce que l'article interdit.
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_vigueur_apres_affichage" CHECK (
  "entreeEnVigueurLe" IS NULL OR "entreeEnVigueurLe" >= "publieeLe"
);

-- ─────────────────────────────────────────────────────────────
-- La lecture.
-- ─────────────────────────────────────────────────────────────

-- Le Grand Hall et le journal du bureau posent la même question : les
-- dernières annonces non retirées, de la plus récente à la plus ancienne. Le
-- journal la pose sur CHAQUE bureau.
CREATE INDEX "annonces_publieeLe_idx" ON "annonces" ("publieeLe" DESC);
