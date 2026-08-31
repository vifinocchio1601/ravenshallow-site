-- Le compte de service — celui qui regarde sans jamais écrire.
--
-- ── Pourquoi une colonne ──
--
-- La Veille, l'assistant de surveillance, se connecte chaque matin et
-- traverse les écrans pour vérifier qu'ils s'affichent : le bureau, les
-- tubes, une section du forum, une scène, la Tour aux Corbeaux, un grimoire.
-- Elle ne publie rien, ne modifie rien, ne supprime rien.
--
-- Il lui faut pour cela un dossier ACCEPTÉ — sans quoi elle n'ouvre pas une
-- seule de ces pages. Et c'est exactement ce qui la rendait visible :
-- `lireLeRegistre` liste TOUS les dossiers acceptés, et `chercherPersonnages`
-- la proposait comme correspondante à n'importe quel joueur. Sur trois
-- membres visibles, un quatrième se remarque.
--
-- ── Ce que la colonne décide, et où ──
--
-- Sept requêtes, et sept seulement :
--
--   registre/depot.ts      lireLeRegistre           l'annuaire
--   registre/depot.ts      lireLaFiche              la fiche publique
--   corbeaux/depot.ts      chercherPersonnages      la recherche de la Tour
--   points/depot.ts        listerLesElevesPourLesPoints
--   points/depot.ts        topDuMois                le top d'une maison
--   points/depot.ts        effectifs                l'effectif du tournoi
--   points/cloture.ts      ceQueLaClotureFerait     la liste des passages
--
-- Partout ailleurs le compte se voit comme les autres, et c'est voulu. La
-- zone d'administration en particulier ne filtre RIEN : `listerMembres` le
-- montre, `/admin/absences` le montre. L'administration doit savoir ce qui
-- existe chez elle — un compte qu'on cache à son propre gardien est pire
-- qu'un compte visible.
--
-- ── Pourquoi pas un rôle, pourquoi pas un statut ──
--
-- `Role` dit ce qu'on a le droit de faire, `StatutAcces` dit si l'on entre.
-- Ceci ne dit ni l'un ni l'autre : le compte de service est un JOUEUR
-- ordinaire, VALIDE, sans aucune permission. La colonne ne parle que de
-- visibilité. Trois sources de droits qui ne se recouvrent jamais — c'est la
-- règle des pouvoirs, et elle vaut ici aussi.
--
-- ── Ce que la base tient, et ce qu'elle ne tient pas ──
--
-- La base ne garantit pas qu'il n'y ait qu'un compte de service : rien
-- n'interdit d'en poser un second le jour où il faudra deux rondes. Elle ne
-- garantit pas non plus qu'il ne publie rien — cela vient de la lecture seule
-- de ses identifiants de base, et de l'absence de toute permission.
--
-- Elle est entièrement ADDITIVE : une colonne neuve, à faux par défaut, et
-- pas une ligne existante réécrite. La retirer rendrait simplement le compte
-- visible, sans rien casser.

ALTER TABLE "utilisateurs"
  ADD COLUMN "compteDeService" BOOLEAN NOT NULL DEFAULT false;

-- Les sept requêtes filtrent sur cette colonne, et toutes cherchent la même
-- chose : les comptes ordinaires. Un index partiel sur le petit côté serait
-- une coquetterie — il y a un compte de service et des milliers d'autres.
-- Aucun index, donc, et c'est délibéré.

COMMENT ON COLUMN "utilisateurs"."compteDeService" IS
  'Compte qui n''appartient à personne (La Veille). Exclu du Registre, de la recherche de la Tour, du tournoi, du top du mois et des passages d''année — jamais de l''administration.';
