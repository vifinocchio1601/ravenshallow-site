-- La galerie des vents laisse deviner ce qu'il y a sur les récifs.
--
-- Décision du joueur, 27 août 2026, à la relecture de l'aile est. La
-- description disait « ceux qu'on montre du doigt sans jamais s'en
-- approcher » — l'interdit sans sa raison, ce qui n'inquiète personne.
--
-- La raison est dans la bible (§ bestiaire) : les **Draugr**, marins noyés
-- ranimés, hantent les épaves au pied de la falaise et « attirent les
-- imprudents vers les récifs par nuit de tempête ».
--
-- **Ils ne sont pas nommés, et c'est le point.** Une description de lieu est
-- un document que les élèves lisent : elle donne ce qu'un élève voit depuis
-- la coursive — des lumières basses, et des camarades du village qui
-- détournent les yeux —, jamais le nom de la chose ni ce qu'elle fait. Même
-- principe que les souterrains, qui rappellent l'article 13.1 sans rien dire
-- de ce que le sceau retient.
--
-- Kaldvik est le village d'où l'on monte au château : ceux qui y ont grandi
-- savent avant les autres, et leur silence en dit plus qu'une explication.

UPDATE "sections"
SET "description" = 'Une longue coursive vitrée qui longe la façade de mer. Les carreaux tremblent, le sol reste humide, et par temps clair on voit jusqu’aux récifs. Les nuits de tempête, il y brille parfois des lumières basses, du côté des épaves ; ceux qui ont grandi à Kaldvik ne les regardent jamais longtemps, et ne disent pas pourquoi.',
    "majLe" = NOW()
WHERE "slug" = 'la-galerie-des-vents';
