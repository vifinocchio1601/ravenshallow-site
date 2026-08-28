-- Le tableau d'affichage d'une maison — les mots qu'on y épingle.
--
-- ── Ce que c'est, et ce que ce n'est pas ──
--
-- Un mur de bois dans la salle commune, où un préfet ou la directrice
-- épinglent un mot : « rendez-vous samedi », « bravo à Sigrid ». Ce n'est
-- PAS une annonce du Grand Hall : celle-là est officielle, vaut pour tout le
-- site, et peut faire courir les sept jours du préambule. Un mot sur un
-- tableau n'engage rien, ne vaut que pour une maison, et il est **signé**.
--
-- Deux objets différents, deux tables, deux noms. Les confondre reviendrait à
-- donner à un mot de préfet le poids d'une modification du règlement.
--
-- ── Une table plutôt qu'une section du forum ──
--
-- Décision du joueur, 28 août 2026. L'espace `maison` aurait pu porter des
-- sujets — il est réglé pour : préfets et permission ouvrent, la maison lit et
-- répond. Mais un tableau d'affichage où l'on répond n'est plus un tableau,
-- c'est un fil. Le mur reste un mur.
--
-- ── Aucune permission nouvelle ──
--
-- Qui écrit ici est déjà écrit : `peutEcrireLesAnnoncesDe` — le staff, le
-- préfet de la maison, ou le détenteur de `ANNONCES_MAISON`. Le droit du
-- préfet dérive de sa nomination, donc le démettre reprend tout (art. 13.5).
--
-- Elle est entièrement ADDITIVE : une table neuve, pas une ligne existante
-- réécrite.

CREATE TABLE "mots_du_tableau" (
  "id" TEXT NOT NULL,

  -- **Une maison, et jamais nulle.** Un `NULL` qui voudrait dire « toutes les
  -- maisons » ferait porter deux sens à la même case : c'est le raccourci que
  -- `permissions_accordees` a refusé, et que `EtatEtape` a été inventé pour
  -- éviter. Quatre maisons, c'est quatre mots.
  "maison" "Maison" NOT NULL,

  -- **Du texte brut**, pas du balisage. Un tableau porte des mots, pas des
  -- articles : l'éditeur inviterait à écrire long, et le mur n'a pas la place.
  -- React l'échappe d'office, il n'y a donc aucune liste blanche à tenir de ce
  -- côté-ci. Même parti pris que la Tour aux Corbeaux.
  "corps" TEXT NOT NULL,

  -- **Le mot est signé**, et c'est ce qui le distingue d'une annonce du Grand
  -- Hall, qui n'a pas d'auteur parce que le château n'a personne à nommer.
  -- Nul quand le compte s'en va : le mot reste au mur, comme un post reste
  -- dans sa scène.
  "auteurId" TEXT,

  "epingleLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- **Retirer n'efface pas.** Le mot sort du mur et reste en base.
  --
  -- ⚠️ `retirePar` est un NOM, pas un identifiant — le procédé de
  -- `posts.masquePar`. Un lien serait vidé le jour où ce compte disparaît, et
  -- la contrainte « les deux ensemble » tomberait alors toute seule, sur une
  -- ligne écrite des mois plus tôt, au milieu d'une suppression de compte.
  "retireLe"  TIMESTAMP(3),
  "retirePar" TEXT,

  CONSTRAINT "mots_du_tableau_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "mots_du_tableau"
  ADD CONSTRAINT "mots_du_tableau_auteurId_fkey"
  FOREIGN KEY ("auteurId") REFERENCES "eleves"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- Ce que la base refuse.
-- ─────────────────────────────────────────────────────────────

-- `btrim` ne retire QUE les espaces : ni les retours à la ligne, ni les
-- tabulations. Piège rencontré sur le corps d'un corbeau, qui passait à six
-- lignes vides.
ALTER TABLE "mots_du_tableau" ADD CONSTRAINT "mots_du_tableau_corps_non_vide" CHECK (
  "corps" ~ '[^[:space:]]'
);

-- Cinq cents signes : la mesure d'un mot, pas d'un article. Le mur n'a pas la
-- place, et le lot d'après montrera si c'est trop ou trop peu.
ALTER TABLE "mots_du_tableau" ADD CONSTRAINT "mots_du_tableau_corps_borne" CHECK (
  length("corps") <= 500
);

-- Les deux colonnes du retrait vont ensemble ou pas du tout.
ALTER TABLE "mots_du_tableau" ADD CONSTRAINT "mots_du_tableau_retrait_complet" CHECK (
  ("retireLe" IS NULL) = ("retirePar" IS NULL)
);

ALTER TABLE "mots_du_tableau" ADD CONSTRAINT "mots_du_tableau_retire_par_non_vide" CHECK (
  "retirePar" IS NULL OR "retirePar" ~ '[^[:space:]]'
);

-- ─────────────────────────────────────────────────────────────
-- La lecture.
-- ─────────────────────────────────────────────────────────────

-- La page de maison pose toujours la même question : les derniers mots non
-- retirés de CETTE maison. Elle est ouverte à chaque visite.
CREATE INDEX "mots_du_tableau_maison_epingleLe_idx"
  ON "mots_du_tableau" ("maison", "epingleLe" DESC);
