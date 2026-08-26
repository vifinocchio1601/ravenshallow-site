-- Un corbeau vide, corrigé.
--
-- La migration précédente écrivait `length(btrim("corps")) > 0`. C'était faux,
-- et d'une façon qui ne saute pas aux yeux : **`btrim` ne retire que les
-- ESPACES**, jamais les retours à la ligne ni les tabulations. Un message ne
-- contenant que « \n \n » passait donc la contrainte et s'affichait comme une
-- bulle vide dans le fil.
--
-- L'expression régulière dit ce qu'on voulait vraiment dire : il faut au
-- moins un signe qui ne soit pas un blanc. `[[:space:]]` couvre l'espace, la
-- tabulation, le retour chariot, le saut de ligne et le saut de page.
--
-- Le rognage fin — les espaces insécables, les lignes vides en trop, les
-- caractères de contrôle — reste l'affaire de `lib/corbeaux/schema.ts`, seule
-- source de vérité partagée entre le champ de saisie et la route. La base
-- n'arrête que ce qui casserait l'affichage, comme pour le rôle particulier.

ALTER TABLE "messages" DROP CONSTRAINT "messages_corps_lisible";

ALTER TABLE "messages" ADD CONSTRAINT "messages_corps_lisible" CHECK (
  "corps" ~ '[^[:space:]]' AND length("corps") <= 5000
);
