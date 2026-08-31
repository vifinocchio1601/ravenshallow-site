-- La trace des erreurs du serveur — pour que La Veille ait quelque chose à lire.
--
-- ── Le manque que cette table comble ──
--
-- Le site ne gardait aucune trace de ses erreurs. Douze `console.error`
-- partaient dans les journaux d'exécution de Vercel, qui ne se conservent que
-- quelques heures selon la formule, et dont la lecture demande un jeton et un
-- plan. « Les erreurs des dernières vingt-quatre heures » n'était donc pas
-- une question à laquelle on pouvait répondre.
--
-- **Ceci ne remplace pas `console.error`, cela s'y ajoute.** Les journaux de
-- Vercel gardent leur usage : on y regarde en direct quand quelque chose
-- brûle. La table, elle, permet de regarder le lendemain matin.
--
-- ── Ce qui n'y entre jamais, et pourquoi c'est à l'ÉCRITURE ──
--
-- ⚠️ Un message d'erreur porte volontiers une adresse de courriel — « envoi
-- raté vers untel@… ». La politique de confidentialité du site promet que les
-- adresses ne servent qu'à l'inscription et aux notifications ; une table
-- d'erreurs qui en contiendrait démentirait cette page, et une page légale
-- fausse est pire qu'absente.
--
-- Le caviardage est donc fait par `lib/erreurs/depot.ts` AVANT l'insertion,
-- jamais à la lecture. Ce qui n'est jamais écrit ne fuit pas — c'est le même
-- raisonnement que `majeur16`, qui remplace l'âge réel au lieu de le masquer.
--
-- ── Ce que la base tient elle-même ──
--
-- Quatre garanties, et la dernière est celle qui compte :
--
--   1. la portée n'est ni vide ni démesurée ;
--   2. le type non plus ;
--   3. le message n'est pas vide au sens de Postgres — `~ '[^[:space:]]'` et
--      non `btrim`, qui ne retire que les espaces et laisserait passer six
--      retours à la ligne. Piège déjà payé sur le corps d'un corbeau ;
--   4. **une ligne ne se réécrit jamais.** C'est une trace : on peut
--      l'effacer — la rétention l'exige —, jamais la remplacer. Une preuve
--      qui se retouche n'en est pas une, et c'est déjà le principe du carnet
--      des points et de la copie d'un signalement.
--
-- Elle est entièrement ADDITIVE : une table neuve, et pas une ligne existante
-- réécrite.

CREATE TABLE "erreurs_serveur" (
  "id" TEXT NOT NULL,

  -- Le préfixe que les `console.error` portent déjà entre crochets.
  "portee" TEXT NOT NULL,

  -- Ce qui sert à REGROUPER. Cinquante fois la même erreur font une ligne
  -- dans le rapport avec son nombre, pas cinquante lignes.
  "type" TEXT NOT NULL,

  -- `P2028` de Prisma, `ECONNREFUSED` de Node. Absent le plus souvent.
  "code" TEXT,

  -- Caviardé à l'écriture. Voir ci-dessus.
  "message" TEXT NOT NULL,

  "chemin" TEXT,

  "survenuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "erreurs_serveur_pkey" PRIMARY KEY ("id")
);

-- La requête de la ronde : ce qui s'est passé depuis hier, groupé par type.
CREATE INDEX "erreurs_serveur_survenuLe_idx" ON "erreurs_serveur" ("survenuLe");
CREATE INDEX "erreurs_serveur_portee_type_survenuLe_idx"
  ON "erreurs_serveur" ("portee", "type", "survenuLe");

-- ── Ni vides, ni démesurées ──
--
-- ⚠️ `~ '[^[:space:]]'` et non `length(btrim(...)) > 0` : `btrim` ne retire
-- que les ESPACES, pas les retours à la ligne ni les tabulations. Un message
-- fait de six lignes vides passerait la seconde forme.
ALTER TABLE "erreurs_serveur"
  ADD CONSTRAINT "erreur_portee_non_vide"
  CHECK ("portee" ~ '[^[:space:]]' AND length("portee") <= 60);

ALTER TABLE "erreurs_serveur"
  ADD CONSTRAINT "erreur_type_non_vide"
  CHECK ("type" ~ '[^[:space:]]' AND length("type") <= 120);

ALTER TABLE "erreurs_serveur"
  ADD CONSTRAINT "erreur_message_non_vide"
  CHECK ("message" ~ '[^[:space:]]' AND length("message") <= 2000);

ALTER TABLE "erreurs_serveur"
  ADD CONSTRAINT "erreur_code_non_vide"
  CHECK ("code" IS NULL OR ("code" ~ '[^[:space:]]' AND length("code") <= 40));

ALTER TABLE "erreurs_serveur"
  ADD CONSTRAINT "erreur_chemin_non_vide"
  CHECK ("chemin" IS NULL OR ("chemin" ~ '[^[:space:]]' AND length("chemin") <= 300));

-- ── Une trace ne se réécrit pas ──
--
-- Effaçable — la rétention de trente jours l'exige —, jamais remplaçable.
-- Même déclencheur que celui du carnet des points et de la copie figée d'un
-- signalement.
CREATE OR REPLACE FUNCTION "erreur_ne_se_reecrit_pas"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'Une erreur enregistrée ne se modifie pas. Elle peut être effacée, jamais réécrite.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "erreur_immuable"
  BEFORE UPDATE ON "erreurs_serveur"
  FOR EACH ROW
  EXECUTE FUNCTION "erreur_ne_se_reecrit_pas"();

COMMENT ON TABLE "erreurs_serveur" IS
  'Erreurs du serveur, caviardées à l''écriture et gardées trente jours. Lues chaque matin par La Veille.';
