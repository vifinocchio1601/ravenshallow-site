-- Les partenariats — la première voie de recrutement du forum (bible §15).
--
-- « Les partenariats croisés entre forums donnent de bien meilleurs résultats
-- que les annuaires et les tops de vote. » C'est écrit dans la bible, et
-- pourtant la seule chose qui manquait était une adresse où un forum ami
-- puisse voir nos bannières et laisser les siennes.
--
-- ── Pourquoi une page PUBLIQUE, et donc une table à part ──
--
-- Tout le site est derrière la connexion. Une section de forum réservée aux
-- partenariats — c'est ce que le lot du hors RP avait envisagé, puis écarté —
-- ne sert à personne : le forum démarcheur qui nous écrit n'a pas de compte,
-- et n'en ouvrira pas pour proposer un échange de bannières.
--
-- Ces deux tables sont donc les seules du site dont le contenu s'affiche à qui
-- n'est pas connecté. C'est voulu, et c'est la raison d'être du lot.
--
-- ── Ce que chaque table porte ──
--
-- `partenaires` : le bloc de liens, tenu depuis /admin/partenaires.
-- `demandes_partenariat` : ce que le formulaire public dépose.
--
-- Deux tables et non une : une demande refusée n'est pas un partenaire retiré,
-- et une ligne qui porterait les deux sens finirait par en décider un à
-- l'insu de tout le monde.
--
-- ── Ce que cette migration ne contient PAS ──
--
-- **Aucune adresse IP, pas même sous forme d'empreinte.** La politique de
-- confidentialité écrit que le site n'en conserve pas ; le frein anti-spam se
-- lit donc sur `recuLe`, et sur rien d'autre. Une page légale fausse est pire
-- qu'absente.
--
-- **Aucune permission attribuable.** Comme les annonces et le calendrier :
-- nouer un partenariat engage le site entier, c'est une décision
-- d'administration et non une charge qu'on délègue. Ne pas l'ajouter à
-- `Permission`.

-- ─────────────────────────────────────────────────────────────
-- 1 — La suite donnée à une demande.
-- ─────────────────────────────────────────────────────────────

CREATE TYPE "SuiteDemande" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- ─────────────────────────────────────────────────────────────
-- 2 — Les partenaires.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "partenaires" (
  "id"          TEXT NOT NULL,
  "nom"         TEXT NOT NULL,
  "url"         TEXT NOT NULL,
  -- Facultative : leur bannière reste chez eux, et tous n'en ont pas.
  "banniereUrl" TEXT,
  "description" TEXT,

  -- Saisi, jamais deviné : on renoue parfois avec un forum connu de longue
  -- date, et « noué le » n'est pas « ajouté ici le ».
  "noueLe"      TIMESTAMP(3) NOT NULL,
  "modifieLe"   TIMESTAMP(3),

  -- Retirer n'efface pas : les deux colonnes vont ensemble ou pas du tout.
  "retireLe"    TIMESTAMP(3),
  "retirePar"   TEXT,

  "creeLe"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "majLe"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "partenaires_pkey" PRIMARY KEY ("id")
);

-- Le bloc se lit dans l'ordre alphabétique — jamais par date d'ajout : un
-- classement par ancienneté classerait des partenaires, et personne ne l'a
-- demandé.
CREATE INDEX "partenaires_nom_idx" ON "partenaires"("nom");

-- ⚠️ **Index unique PARTIEL**, et le partiel est tout le sujet.
--
-- Sans le `WHERE`, un partenariat rompu interdirait pour toujours de renouer
-- avec le même forum — sa ligne reste, puisque le retrait n'efface pas. Avec
-- lui, un même forum ne peut pas figurer deux fois au bloc, et revient quand
-- on le veut.
--
-- Prisma ne sait pas exprimer un index partiel : il vit ici, et seulement ici.
-- Cousin exact du piège déjà payé sur `permissions_accordees`.
CREATE UNIQUE INDEX "partenaires_url_unique_actifs"
  ON "partenaires"("url") WHERE "retireLe" IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 3 — Les demandes déposées par le formulaire public.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "demandes_partenariat" (
  "id"         TEXT NOT NULL,
  "nomDuForum" TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "courriel"   TEXT NOT NULL,
  "message"    TEXT NOT NULL,

  "suite"      "SuiteDemande" NOT NULL DEFAULT 'EN_ATTENTE',
  "traiteLe"   TIMESTAMP(3),

  "recuLe"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "demandes_partenariat_pkey" PRIMARY KEY ("id")
);

-- L'écran d'administration les lit de la plus récente à la plus ancienne, et
-- le frein anti-spam compte celles de la dernière heure : les deux passent
-- par cette colonne.
CREATE INDEX "demandes_partenariat_recuLe_idx"
  ON "demandes_partenariat"("recuLe" DESC);

-- ─────────────────────────────────────────────────────────────
-- 4 — Ce que la base tient elle-même.
--
-- Une précaution écrite en TypeScript ne protège que les chemins qu'on a
-- pensé à protéger. Celles-ci valent pour le site, pour un script, et pour
-- une commande tapée à la main un soir de fatigue.
-- ─────────────────────────────────────────────────────────────

-- ⚠️ `btrim` ne retire que les ESPACES — ni les retours à la ligne, ni les
-- tabulations. Un nom fait de six retours passerait. Rencontré pour de bon
-- sur les corbeaux, corrigé par `20260826101000_corbeau_vraiment_non_vide`.
ALTER TABLE "partenaires" ADD CONSTRAINT "partenaires_nom_non_vide" CHECK (
  "nom" ~ '[^[:space:]]' AND length("nom") <= 80
);

-- **`https` seulement**, et la même règle que les images d'un post : le site
-- n'envoie pas ses visiteurs sur du trafic en clair, et une adresse en `http`
-- déclencherait l'avertissement du navigateur sur notre propre page.
ALTER TABLE "partenaires" ADD CONSTRAINT "partenaires_url_https" CHECK (
  "url" ~ '^https://[^[:space:]]' AND length("url") <= 300
);

ALTER TABLE "partenaires" ADD CONSTRAINT "partenaires_banniere_https" CHECK (
  "banniereUrl" IS NULL
  OR ("banniereUrl" ~ '^https://[^[:space:]]' AND length("banniereUrl") <= 400)
);

-- Absente ou pleine, jamais faite d'espaces : une description vide affichée
-- sous un nom laisse un blanc dont personne ne comprend l'origine.
ALTER TABLE "partenaires" ADD CONSTRAINT "partenaires_description_non_vide" CHECK (
  "description" IS NULL
  OR ("description" ~ '[^[:space:]]' AND length("description") <= 300)
);

ALTER TABLE "partenaires" ADD CONSTRAINT "partenaires_retrait_complet" CHECK (
  ("retireLe" IS NULL AND "retirePar" IS NULL)
  OR ("retireLe" IS NOT NULL AND "retirePar" IS NOT NULL)
);

ALTER TABLE "demandes_partenariat" ADD CONSTRAINT "demandes_nom_non_vide" CHECK (
  "nomDuForum" ~ '[^[:space:]]' AND length("nomDuForum") <= 80
);

ALTER TABLE "demandes_partenariat" ADD CONSTRAINT "demandes_url_https" CHECK (
  "url" ~ '^https://[^[:space:]]' AND length("url") <= 300
);

-- Volontairement **grossier** — un `@` entouré de quelque chose, et pas de
-- blanc. Le format fin vit dans `lib/partenariat/schema.ts`, seule source de
-- vérité ; la base n'arrête que ce qui rendrait la ligne inexploitable, et le
-- fait sur tous les chemins. Même partage que le rôle affiché.
ALTER TABLE "demandes_partenariat" ADD CONSTRAINT "demandes_courriel_plausible" CHECK (
  "courriel" ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  AND length("courriel") <= 200
);

ALTER TABLE "demandes_partenariat" ADD CONSTRAINT "demandes_message_non_vide" CHECK (
  "message" ~ '[^[:space:]]' AND length("message") <= 2000
);

-- **L'accord entre la suite et sa date, dans les deux sens.** Une demande
-- acceptée sans date de traitement ne se relit pas ; une date posée sur une
-- demande encore en attente ferait croire qu'on y a répondu.
ALTER TABLE "demandes_partenariat" ADD CONSTRAINT "demandes_suite_datee" CHECK (
  ("suite" = 'EN_ATTENTE' AND "traiteLe" IS NULL)
  OR ("suite" <> 'EN_ATTENTE' AND "traiteLe" IS NOT NULL)
);
