-- « Sur convocation » est une règle de PIÈCE, pas d'espace.
--
-- Le bureau de la direction et les bureaux des professeurs s'ouvrent « sur
-- convocation » : on n'y entre pas de son propre chef. Ce n'est ni une année,
-- ni une maison, ni un lieu fermé — un élève convoqué doit pouvoir répondre.
-- C'est bien « qui ouvre un sujet ici », et ce réglage ne vivait que sur
-- l'espace.
--
-- Le manque n'est apparu qu'en posant le contenu, et c'est normal : c'est
-- exactement pour ça que le contenu vient après le moteur.
--
-- Deux ajouts, entièrement additifs :
--
--   • `STAFF_SEULEMENT`, la valeur qui dit « sur convocation » en toutes
--     lettres. On aurait pu détourner `DETENTEUR_PERMISSION` sans maison —
--     mon code l'aurait refusé à tout le monde sauf au staff, ce qui est le
--     bon comportement pour la mauvaise raison, et le refus aurait annoncé
--     « il faut une permission » sans pouvoir dire laquelle.
--   • la colonne sur `sections`, nulle par défaut : on garde ce que l'espace
--     dit, comme les quatre autres surcharges.
--
-- Une section ne peut toujours que RESSERRER : la résolution prend la plus
-- stricte des deux valeurs, jamais celle de la section aveuglément.

ALTER TYPE "QuiOuvreUnSujet" ADD VALUE 'STAFF_SEULEMENT';

ALTER TABLE "sections" ADD COLUMN "quiOuvreUnSujet" "QuiOuvreUnSujet";
