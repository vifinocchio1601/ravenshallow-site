-- Le salon d'une maison — la salle commune, en direct.
--
-- ── Ce que c'est, et ce que ce n'est pas ──
--
-- Une PIÈCE, et non une correspondance. La distinction n'est pas de style :
-- « le staff ne lit pas les conversations privées » est une règle dure de ce
-- site, tenue par `etancheite.test.ts`, et elle ne s'applique pas ici. Un
-- salon se lit comme un professeur traverse la salle commune. Sans cette
-- phrase écrite quelque part, la règle se déforme — soit on interdit au staff
-- une pièce publique, soit on lui ouvre les corbeaux par ricochet.
--
-- Ce n'est pas non plus du jeu de rôle : aucun minimum de lignes, aucun
-- avertissement de contenu, **aucun point**. Comme la Tour aux Corbeaux.
--
-- ── Une pièce par maison ──
--
-- Décision du joueur, 28 août 2026, en connaissance du risque : avec quatre
-- maisons et peu de joueurs, ce sont peut-être quatre pièces vides. Le
-- découpage inverse — un salon commun — reste possible plus tard sans toucher
-- à cette table : il suffirait d'une valeur de plus, jamais d'un `NULL` qui
-- voudrait dire « tout le monde ».
--
-- ── Le direct n'existe pas ici ──
--
-- Vercel exécute des fonctions courtes, pas des connexions ouvertes : pas de
-- WebSocket. Le salon s'interroge toutes les quelques secondes, par
-- `useRafraichissement`, qui s'arrête quand l'onglet est caché. Le jour où une
-- connexion permanente arriverait, c'est ce fichier-là qui changerait — pas
-- cette table.
--
-- Elle est entièrement ADDITIVE : une table neuve, pas une ligne existante
-- réécrite.

CREATE TABLE "messages_salon" (
  "id" TEXT NOT NULL,

  -- Une maison, et jamais nulle. Même refus du raccourci que pour les mots du
  -- tableau et pour `permissions_accordees`.
  "maison" "Maison" NOT NULL,

  -- Du texte brut. Un salon n'a pas besoin de gras, et React échappe de
  -- lui-même : aucune liste blanche à tenir de ce côté-ci.
  "corps" TEXT NOT NULL,

  -- Signé. Nul quand le compte s'en va : le message reste dans la pièce, comme
  -- un post reste dans sa scène.
  "auteurId" TEXT,

  "ecritLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- **Retirer n'efface pas.** Le message sort de l'écran et reste en base —
  -- c'est ce qui permet de retrouver une conversation pénible six mois plus
  -- tard, et c'est la raison pour laquelle le joueur a choisi de tout garder.
  --
  -- ⚠️ `retirePar` est un NOM, pas un identifiant : un lien serait vidé le
  -- jour où ce compte disparaît, et la contrainte « les deux ensemble »
  -- tomberait toute seule au milieu d'une suppression. Procédé de
  -- `posts.masquePar`, déjà repris par `mots_du_tableau`.
  "retireLe"  TIMESTAMP(3),
  "retirePar" TEXT,

  CONSTRAINT "messages_salon_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "messages_salon"
  ADD CONSTRAINT "messages_salon_auteurId_fkey"
  FOREIGN KEY ("auteurId") REFERENCES "eleves"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- Ce que la base refuse.
-- ─────────────────────────────────────────────────────────────

-- `btrim` ne retire QUE les espaces. Piège rencontré sur le corps d'un
-- corbeau, qui passait à six lignes vides.
ALTER TABLE "messages_salon" ADD CONSTRAINT "messages_salon_corps_non_vide" CHECK (
  "corps" ~ '[^[:space:]]'
);

ALTER TABLE "messages_salon" ADD CONSTRAINT "messages_salon_corps_borne" CHECK (
  length("corps") <= 1000
);

ALTER TABLE "messages_salon" ADD CONSTRAINT "messages_salon_retrait_complet" CHECK (
  ("retireLe" IS NULL) = ("retirePar" IS NULL)
);

ALTER TABLE "messages_salon" ADD CONSTRAINT "messages_salon_retire_par_non_vide" CHECK (
  "retirePar" IS NULL OR "retirePar" ~ '[^[:space:]]'
);

-- Un message ne se retire pas avant d'être écrit.
ALTER TABLE "messages_salon" ADD CONSTRAINT "messages_salon_retrait_apres_ecriture" CHECK (
  "retireLe" IS NULL OR "retireLe" >= "ecritLe"
);

-- ─────────────────────────────────────────────────────────────
-- La lecture.
-- ─────────────────────────────────────────────────────────────

-- La pièce pose toujours la même question : les derniers messages de CETTE
-- maison. Et le rafraîchissement la pose toutes les quelques secondes.
CREATE INDEX "messages_salon_maison_ecritLe_idx"
  ON "messages_salon" ("maison", "ecritLe" DESC);

-- **Le rafraîchissement demande aussi les RETRAITS depuis tel instant** : sans
-- eux, un message décroché par un préfet resterait à l'écran de tous les
-- autres jusqu'au prochain chargement de page. C'est une seconde question,
-- posée aussi souvent que la première, et elle a donc son index.
CREATE INDEX "messages_salon_maison_retireLe_idx"
  ON "messages_salon" ("maison", "retireLe")
  WHERE "retireLe" IS NOT NULL;

-- Le frein anti-noyade lit les derniers instants d'UN auteur dans UNE pièce,
-- à chaque envoi.
CREATE INDEX "messages_salon_auteurId_ecritLe_idx"
  ON "messages_salon" ("auteurId", "ecritLe" DESC);
