-- La halle entre dans l'aile est.
--
-- Décision du joueur, 3 septembre 2026, après la mise en ligne de sa leçon de
-- magie défensive. Elle décrit une pièce que le forum ne portait pas : « une
-- halle voûtée au rez-de-chaussée de l'aile est ». L'article 12.4 fait de son
-- accord la condition pour inventer un lieu ; il l'a donné, et **ce texte fait
-- donc autorité pour le RP** au même titre que les vingt autres.
--
-- ⚠️ **Ce n'est PAS la salle de duel**, qui est dans la même aile, et les
-- confondre serait la faute à ne pas commettre :
--
--   • la salle de duel a un plancher marqué et exige la deuxième année. On y
--     apprend à perdre un duel ;
--   • la halle a des dalles et des cercles de craie, et n'exige rien. On y
--     apprend à reculer, à se tourner, et à repérer les sorties — avant
--     d'avoir le droit de lancer quoi que ce soit.
--
-- Deux pièces, deux usages, deux publics. La halle n'a donc pas d'année
-- minimale : c'est celle où entre un première année le jour de sa rentrée.
--
-- ── Ce que ce texte doit et ne doit pas ──
--
-- Tout vient de sa leçon, phrase par phrase : les meubles sortis depuis trop
-- longtemps, les dalles, la pierre nue, le froid de toute l'année, les bancs
-- bas des deux côtés, la trentaine de cercles refaits chaque matin, et les
-- anneaux pâles du mur du fond — des impacts que personne ne répare, et c'est
-- délibéré.
--
-- Les trois contrôles ont été refaits : le texte ne nomme ni la grotte ni le
-- sceau, n'annonce aucune créature du bestiaire (art. 13.6), et ne s'adresse
-- pas au joueur — il décrit une pièce, il ne donne pas de consigne.
--
-- ⚠️ **Le nom est mon seul apport, et il se change d'un mot.** La leçon ne la
-- nomme jamais autrement que « la halle » ; j'ai gardé ce mot plutôt que
-- d'inventer un qualificatif ou de la baptiser d'après une matière, ce
-- qu'aucun autre lieu du château ne fait.

INSERT INTO "sections"
  ("id", "espaceId", "parentId", "slug", "nom", "description", "ordre",
   "anneeMinimale", "maisonReservee", "majLe")
VALUES
  ('piece-la-halle', 'espace-domaine', 'sec-aile-est', 'la-halle',
   'La halle',
   'Une salle voûtée au rez-de-chaussée, dont on a sorti les meubles il y a si longtemps que personne ne se rappelle ce qu’il y avait avant. Dalles au sol, pierre nue aux murs, et froid toute l’année. Des bancs bas courent le long des deux côtés, une trentaine de cercles de craie sont refaits chaque matin, et le mur du fond garde les anneaux pâles des sorts qui ont manqué leur cible. On ne les répare pas, et ce n’est pas un oubli.',
   5, NULL, NULL, NOW());
