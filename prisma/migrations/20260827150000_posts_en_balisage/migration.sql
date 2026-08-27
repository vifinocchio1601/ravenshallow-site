-- Les posts passent du texte brut au balisage.
--
-- Jusqu'ici, `corps` portait du texte que React échappait à l'affichage et que
-- `whitespace-pre-wrap` mettait en paragraphes. Avec la mise en forme, il
-- porte du HTML — réduit à une liste blanche à l'enregistrement comme à
-- l'affichage (`lib/forum/nettoyer-html.ts`).
--
-- Les anciens posts doivent donc être convertis, **et l'échappement vient en
-- premier** : ce texte n'a jamais été nettoyé, puisqu'il n'en avait pas
-- besoin, et il peut contenir n'importe quoi. Une ligne vide sépare deux
-- paragraphes, un simple retour va à la ligne — exactement ce que
-- `whitespace-pre-wrap` affichait.
--
-- ⚠️ **Cette transformation reprend celle de `texteEnHtml`**, dans
-- `nettoyer-html.ts`, parce que le SQL ne sait pas appeler du TypeScript. Les
-- deux doivent donner le même résultat, et il a été comparé avant d'être
-- appliqué. La migration ne servant qu'une fois, c'est la fonction qui reste
-- la référence si l'une des deux doit changer.
--
-- Le `WHERE` épargne ce qui commence déjà par une balise : la migration ne se
-- rejoue pas, mais un post écrit entre-temps par la nouvelle version ne doit
-- pas être échappé une seconde fois.

UPDATE "posts"
SET "corps" =
  '<p>'
  || replace(
       regexp_replace(
         btrim(
           replace(replace(replace("corps", '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
         ),
         E'[ \t]*\n[ \t]*\n[ \t\n]*', '</p><p>', 'g'
       ),
       E'\n', '<br />'
     )
  || '</p>'
WHERE "corps" !~ '^[[:space:]]*<';
