-- Les alentours du château — la falaise, le lac, la forêt, Kaldvik, le massif.
--
-- Cinq zones, seize lieux. Comme pour l'école, **les lieux vivent en base** :
-- une description se corrige sans toucher au moteur, mais par une migration
-- tout de même — sinon la correction est vraie aujourd'hui et perdue le jour
-- où la base serait reconstruite.
--
-- ── Un QUATRIÈME espace, et non des sections du domaine ──
--
-- L'adresse `/alentours` existe au bandeau depuis le lot du menu, à côté de
-- `/ecole`. Deux adresses veulent deux racines : posées dans `domaine`, ces
-- cinq zones s'afficheraient dans « L'école », qui est l'intérieur du château.
--
-- Pas une ligne de moteur pour autant. Ce qui distingue un espace tient dans
-- des colonnes, et celles-ci sont **exactement celles du domaine** : dix
-- lignes (art. 12.2), les points, le décompte des scènes, ouvert à tout
-- membre. C'est du jeu de rôle, et rien ne justifierait qu'une scène sur la
-- grève vaille moins qu'une scène dans un couloir — décision du joueur,
-- 28 août 2026.
--
-- ── Ce que le joueur a arbitré avant d'écrire, le 28 août 2026 ──
--
-- • **Kaldvik s'écrit en entier** — quais, place et ruelles, échoppe, phare.
--   La bible ne décrivait que l'échoppe et rangeait le village parmi ses
--   points « à approfondir » ; l'article 12.4 fait de son accord la condition
--   pour l'inventer. Ce qui suit fait donc autorité pour le RP.
--
-- • **Les Hauts Plateaux de Givre s'ouvrent SUR CONVOCATION.** La bible les
--   dit « arrière-plan lointain, peu exploité pour l'instant » : le lieu
--   existe, le staff seul y ouvre une scène, et l'élève convoqué répond. Ne
--   pas confondre avec `ouverte = false`, qui ferait taire le convoqué.
--
-- • **Le large et les épaves** sont sur convocation pour la même raison :
--   c'est la zone des naufrages, et rien ne s'y joue qui ne soit encadré.
--
-- ── Les trois contrôles, refaits ──
--
-- • **Aucun des seize textes ne nomme la grotte ni le sceau**, pas même pour
--   en interdire l'approche. Décision du joueur du 27 août 2026, et elle pèse
--   ici plus qu'au château : la falaise EST l'endroit. Un interdit posé sur
--   une porte est une flèche ; l'article 13.1 vit dans le règlement, approuvé
--   à l'inscription, et oblige sans avoir besoin d'être répété.
--
-- • **Aucune créature du bestiaire n'est nommée** (art. 13.6) : ni Draugr, ni
--   Tåkesong, ni Nøkk, ni Huldra, ni Skoggrim. Elles ne s'invitent pas
--   d'elles-mêmes dans une scène, et une description qui les annoncerait
--   reviendrait à les inviter. Ce qui reste, ce sont des rumeurs qui se
--   contredisent — la consigne de la bible côté joueurs.
--
-- • **Aucun texte ne s'adresse au joueur.** Une description de lieu décrit le
--   monde ; les consignes vivent dans le règlement.
--
-- ── La carte fait autorité (art. 12.4) ──
--
-- Chaque texte a été confronté à `public/crests/carte.jpg`, et plusieurs
-- détails en viennent, qu'aucun nom de lieu ne laissait deviner :
--
--   • le Lac est au NORD-OUEST du château, et se vide vers le sud par une
--     rivière qui tombe en cascade au-dessus du port ;
--   • le chemin escarpé remonte depuis le HAUT du village — la scène de
--     Bjornstav le dit aussi : « le sentier commence à trente pas de la
--     porte » ;
--   • le passage secret relie la forêt aux ABORDS du village, pas au château ;
--   • les épaves sont au large, au SUD-EST, sur des bancs de récifs ;
--   • un phare veille au sud du port.

-- ─────────────────────────────────────────────────────────────
-- 1 — L'espace, et la place qu'il prend.
--
-- L'ordre décale les deux suivants : les alentours se lisent juste après le
-- château, avant le hors RP.
-- ─────────────────────────────────────────────────────────────

UPDATE "espaces" SET "ordre" = 4, "majLe" = NOW() WHERE "cle" = 'maison';
UPDATE "espaces" SET "ordre" = 3, "majLe" = NOW() WHERE "cle" = 'non-mages';

-- Le domaine disait « Le château ET CE QUI L'ENTOURE ». Ce n'est plus vrai :
-- ce qui l'entoure a maintenant son espace, et deux descriptions qui se
-- disputent le même territoire finissent par se contredire.
UPDATE "espaces"
SET "description" = 'L’intérieur du château : les Tours centrales et les quatre ailes. Tout ce qui s’y écrit est du jeu de rôle : dix lignes au minimum, et les points s’y gagnent.',
    "majLe" = NOW()
WHERE "cle" = 'domaine';

INSERT INTO "espaces" (
  "id", "cle", "nom", "description", "ordre",
  "lignesMinimum", "quiOuvreUnSujet", "quiRepond",
  "comptePourLesPoints", "compteLesScenes", "visibilite", "anneeMinimale",
  "ouvert", "majLe"
) VALUES (
  'espace-alentours', 'alentours', 'Les alentours',
  'Ce qui commence là où le château s’arrête : la falaise et la mer, le lac, la Forêt Sombre, Kaldvik en contrebas et le massif du nord. Tout ce qui s’y écrit est du jeu de rôle : dix lignes au minimum, et les points s’y gagnent.',
  2,
  10, 'TOUT_MEMBRE', 'TOUT_MEMBRE',
  true, true, 'TOUS', NULL,
  true, NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 2 — Les cinq zones.
--
-- Aucune n'est réservée à une maison : dehors, personne n'est chez soi.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections" ("id", "espaceId", "slug", "nom", "description", "ordre", "majLe") VALUES
  ('zone-falaise-et-mer', 'espace-alentours', 'la-falaise-et-la-mer',
   'La falaise et la mer',
   'À l’est du château, la roche tombe d’un coup dans la Mer du Nord. Le vent y vient du large sans rien rencontrer, le sel monte jusqu’aux fenêtres les jours de gros temps, et il n’y a pas dix mètres de plat entre le haut et le bas. Tout ce qui se joue ici se joue au bord.',
   1, NOW()),

  ('zone-le-lac', 'espace-alentours', 'le-lac',
   'Le Lac',
   'Au nord-ouest du château, une eau presque immobile, prise entre la forêt et le premier contrefort des plateaux. Elle se vide vers le sud par une rivière qui descend jusqu’à la mer. On y va pour le calme, ce qui est une raison suffisante — le reste du domaine n’en offre pas beaucoup.',
   2, NOW()),

  ('zone-foret-sombre', 'espace-alentours', 'la-foret-sombre',
   'La Forêt Sombre',
   'À l’ouest, elle borde le domaine du côté des terres et n’en finit pas : personne au château ne prétend savoir jusqu’où elle va. Les jeunes élèves y sont admis jusqu’aux repères peints, pas au-delà. Ce qui s’y joue se joue toujours un peu plus loin qu’on ne l’avait prévu.',
   3, NOW()),

  ('zone-kaldvik', 'espace-alentours', 'kaldvik',
   'Kaldvik, le village-port',
   'Une baie étroite, encaissée entre deux pans de roche noire, au pied de la falaise. Les familles qui y vivent approvisionnent l’école depuis des générations et voient passer des enfants de treize ans à la même période chaque année sans plus lever la tête. Depuis les quais, la falaise monte si haut qu’on ne voit pas le château — on sait seulement qu’il est là.',
   4, NOW()),

  ('zone-hauts-plateaux', 'espace-alentours', 'les-hauts-plateaux-de-givre',
   'Les Hauts Plateaux de Givre',
   'Le massif du nord, qu’on voit de partout et où l’on ne va pas : au-delà du lac, la forêt cède à la caillasse, la caillasse à la neige, et la neige ne s’en va jamais tout à fait. Le château n’y mène que de rares sorties, encadrées, et jamais au cœur de l’hiver.',
   5, NOW());

-- ─────────────────────────────────────────────────────────────
-- 3 — La falaise et la mer.
--
-- Le chemin escarpé est le seul lieu du domaine que TOUT LE MONDE a traversé :
-- c'est par là qu'on arrive. Il reste ouvert à la première année.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre", "anneeMinimale", "quiOuvreUnSujet", "majLe")
VALUES
  ('lieu-chemin-escarpe', 'espace-alentours', 'zone-falaise-et-mer', 'le-chemin-escarpe',
   'Le chemin escarpé',
   'La voie officielle entre Kaldvik et le château : une montée en lacets taillée dans la falaise, qui part du haut du village, là où les pavés cèdent la place au sentier. Longue, exposée, praticable. On la fait en pestant tout le reste de sa scolarité, et une première fois trempé, sans savoir encore ce qui attend en haut.',
   1, NULL, NULL, NOW()),

  ('lieu-sentier-des-corniches', 'espace-alentours', 'zone-falaise-et-mer', 'le-sentier-des-corniches',
   'Le sentier des corniches',
   'Une trace de chèvre qui longe le bord, là où la falaise se creuse en gradins. Pas de rambarde, pas de garde-fou, rien que l’herbe rase et le vide à trois pas. On y vient pour la vue, pour parler sans témoin, ou pour se prouver quelque chose — et l’on en revient les mains froides.',
   2, 'TROISIEME_ANNEE', NULL, NOW()),

  ('lieu-la-greve', 'espace-alentours', 'zone-falaise-et-mer', 'la-greve',
   'La grève, sous la falaise',
   'En bas, entre deux éboulis, une bande de galets noirs que la mer découvre à marée basse et reprend six heures plus tard. On y descend par une faille où l’on ne passe qu’un par un. Le bois flotté s’y entasse, les filets perdus aussi, et de temps à autre quelque chose qu’on remonte au village sans le regarder de trop près.',
   3, 'CINQUIEME_ANNEE', NULL, NOW()),

  -- Sur convocation : la zone des naufrages ne se visite pas de son propre
  -- chef. Le staff ouvre, l'élève embarqué répond.
  ('lieu-large-et-epaves', 'espace-alentours', 'zone-falaise-et-mer', 'le-large-et-les-epaves',
   'Le large et les épaves',
   'Au sud-est, à une heure de rame par mer calme — et il n’y a pas dix jours de mer calme par an —, des bancs de récifs affleurent, où plus d’une coque s’est ouverte. Les mâts dépassent encore, penchés dans le même sens. Les pêcheurs de Kaldvik contournent la zone de si loin qu’on la croirait plus large qu’elle n’est.',
   4, NULL, 'STAFF_SEULEMENT', NOW());

-- ─────────────────────────────────────────────────────────────
-- 4 — Le Lac.
--
-- La musique sous l'eau est une RUMEUR, et le texte la traite comme telle :
-- rien n'est nommé, et la phrase suivante la dément. Un personnage peut
-- spéculer, redouter, se tromper — il ne sait pas.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre", "anneeMinimale", "majLe")
VALUES
  ('lieu-rive-et-appontement', 'espace-alentours', 'zone-le-lac', 'la-rive-et-l-appontement',
   'La rive et l’appontement',
   'Un ponton de bois gris, quelques barques retournées, et une grève de galets ronds qui craquent sous le pas. C’est le premier endroit où l’on va quand on veut sortir des murs sans vraiment s’éloigner : le château se voit encore en entier, de biais, avec ses tours qui ne sont pas d’aplomb.',
   1, NULL, NOW()),

  ('lieu-la-cascade', 'espace-alentours', 'zone-le-lac', 'la-cascade',
   'La cascade',
   'Là où le lac se déverse et tombe d’un seul jet vers le port, tout en bas. Le bruit couvre les voix : il faut crier, ou renoncer à parler. La roche reste mouillée à dix pas, l’air y est plein d’eau, et les rares matins de soleil bas il s’y tient un arc-en-ciel que personne n’admet être venu voir.',
   2, NULL, NOW()),

  ('lieu-lac-en-barque', 'espace-alentours', 'zone-le-lac', 'le-lac-en-barque',
   'Le lac, en barque',
   'Au milieu, l’eau est noire et l’on ne voit pas le fond ; aucune sonde rapportée n’a jamais touché. Les barques sont vieilles mais saines, et la règle tient en une phrase : on rentre avant la nuit. Par temps très calme, certains jurent entendre une musique qui viendrait de dessous — et d’autres, qui ont l’oreille moins romanesque, entendent le vent dans les roseaux.',
   3, 'QUATRIEME_ANNEE', NOW());

-- ─────────────────────────────────────────────────────────────
-- 5 — La Forêt Sombre.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre", "anneeMinimale", "majLe")
VALUES
  ('lieu-la-lisiere', 'espace-alentours', 'zone-foret-sombre', 'la-lisiere',
   'La lisière',
   'La bande de bouleaux clairs entre le domaine et le vrai couvert, avec ses souches, ses ronces et son sol jonché d’aiguilles. On y ramasse des plantes pour l’herboristerie, on y sèche un cours, on y attend quelqu’un. Le château se voit entre les troncs, et c’est ce qui rassure.',
   1, NULL, NOW()),

  ('lieu-les-sentiers', 'espace-alentours', 'zone-foret-sombre', 'les-sentiers',
   'Les sentiers',
   'Passé la lisière, trois sentiers entretenus s’enfoncent sous les sapins, marqués de loin en loin d’une entaille peinte sur l’écorce. Ils suffisent à s’y perdre pour peu qu’on lève les yeux au mauvais moment : sous le couvert, la lumière est la même à midi et à quatre heures.',
   2, 'TROISIEME_ANNEE', NOW()),

  ('lieu-coeur-de-la-foret', 'espace-alentours', 'zone-foret-sombre', 'le-coeur-de-la-foret',
   'Le cœur de la forêt',
   'Là où les entailles s’arrêtent. Les troncs sont plus gros, l’humus étouffe le bruit des pas, et il ne reste de repère que la pente. Les professeurs n’interdisent pas d’y aller ; ils demandent qu’on prévienne quelqu’un avant, ce qui revient à peu près au même.',
   3, 'CINQUIEME_ANNEE', NOW()),

  ('lieu-passage-secret', 'espace-alentours', 'zone-foret-sombre', 'le-passage-secret',
   'Le passage secret',
   'Une entaille dans la roche, sous les racines, que la forêt cache si bien qu’il faut l’avoir vue une fois pour la retrouver. Elle ressort aux abords de Kaldvik et évite toute la montée. Son existence n’est un secret pour personne au château ; son entrée, si — et l’on ne la montre pas à n’importe qui.',
   4, 'QUATRIEME_ANNEE', NOW());

-- ─────────────────────────────────────────────────────────────
-- 6 — Kaldvik.
--
-- L'échoppe reprend mot pour mot les détails de la scène d'achat de la
-- baguette — l'enseigne gravée, le crâne d'ours au linteau, la dernière porte
-- avant le sentier. Deux textes qui se contredisent coûtent plus cher qu'une
-- répétition : c'est la leçon de la Salle de Banquet.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre", "anneeMinimale", "majLe")
VALUES
  ('lieu-les-quais', 'espace-alentours', 'zone-kaldvik', 'les-quais',
   'Les quais',
   'Des pontons de bois noir, des casiers empilés, une odeur de poisson et de goudron qui tient à la laine et ne part plus. C’est ici qu’on débarque la première fois, et ici qu’on repart. Les bateaux entrent à la rame les jours de vent contraire, et le village sait qui arrive avant que le pied ait touché terre.',
   1, NULL, NOW()),

  ('lieu-place-et-ruelles', 'espace-alentours', 'zone-kaldvik', 'la-place-et-les-ruelles',
   'La place et les ruelles',
   'Une seule rue pavée qui monte, et des ruelles qui s’en détachent vers les maisons basses aux toits lestés de pierres. Une place, un puits, deux commerces sans enseigne parce que tout le monde sait ce qu’on y vend. Les élèves y sont tolérés poliment, comme on tolère le temps qu’il fait.',
   2, NULL, NOW()),

  ('lieu-echoppe-bjornstav', 'espace-alentours', 'zone-kaldvik', 'l-echoppe-bjornstav',
   'L’échoppe Bjornstav',
   'La dernière porte en haut de la rue, avant que les pavés cèdent au sentier. Pas de vitrine : une porte basse, une enseigne de bois noircie où le nom est gravé si profond qu’il tient malgré des siècles d’embruns, et au-dessus, cloué au linteau, un crâne d’ours lavé jusqu’à l’os. Personne n’a jamais vu d’ours sur cette côte.',
   3, NULL, NOW()),

  ('lieu-le-phare', 'espace-alentours', 'zone-kaldvik', 'le-phare',
   'Le phare',
   'Au bout de la digue, sur un rocher que la mer couvre à moitié les soirs de tempête. On y accède par une chaussée de blocs, quand la mer le veut bien. Le gardien parle peu, laisse monter qui le demande poliment, et éteint la conversation en même temps que la lampe, au petit matin.',
   4, 'TROISIEME_ANNEE', NOW());

-- ─────────────────────────────────────────────────────────────
-- 7 — Les Hauts Plateaux de Givre.
--
-- Une seule pièce, sur convocation. La bible les dit « peu exploités » : le
-- lieu existe pour que la carte ne mente pas, et rien ne s'y joue tant que le
-- château ne l'a pas décidé.
-- ─────────────────────────────────────────────────────────────

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre", "quiOuvreUnSujet", "majLe")
VALUES
  ('lieu-montee-aux-plateaux', 'espace-alentours', 'zone-hauts-plateaux', 'la-montee-aux-plateaux',
   'La montée aux plateaux',
   'Le sentier part de la pointe nord du lac et grimpe des heures entre les blocs, jusqu’à la ligne où plus rien ne pousse. Au-dessus, il n’y a plus de sentier du tout : le vent, la pierre, et une lumière qui ment sur les distances. On n’y monte pas seul, et l’on n’y monte pas sans qu’un professeur l’ait décidé.',
   1, 'STAFF_SEULEMENT', NOW());
