-- La Tour aux Corbeaux — la messagerie entre joueurs.
--
-- Un outil de coordination hors RP : on y cale une scène, on s'y met d'accord
-- sur une intrigue, on y fait connaissance. Aucune règle d'écriture RP ne s'y
-- applique, et aucun point ne s'y gagne.
--
-- Cette migration est entièrement additive : elle ne touche à aucune table
-- existante, n'efface rien et ne réécrit aucune ligne.
--
-- Quatre garanties sont posées ici plutôt que dans le code, parce qu'une
-- précaution écrite en TypeScript ne protège que les chemins qu'on a pensé à
-- protéger — pas un script, pas une commande tapée à la main :
--
--   • le type d'une conversation s'accorde avec sa clé, et NE CHANGE JAMAIS
--   • un corbeau n'est ni vide ni démesuré
--   • un signalement porte toujours sa copie du contexte
--   • et cette copie ne se réécrit pas

-- ─────────────────────────────────────────────────────────────
-- 1 — Les trois listes fermées.
-- ─────────────────────────────────────────────────────────────

CREATE TYPE "TypeConversation" AS ENUM ('ENTRE_MEMBRES', 'AVEC_ADMINISTRATION');

-- Pourquoi un message est caché à quelqu'un. Les deux raisons produisent le
-- même effet et n'ont pas du tout le même sens : distinguer les deux permet
-- de répondre plus tard à « ce message est-il arrivé ? » sans deviner.
CREATE TYPE "RaisonMasquage" AS ENUM ('SUPPRIME_PAR_SOI', 'BLOQUE');

CREATE TYPE "StatutSignalement" AS ENUM ('EN_ATTENTE', 'TRAITE', 'CLASSE_SANS_SUITE');

-- ─────────────────────────────────────────────────────────────
-- 2 — Les fils.
--
-- Aucune colonne « destinataire » : les participants vivent à part, et c'est
-- ce qui laissera passer à trois sans rien casser.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "conversations" (
  "id"               TEXT NOT NULL,
  "type"             "TypeConversation" NOT NULL DEFAULT 'ENTRE_MEMBRES',
  "clePaire"         TEXT NOT NULL,
  "ouvertParId"      TEXT,
  "dernierMessageLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "creeLe"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- Le verrou contre les fils en double. Deux membres qui s'écrivent au même
-- instant depuis deux onglets ne peuvent pas ouvrir deux conversations
-- parallèles, où chacun croirait que l'autre se tait.
CREATE UNIQUE INDEX "conversations_clePaire_key" ON "conversations"("clePaire");

-- Le tri de la liste : par activité récente.
CREATE INDEX "conversations_dernierMessageLe_idx" ON "conversations"("dernierMessageLe");

-- L'anti-démarchage (art. 3.6) compte sur ces deux colonnes-là, et n'a donc
-- besoin d'aucune table de compteurs à balayer.
CREATE INDEX "conversations_ouvertParId_creeLe_idx" ON "conversations"("ouvertParId", "creeLe");

-- ─────────────────────────────────────────────────────────────
-- 3 — Qui est dans le fil, et ce qu'il en a lu.
--
-- Les deux dates sont PERSONNELLES. C'est le principe de tout ce lot :
-- personne n'efface rien chez autrui.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "participations" (
  "id"             TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "utilisateurId"  TEXT NOT NULL,
  "luJusquau"      TIMESTAMP(3),
  "masqueeLe"      TIMESTAMP(3),
  "rejointLe"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "participations_conversationId_utilisateurId_key"
  ON "participations"("conversationId", "utilisateurId");

CREATE INDEX "participations_utilisateurId_masqueeLe_idx"
  ON "participations"("utilisateurId", "masqueeLe");

-- ─────────────────────────────────────────────────────────────
-- 4 — Les corbeaux.
--
-- Pas de colonne « modifié le » : un corbeau parti ne se réécrit pas. Pas de
-- sujet non plus — la Tour n'en a pas.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "messages" (
  "id"             TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "auteurId"       TEXT,
  "corps"          TEXT NOT NULL,
  "envoyeLe"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- Le fil chronologique, et le chargement du passé en remontant.
CREATE INDEX "messages_conversationId_envoyeLe_idx"
  ON "messages"("conversationId", "envoyeLe");

-- ─────────────────────────────────────────────────────────────
-- 5 — « Ce message est caché pour cette personne. »
--
-- Une seule table pour deux règles, et c'est ce qui les rend sûres :
--
--   SUPPRIME_PAR_SOI — j'ai retiré ce message de MA vue. La copie de l'autre
--                      est intacte : je n'ai touché ni au message ni à sa
--                      ligne à lui. C'est ce qui protège un membre harcelé
--                      dont l'agresseur voudrait effacer ses traces.
--   BLOQUE           — le corbeau d'une personne bloquée. Il est bel et bien
--                      écrit, puis masqué pour le destinataire dans la même
--                      écriture. L'expéditeur le voit partir et le relit dans
--                      son fil : rien ne lui dit qu'il est bloqué. C'est
--                      délibéré — un refus explicite déclenche l'escalade,
--                      qui est le vrai risque.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "messages_masques" (
  "id"            TEXT NOT NULL,
  "messageId"     TEXT NOT NULL,
  "utilisateurId" TEXT NOT NULL,
  "raison"        "RaisonMasquage" NOT NULL,
  "creeLe"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messages_masques_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messages_masques_messageId_utilisateurId_key"
  ON "messages_masques"("messageId", "utilisateurId");

CREATE INDEX "messages_masques_utilisateurId_idx" ON "messages_masques"("utilisateurId");

-- ─────────────────────────────────────────────────────────────
-- 6 — Le blocage.
--
-- Rien d'autre n'est stocké : ni motif, ni état. Tout le reste s'en déduit —
-- le fil clos côté bloqueur, le refus d'en ouvrir un nouveau, le masquage
-- automatique, l'absence du bloqué dans la recherche.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "blocages" (
  "id"         TEXT NOT NULL,
  "bloqueurId" TEXT NOT NULL,
  "bloqueId"   TEXT NOT NULL,
  "creeLe"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "blocages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blocages_bloqueurId_bloqueId_key" ON "blocages"("bloqueurId", "bloqueId");

-- « Qui m'a bloqué ? » est la question posée à chaque envoi : elle doit être
-- instantanée, et l'index de la contrainte ci-dessus ne sert que dans l'autre
-- sens.
CREATE INDEX "blocages_bloqueId_idx" ON "blocages"("bloqueId");

-- ─────────────────────────────────────────────────────────────
-- 7 — Le signalement, et LA SEULE FENÊTRE DU STAFF sur les échanges privés.
--
-- Tout tient dans `contexte` : le message visé et une dizaine autour,
-- recopiés tels quels au moment du clic. Jamais la conversation entière,
-- jamais la boîte du membre.
--
-- Art. 8.6 — les signalements sont confidentiels. `parId` ne quitte pas cette
-- table : la personne visée ne sait jamais qui l'a signalée.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "signalements" (
  "id"             TEXT NOT NULL,
  -- Pointeur vivant, pour le seul cas où le message existe encore. Ce n'est
  -- PAS la source de ce que lit la modération : `contexte` l'est.
  "messageId"      TEXT,
  "parId"          TEXT,
  "viseId"         TEXT,
  "motif"          TEXT,
  "contexte"       JSONB NOT NULL,
  "statut"         "StatutSignalement" NOT NULL DEFAULT 'EN_ATTENTE',
  "traiteLe"       TIMESTAMP(3),
  "traitePar"      TEXT,
  "noteTraitement" TEXT,
  "creeLe"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "signalements_pkey" PRIMARY KEY ("id")
);

-- La file de la modération : ce qui attend, du plus ancien au plus récent.
CREATE INDEX "signalements_statut_creeLe_idx" ON "signalements"("statut", "creeLe");

-- ─────────────────────────────────────────────────────────────
-- 8 — Les liens.
--
-- Deux comportements, et l'écart entre les deux dit toute la règle :
--
--   CASCADE  sur ce qui n'a de sens que rattaché — une participation, un
--            masquage, un blocage.
--   SET NULL sur l'AUTEUR d'un message et sur celui d'un signalement :
--            supprimer son compte n'efface pas ce qu'on a écrit chez autrui,
--            exactement comme supprimer un message ne l'efface pas chez le
--            destinataire. Le fil reste lisible, sans nom.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_ouvertParId_fkey"
  FOREIGN KEY ("ouvertParId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "participations" ADD CONSTRAINT "participations_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participations" ADD CONSTRAINT "participations_utilisateurId_fkey"
  FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_auteurId_fkey"
  FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages_masques" ADD CONSTRAINT "messages_masques_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages_masques" ADD CONSTRAINT "messages_masques_utilisateurId_fkey"
  FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blocages" ADD CONSTRAINT "blocages_bloqueurId_fkey"
  FOREIGN KEY ("bloqueurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blocages" ADD CONSTRAINT "blocages_bloqueId_fkey"
  FOREIGN KEY ("bloqueId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Le signalement survit à la disparition du message, de son auteur et de
-- celui qui l'a signalé. Il n'en garde pas moins tout ce qu'il faut pour être
-- lu : la copie est dans `contexte`.
ALTER TABLE "signalements" ADD CONSTRAINT "signalements_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "signalements" ADD CONSTRAINT "signalements_parId_fkey"
  FOREIGN KEY ("parId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "signalements" ADD CONSTRAINT "signalements_viseId_fkey"
  FOREIGN KEY ("viseId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 9 — Le type d'une conversation s'accorde avec sa clé.
--
-- « administration:<id> » d'un côté, « idA:idB » de l'autre. Sans cet accord,
-- une conversation entre deux joueurs pourrait se déguiser en conversation
-- adressée au staff — et le staff la lirait, ce que le site promet de ne
-- jamais faire.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_cle_accordee" CHECK (
  ("type" = 'AVEC_ADMINISTRATION' AND "clePaire" LIKE 'administration:%')
  OR
  ("type" = 'ENTRE_MEMBRES' AND "clePaire" NOT LIKE 'administration:%' AND "clePaire" LIKE '%:%')
);

-- ─────────────────────────────────────────────────────────────
-- 10 — Et ce type NE CHANGE JAMAIS.
--
-- C'est le verrou qui tient la promesse « aucun membre du staff ne lit les
-- conversations privées ». La contrainte ci-dessus interdit d'écrire une
-- conversation mal accordée ; celle-ci interdit d'en RETOURNER une, en
-- changeant à la fois son type et sa clé.
--
-- Comme pour la baguette, une correction délibérée reste possible :
--   ALTER TABLE "conversations" DISABLE TRIGGER "conversations_type_definitif";
--   …la correction…
--   ALTER TABLE "conversations" ENABLE TRIGGER "conversations_type_definitif";
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "conversation_type_definitif"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."type" IS DISTINCT FROM OLD."type"
     OR NEW."clePaire" IS DISTINCT FROM OLD."clePaire" THEN
    RAISE EXCEPTION 'Le type et la clé d''une conversation sont définitifs (conversation %)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- La règle ne gêne pas l'usage courant : `dernierMessageLe` change à chaque
-- corbeau, et cela reste libre.
CREATE TRIGGER "conversations_type_definitif"
  BEFORE UPDATE ON "conversations"
  FOR EACH ROW EXECUTE FUNCTION "conversation_type_definitif"();

-- ─────────────────────────────────────────────────────────────
-- 11 — Un corbeau n'est ni vide ni démesuré.
--
-- Volontairement plus GROSSIER que le schéma Zod : le format fin — le
-- rognage, les retours à la ligne en trop, les caractères de contrôle — vit
-- dans `lib/corbeaux/schema.ts`, seule source de vérité, partagée mot pour
-- mot entre le champ de saisie et la route. La base n'arrête que ce qui
-- casserait l'affichage, et le fait pour tous les chemins.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "messages" ADD CONSTRAINT "messages_corps_lisible" CHECK (
  length(btrim("corps")) > 0 AND length("corps") <= 5000
);

-- ─────────────────────────────────────────────────────────────
-- 12 — On ne se bloque pas soi-même.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "blocages" ADD CONSTRAINT "blocages_pas_soi_meme" CHECK (
  "bloqueurId" <> "bloqueId"
);

-- ─────────────────────────────────────────────────────────────
-- 13 — Un signalement porte TOUJOURS sa copie.
--
-- Un signalement sans contexte serait illisible pour la modération, et le
-- message aurait pu disparaître entre-temps : il n'y aurait plus rien à lire
-- nulle part. La copie n'est pas un confort, c'est la seule trace.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "signalements" ADD CONSTRAINT "signalements_contexte_present" CHECK (
  jsonb_typeof("contexte") = 'array' AND jsonb_array_length("contexte") > 0
);

-- ─────────────────────────────────────────────────────────────
-- 14 — Et cette copie ne se réécrit pas.
--
-- Une preuve qui se retouche n'en est pas une. Traiter un signalement reste
-- libre — `statut`, `traiteLe`, `traitePar`, `noteTraitement` changent tant
-- qu'on veut ; ce qui a été signalé, non.
--
--   ALTER TABLE "signalements" DISABLE TRIGGER "signalements_copie_figee";
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "signalement_copie_figee"() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."contexte" IS DISTINCT FROM OLD."contexte"
     OR NEW."motif"  IS DISTINCT FROM OLD."motif" THEN
    RAISE EXCEPTION 'La copie d''un signalement est figée (signalement %)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;

  -- La personne visée peut être EFFACÉE, jamais REMPLACÉE.
  --
  -- L'écart n'est pas un détail : supprimer un compte met ce lien à NULL, et
  -- une règle qui refuserait aussi cet effacement rendrait le compte
  -- indestructible — un signalement vieux de six mois empêcherait pour
  -- toujours de fermer un compte. Ce qu'on interdit, c'est de faire porter un
  -- signalement à quelqu'un d'autre.
  IF NEW."viseId" IS DISTINCT FROM OLD."viseId" AND NEW."viseId" IS NOT NULL THEN
    RAISE EXCEPTION 'Un signalement ne change pas de personne visée (signalement %)', OLD."id"
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "signalements_copie_figee"
  BEFORE UPDATE ON "signalements"
  FOR EACH ROW EXECUTE FUNCTION "signalement_copie_figee"();
