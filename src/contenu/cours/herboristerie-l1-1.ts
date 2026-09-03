import "server-only";

/**
 * La leçon 1 de Herboristerie nordique — « Reconnaître ».
 *
 * Même rangement que `sortileges-l1-1.ts` : un module TypeScript parce
 * qu'une leçon doit être **déployée** et **gardée**, et que `public/` ne
 * garde rien tandis que `fs` ne se déploie pas à coup sûr.
 *
 * ⚠️ **Elles sont six, et la première année est complète.** C'est le signal
 * que le joueur avait lui-même posé le 2 septembre 2026 pour la bascule en
 * base : « quand les envois s'arrêteront, ou quand la première année sera
 * complète ». Elle l'est. La bascule n'a pas été faite ici, faute de temps
 * avant l'ouverture aux élèves — **à lui reproposer**, avec son script
 * d'import, plutôt qu'à décider en voyant le dossier grossir.
 *
 * ── Ce qui a changé par rapport au fichier d'origine ──
 *
 * Une seule chose, la même que pour les cinq autres : les trois
 * `data:image` sont devenus l'adresse `/cours/herboristerie/atelier.jpg`.
 * C'était **la même image encodée trois fois**, 699 Ko dont 466 pour
 * rien, et rien de tout cela ne pouvait être mis en cache. La page passe de
 * 959 Ko à 29 Ko ; l'image est téléchargée une fois et gardée.
 *
 * Le reste — le texte, la mise en scène, les fiches de plantes et l'exercice de reconnaissance — est celui du joueur,
 * au signe près. Les apostrophes droites comprises.
 */

export const LECON_HERBORISTERIE_L1_1 = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Herboristerie nordique — Leçon 1 : Reconnaître</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Spectral:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@300;500&display=swap" rel="stylesheet">
<style>
:root{
  --encre:#0B1017; --nuit:#111A24; --pierre:#18232F; --trait:#26343F;
  --brume:#7A8FA1; --givre:#B9C8D4; --argent:#E4ECF2;
  --lueur:#6FA8B8; --lueur-sourde:#3E5F6B; --craie:#D8DFE4; --seve:#8FA57E;
  --alerte:#8E6B72; --alerte-vive:#B08088;
  --display:'Cormorant Garamond',Georgia,serif;
  --corps:'Spectral',Georgia,serif;
  --data:'JetBrains Mono',ui-monospace,monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body::before{content:"";position:fixed;inset:0;z-index:-2;
  background:url("/cours/herboristerie/atelier.jpg") center 45% / cover no-repeat;
  opacity:.42;filter:saturate(.55) contrast(1.02) blur(1.6px)}
body::after{content:"";position:fixed;inset:0;z-index:-1;
  background:linear-gradient(180deg,rgba(11,16,23,.58) 0%,rgba(11,16,23,.84) 38%,rgba(11,16,23,.93) 70%,rgba(11,16,23,.96) 100%)}
body{background:var(--encre);color:var(--givre);font-family:var(--corps);font-weight:300;
  font-size:17px;line-height:1.72;-webkit-font-smoothing:antialiased}
.wrap{max-width:760px;margin:0 auto;padding:0 24px 120px}

/* ---------- seuil ---------- */
#seuil{position:fixed;inset:0;background:var(--encre);z-index:60;overflow:hidden;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:32px;transition:opacity 1.4s ease}
#seuil-fond{position:absolute;inset:0;z-index:-1;
  background:url("/cours/herboristerie/atelier.jpg") center 48% / cover no-repeat;opacity:.36}
#seuil.parti{opacity:0;pointer-events:none}
#seuil .eyebrow{font-family:var(--data);font-size:10px;letter-spacing:.28em;
  text-transform:uppercase;color:var(--lueur-sourde);margin-bottom:26px}
#seuil h1{font-family:var(--display);font-weight:300;font-size:clamp(32px,6.5vw,54px);
  margin:0 0 18px;color:var(--argent)}
#seuil p{max-width:48ch;color:var(--brume);margin:0 0 28px;font-size:17px}
#cire{opacity:0;transition:opacity 1.6s ease;margin:0 0 28px}
#cire.on{opacity:1}
#cire .n{font-family:var(--data);font-size:26px;letter-spacing:.3em;color:var(--givre)}
#cire .l{font-size:14.5px;color:var(--brume);font-style:italic;margin-top:8px}
.lien-passer{background:none;border:none;color:#31414D;font-family:var(--corps);
  font-size:13px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;
  padding:8px;text-decoration:underline;text-underline-offset:4px;margin-top:16px}
.lien-passer:hover{color:var(--brume)}
#barre{position:fixed;top:0;left:0;height:2px;background:var(--lueur);width:0;z-index:50;transition:width .15s linear}

/* ---------- en-tête ---------- */
header.tete{border-bottom:1px solid var(--trait);margin-bottom:56px;padding:30px 0 22px}
.fil{font-family:var(--data);font-size:10px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--brume);margin-bottom:14px}
h1.titre{font-family:var(--display);font-weight:300;font-size:clamp(32px,6vw,52px);
  margin:0 0 22px;color:var(--argent);line-height:1.06}
.module{display:flex;align-items:center;gap:20px;border:1px solid var(--trait);
  background:var(--nuit);padding:18px 24px}
.module .g{width:34px;height:34px;flex:0 0 34px;border:1px solid var(--seve);opacity:.5;
  border-radius:2px 14px 2px 14px}
.module b{display:block;font-family:var(--display);font-size:23px;font-weight:400;color:var(--argent)}
.module i{font-size:14.5px;color:var(--brume)}

h2{font-family:var(--data);font-size:11px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--lueur);font-weight:500;margin:64px 0 18px}
p{margin:0 0 20px}
.dial{margin:0 0 22px;padding-left:22px;border-left:1px solid var(--lueur-sourde);
  color:var(--argent);font-size:18px;font-style:italic}
.aparte{color:var(--brume);font-size:15.5px;font-style:italic}
.alerte{margin:26px 0;padding:20px 24px;border:1px solid var(--trait);
  border-left:2px solid var(--alerte);background:var(--nuit);color:var(--givre);font-size:16.5px}

/* ---------- salle ---------- */
.salle{position:relative;border:1px solid var(--trait);margin:0 0 -1px;padding:0;line-height:0}
.salle img{width:100%;height:auto;display:block}
.salle figcaption{font-family:var(--data);font-size:10px;letter-spacing:.18em;line-height:1.6;
  text-transform:uppercase;color:#4A5B68;text-align:center;padding:11px 0 12px;background:var(--nuit)}
.hots{position:absolute;inset:0}
.hot{position:absolute;transform:translate(-50%,-50%);width:30px;height:30px;padding:0;
  border-radius:50%;border:1px solid rgba(111,168,184,.55);background:rgba(11,16,23,.55);
  backdrop-filter:blur(2px);cursor:pointer;display:grid;place-items:center;
  transition:background .25s,border-color .25s,transform .25s}
.hot i{font-family:var(--data);font-size:11px;font-style:normal;color:var(--givre);line-height:1}
.hot::after{content:"";position:absolute;inset:-7px;border-radius:50%;
  border:1px solid rgba(111,168,184,.28);animation:pulse 3.4s ease-out infinite}
@keyframes pulse{0%{transform:scale(.82);opacity:.9}70%,100%{transform:scale(1.35);opacity:0}}
.hot:hover,.hot:focus-visible{background:rgba(111,168,184,.32);border-color:var(--lueur);
  transform:translate(-50%,-50%) scale(1.12);outline:none}
.hot.actif{background:rgba(111,168,184,.45);border-color:var(--craie)}
.hot.actif::after{animation:none;opacity:0}
#detail{border:1px solid var(--trait);border-top:none;background:rgba(24,35,47,.94);
  padding:22px 26px;min-height:96px;margin-bottom:12px}
#detail .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--lueur);margin-bottom:8px}
#detail p{margin:0;font-size:16px;color:var(--givre)}
#detail.vide p{color:var(--brume);font-style:italic}

/* ---------- exercice ---------- */
.exo{border:1px solid var(--trait);background:var(--nuit);margin:12px 0 8px}
.exo-tete{padding:22px 26px 0}
.exo-tete .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--lueur);margin-bottom:8px}
.exo-tete h3{font-family:var(--display);font-size:26px;font-weight:400;margin:0 0 8px;color:var(--argent)}
.exo-tete p{font-size:15.5px;color:var(--brume);margin:0 0 4px}
.touffes{display:flex;gap:10px;padding:16px 26px 4px}
.touffe{flex:1;border:1px solid var(--trait);background:rgba(13,20,27,.6);padding:14px 12px;
  text-align:center;cursor:pointer;transition:border-color .2s,background .2s}
.touffe:hover{border-color:var(--lueur-sourde)}
.touffe.actif{border-color:var(--seve);background:rgba(143,165,126,.09)}
.touffe .n{font-family:var(--data);font-size:10px;letter-spacing:.2em;color:var(--brume);text-transform:uppercase}
.touffe .s{font-family:var(--display);font-size:19px;color:var(--givre);margin-top:6px}
.touffe .v{font-family:var(--data);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
  margin-top:8px;color:#41525F;min-height:14px}
.touffe.faite .v{color:var(--seve)}
.grille-desc{padding:18px 26px 0}
.crit{display:grid;grid-template-columns:130px 1fr;gap:14px;align-items:start;
  padding:11px 0;border-bottom:1px solid var(--trait);opacity:.32;pointer-events:none;
  transition:opacity .3s}
.crit.ouvert{opacity:1;pointer-events:auto}
.crit.rempli{opacity:.75}
.crit .k{font-family:var(--data);font-size:10px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--brume);padding-top:8px}
.crit .opts{display:flex;gap:7px;flex-wrap:wrap}
.opt{background:none;border:1px solid var(--trait);color:var(--givre);cursor:pointer;
  font-family:var(--corps);font-size:14.5px;padding:6px 13px;transition:border-color .2s,background .2s}
.opt:hover{border-color:var(--lueur-sourde);background:var(--pierre)}
.opt.pris{border-color:var(--seve);background:rgba(143,165,126,.12);color:var(--argent)}
.exo-pied{display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:18px 26px 22px;flex-wrap:wrap}
#verdict{font-family:var(--data);font-size:11.5px;letter-spacing:.06em;color:var(--brume);
  min-height:20px;flex:1;text-transform:uppercase}
#verdict.ok{color:var(--seve)}
#verdict.ko{color:var(--alerte-vive)}
#reveal{display:none;padding:0 26px 22px}
#reveal.on{display:block}
#reveal .r{display:grid;grid-template-columns:110px 1fr;gap:14px;padding:12px 0;
  border-top:1px solid var(--trait);font-size:15.5px}
#reveal .r .t{font-family:var(--data);font-size:10px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--brume);padding-top:4px}
#reveal .r.mauvaise .d{color:var(--alerte-vive)}

/* ---------- bocaux ---------- */
.mur{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:16px 26px 4px}
.boc{aspect-ratio:.62;border:1px solid var(--trait);background:linear-gradient(180deg,rgba(13,20,27,.8),rgba(24,35,47,.5));
  border-radius:2px 2px 3px 3px;cursor:pointer;display:flex;flex-direction:column;
  justify-content:flex-end;align-items:center;padding:0 0 6px;transition:border-color .2s,background .2s}
.boc::before{content:"";width:62%;height:26%;border:1px solid var(--trait);border-bottom:none;
  margin-bottom:auto;margin-top:8%;background:rgba(216,223,228,.05)}
.boc .et{width:78%;height:22%;background:rgba(216,223,228,.12);border-radius:1px}
.boc:hover{border-color:var(--lueur-sourde)}
.boc.actif{border-color:var(--seve);background:rgba(143,165,126,.08)}
.boc.actif .et{background:rgba(143,165,126,.35)}
#etiquette{margin:16px 26px 0;border-top:1px solid var(--trait);padding-top:16px;min-height:62px}
#etiquette .nom{font-family:var(--display);font-size:22px;color:var(--argent)}
#etiquette .an{font-family:var(--data);font-size:10px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--seve);margin-left:12px}
#etiquette .txt{font-size:15.5px;color:var(--brume);margin-top:5px}
#etiquette.vide .txt{font-style:italic}

.ardoise{border:1px solid var(--trait);background:linear-gradient(180deg,#141D26,#101822);
  padding:28px 30px;margin:8px 0}
.ardoise .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--brume);margin-bottom:16px}
.ardoise ul{margin:0;padding:0;list-style:none}
.ardoise li{padding:0 0 12px 20px;position:relative;font-size:16px;color:var(--givre)}
.ardoise li::before{content:"";position:absolute;left:0;top:11px;width:7px;height:1px;background:var(--seve);opacity:.7}
.ardoise li:last-child{padding-bottom:0}
.consigne{border:1px solid var(--trait);border-left:2px solid var(--lueur-sourde);
  background:var(--nuit);padding:24px 28px;margin:8px 0 0}
.pied{margin-top:72px;border-top:1px solid var(--trait);padding-top:34px;
  display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.pied .note{font-size:14.5px;color:var(--brume);font-style:italic;max-width:44ch}
.verrou{font-family:var(--data);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--brume)}
button.acte{font-family:var(--corps);font-size:13px;letter-spacing:.1em;text-transform:uppercase;
  padding:11px 22px;background:none;border:1px solid var(--trait);color:var(--givre);
  cursor:pointer;transition:border-color .2s,color .2s,background .2s}
button.acte:hover:not(:disabled){border-color:var(--lueur-sourde);color:var(--argent);background:var(--pierre)}
button.acte.primaire{border-color:var(--lueur-sourde);color:var(--lueur)}
button.acte.primaire:hover:not(:disabled){background:rgba(111,168,184,.08)}
button.acte:disabled{opacity:.35;cursor:not-allowed}
button.acte:focus-visible{outline:2px solid var(--lueur);outline-offset:2px}

@media (max-width:640px){
  body{font-size:16px}
  .exo-tete,.exo-pied,.grille-desc,.touffes,.mur{padding-left:18px;padding-right:18px}
  #etiquette{margin-left:18px;margin-right:18px}
  .crit{grid-template-columns:1fr}
  .mur{grid-template-columns:repeat(4,1fr)}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>

<div id="barre"></div>

<div id="seuil">
  <div id="seuil-fond"></div>
  <div class="eyebrow">Herboristerie nordique · Première année · Leçon 1 sur 4</div>
  <h1>Prenez un ciré</h1>
  <p id="seuil-txt">Elle ne se présente pas. Elle désigne le mur de droite, où pendent une trentaine de cirés noirs, un par patère, et attend que la classe se serve.</p>
  <div id="cire">
    <div class="n">XVII</div>
    <div class="l">Votre patère porte un numéro. Ce sera la vôtre pendant sept ans.</div>
  </div>
  <button class="acte primaire" id="btn-entrer">Décrocher un ciré</button>
  <button class="lien-passer" id="btn-passer">Passer l'introduction</button>
</div>

<div class="wrap">

  <header class="tete">
    <div class="fil">Herboristerie nordique · Première année · Leçon 1 sur 4</div>
    <h1 class="titre">Reconnaître</h1>
    <div class="module">
      <div class="g"></div>
      <div><b>Module : Les plantes du domaine</b><i>On marche, on regarde, et on ne ramasse rien.</i></div>
    </div>
  </header>

  <h2>La salle</h2>
  <p>Un atelier bas de plafond, au bout de l'aile ouest, entre les cuisines et la cour. Charpente noire, dalles de pierre, et une rigole creusée dans le sol qui court jusqu'à une grille : la salle se lave à grande eau tous les soirs, parce qu'on y rentre toujours crotté.</p>
  <p>Le mur de gauche est un mur de bocaux. Des centaines, sur huit rangs, étiquetés d'écritures différentes selon les décennies. Les tables sont couvertes de presses à herbier, de pelotes de ficelle, de sécateurs et de piles de papier buvard. Il n'y a pas une baguette dans la pièce.</p>

  <div class="salle">
    <img src="/cours/herboristerie/atelier.jpg" alt="L'atelier d'herboristerie, vu depuis l'entrée">
    <div class="hots">
      <button class="hot" style="left:13%;top:38%"   data-k="bocaux" aria-label="Le mur de bocaux"><i>1</i></button>
      <button class="hot" style="left:29%;top:63%"   data-k="presses" aria-label="Les presses"><i>2</i></button>
      <button class="hot" style="left:55%;top:31%"   data-k="carte" aria-label="La carte du domaine"><i>3</i></button>
      <button class="hot" style="left:55%;top:41%"   data-k="herbiers" aria-label="Les herbiers anciens"><i>4</i></button>
      <button class="hot" style="left:80%;top:44%"   data-k="cires" aria-label="Les cirés"><i>5</i></button>
      <button class="hot" style="left:67%;top:95%"   data-k="rigole" aria-label="La rigole"><i>6</i></button>
    </div>
    <figcaption>Six points à examiner</figcaption>
  </div>
  <div id="detail" class="vide"><p>Touchez un point de la salle pour vous en approcher.</p></div>

  <h2>Celle qui enseigne</h2>
  <p>Elle vient de Kaldvik, et c'est le seul professeur du château dans ce cas. Elle a les mains d'une femme qui travaille dehors, et elle ne porte de robe qu'aux repas.</p>
  <p>Elle donne toujours deux noms à une plante : celui du village d'abord, celui des livres ensuite. Quand les deux se contredisent, elle dit lequel elle emploie et pourquoi, et ce n'est pas toujours celui des livres.</p>

  <h2>Le cours</h2>
  <p>Elle sort dans la cour, s'accroupit au pied du mur sud et attend que la classe fasse cercle autour d'elle. Puis elle montre trois touffes de vert qui se ressemblent.</p>
  <p class="dial">« L'une soigne, l'une ne fait rien, l'une vous mettra deux jours à l'infirmerie. Vous les regarderez jusqu'à ce que vous cessiez de les confondre. Nous avons l'année. »</p>
  <p>Elle ne dit pas laquelle est laquelle, et ne le dira qu'à la fin de l'heure.</p>

  <div class="exo">
    <div class="exo-tete">
      <div class="lbl">Exercice de description</div>
      <h3>Les trois touffes</h3>
      <p id="exo-consigne">Choisissez une touffe, puis décrivez-la dans l'ordre imposé. Chaque critère n'ouvre le suivant qu'une fois rempli.</p>
    </div>
    <div class="touffes" id="touffes"></div>
    <div class="grille-desc" id="grille"></div>
    <div id="reveal"></div>
    <div class="exo-pied">
      <div id="verdict"></div>
      <button class="acte" id="btn-reprendre">Reprendre</button>
    </div>
  </div>

  <p>Personne ne cueille. Elle refuse deux fois qu'un élève arrache quelque chose pour mieux voir.</p>
  <p class="dial">« Vous regardez avec les yeux. Une plante arrachée ne vous apprendra rien de plus et ne repoussera pas. »</p>

  <h2>Le mur de bocaux</h2>
  <p>De retour dans l'atelier, elle laisse la classe devant le mur pendant qu'elle range les cirés. La plupart des bocaux ne concernent pas la première année, et elle ne dit pas lesquels.</p>

  <div class="exo">
    <div class="exo-tete">
      <div class="lbl">Le mur de gauche</div>
      <h3>Lire les étiquettes</h3>
      <p>Douze bocaux à hauteur d'yeux. Touchez-en un pour lire ce qu'il porte.</p>
    </div>
    <div class="mur" id="mur"></div>
    <div id="etiquette" class="vide"><div class="txt">Aucun bocal sélectionné.</div></div>
    <div style="padding:18px 26px 22px"></div>
  </div>

  <h2>La liste noire</h2>
  <p>L'heure se termine par une liste, apprise debout, récitée avant chaque sortie de l'année. Elle ne comporte que quelques espèces et elle ne s'allonge pas : ce sont celles qu'un élève de première année ne touche sous aucun prétexte.</p>
  <div class="alerte">« Une plante que vous ne savez pas nommer ne se ramasse pas. Pas même pour me la montrer. Vous la laissez où elle est et vous venez me chercher. Si je suis occupée, elle attendra : elle est là depuis plus longtemps que vous. »</div>
  <p>La classe monte ensuite au séchoir, sous les combles, où elle fait retrouver les mêmes espèces, sèches cette fois, et méconnaissables. C'est le moment de la leçon où la moitié des élèves comprend que la matière sera plus difficile qu'ils ne le pensaient.</p>

  <h2>Ce qu'elle laisse au tableau du séchoir</h2>
  <div class="ardoise">
    <div class="lbl">Les plantes du domaine · première leçon</div>
    <ul>
      <li>On décrit avant de nommer, on nomme avant de cueillir.</li>
      <li>Port, feuille, nervure, tige, bord, odeur, saison. Dans cet ordre, toujours le même.</li>
      <li>Une plante sèche ne ressemble pas à la même plante fraîche.</li>
      <li>Jamais en contrebas du chemin balisé, aucune exception, aucune année.</li>
      <li>On ne prélève jamais plus d'un tiers d'une station, et jamais deux années de suite au même endroit.</li>
    </ul>
  </div>

  <h2>Ce qu'elle demande pour la semaine</h2>
  <div class="consigne">
    <p class="dial" style="margin-bottom:0">« Trouvez les trois touffes de ce matin. Décrivez-les par écrit sans les nommer, et sans y toucher. J'aurai vos trois descriptions et je devrai reconnaître laquelle est laquelle. Si je n'y arrive pas, c'est vous qui aurez raté, pas moi. »</p>
  </div>
  <p style="margin-top:22px">En sortant, vous raccrochez votre ciré à la patère dix-sept. Il est déjà humide, et il le restera jusqu'en juin.</p>

  <div class="pied">
    <div class="note">Le contrôle compte cinq questions. Vos réponses restent modifiables tant que vous ne l'avez pas envoyé. L'envoi est définitif.</div>
    <div style="text-align:right">
      <button class="acte primaire" id="btn-controle">Passer le contrôle</button>
      <div class="verrou" style="margin-top:10px">Leçon 2 scellée · sept jours après l'envoi</div>
    </div>
  </div>

</div>

<script>
/* ---------- seuil ---------- */
const seuil = document.getElementById('seuil');
function ouvrir(){ seuil.classList.add('parti'); setTimeout(()=>seuil.style.display='none',1400); }
document.getElementById('btn-passer').addEventListener('click', ouvrir);
document.getElementById('btn-entrer').addEventListener('click', function(){
  this.style.display='none';
  document.getElementById('seuil-txt').textContent =
    "Il est trop grand, il sent le poisson et la cire froide, et il est trempé à l'intérieur.";
  document.getElementById('cire').classList.add('on');
  document.getElementById('btn-passer').textContent = "Sortir dans la cour";
});
window.addEventListener('scroll', ()=>{
  const h = document.body.scrollHeight - window.innerHeight;
  document.getElementById('barre').style.width = (window.scrollY / h * 100) + '%';
});

/* ---------- salle ---------- */
const DETAILS = {
  bocaux:['Le mur de bocaux',
    "Des centaines, sur huit rangs, étiquetés d'écritures différentes selon les décennies. Les trois rangs du bas sont ceux du programme ; ceux du haut demandent une échelle, et l'échelle ne sort pas pour les premières années."],
  presses:['Les presses',
    "Une par table, à vis de bois. On y met les planches d'herbier entre deux buvards, on serre, et on attend. Serrer trop fort écrase la nervure, qui est précisément ce qu'on cherchait à montrer."],
  carte:['La carte du domaine',
    "Punaisée au fond, dessinée à la main, reprise à chaque génération. Elle porte les stations : où pousse quoi, en quelle quantité, et depuis quand. Les stations épuisées sont barrées, jamais effacées."],
  herbiers:['Les herbiers anciens',
    "Une rangée de volumes reliés sous la carte. Ce sont ceux qu'on consulte, pas ceux qu'on dépose : les herbiers de fin d'études partent à la bibliothèque. Deux d'entre eux contiennent des planches d'espèces qu'on ne trouve plus sur le domaine."],
  cires:['Les cirés',
    "Une trentaine, une patère numérotée par élève, attribuée le premier jour et gardée sept ans. Ils ne sèchent jamais complètement entre octobre et avril, et personne ne s'en plaint deux fois."],
  rigole:['La rigole',
    "Creusée dans les dalles, elle court jusqu'à une grille au fond de la salle. On lave l'atelier à grande eau chaque soir, parce qu'on y rentre crotté et que la terre rapportée du dehors fausse tout ce qu'on y pose."]
};
const detail = document.getElementById('detail');
document.querySelectorAll('.hot').forEach(h=>{
  h.addEventListener('click', ()=>{
    document.querySelectorAll('.hot').forEach(x=>x.classList.remove('actif'));
    h.classList.add('actif');
    const d = DETAILS[h.dataset.k];
    detail.classList.remove('vide');
    detail.innerHTML = '<div class="lbl">'+d[0]+'</div><p>'+d[1]+'</p>';
  });
});

/* ---------- les trois touffes ---------- */
const CRIT = [
  ["Port", ["Rampant","Dressé","En touffe basse"]],
  ["Feuille", ["Simple","Découpée","En aiguille"]],
  ["Nervure", ["Une seule","Parallèles","En réseau"]],
  ["Tige", ["Ronde","Carrée","Creuse"]],
  ["Bord", ["Lisse","Denté","Enroulé"]],
  ["Odeur", ["Aucune","Résineuse","Poivrée"]],
  ["Saison", ["Toute l'année","Fleurit en été","Fleurit tard"]]
];
const TOUFFES = [
  { n:"Première", cle:["En touffe basse","Simple","En réseau","Carrée","Denté","Poivrée","Fleurit tard"],
    nom:"Achillée millefeuille", role:"Elle soigne", d:"Elle arrête les petits saignements. Vous en poserez sur une coupure avant la fin du mois." },
  { n:"Deuxième", cle:["Rampant","Simple","Parallèles","Ronde","Lisse","Aucune","Toute l'année"],
    nom:"Oseille des bois", role:"Elle ne fait rien", d:"Comestible, acidulée, sans le moindre usage. Elle est là pour occuper la place et vous apprendre à ne pas voir des vertus partout." },
  { n:"Troisième", cle:["Dressé","Découpée","En réseau","Creuse","Denté","Résineuse","Fleurit en été"],
    nom:"Grande ciguë", role:"Deux jours à l'infirmerie", d:"Tige creuse, tachée de pourpre à la base, odeur désagréable quand on la froisse. Elle figure en tête de la liste noire, et vous la réciterez avant chaque sortie." }
];
let choisie = -1, etape = 0, saisie = [];

const contTouffes = document.getElementById('touffes');
const grille = document.getElementById('grille');
const verdict = document.getElementById('verdict');
const reveal = document.getElementById('reveal');

function dit(t, c){ verdict.textContent = t || ''; verdict.className = c || ''; }

function dessinerTouffes(){
  contTouffes.innerHTML = '';
  TOUFFES.forEach((t,i)=>{
    const b = document.createElement('button');
    b.className = 'touffe' + (i===choisie ? ' actif':'') + (t.faite ? ' faite':'');
    b.innerHTML = '<div class="n">'+t.n+'</div><div class="s">Touffe '+(i+1)+'</div>'+
                  '<div class="v">'+(t.faite ? 'décrite' : '&nbsp;')+'</div>';
    b.addEventListener('click', ()=>{ choisie = i; etape = 0; saisie = []; dessinerTouffes(); dessinerGrille();
      dit('Décrivez dans l\\u2019ordre. Le port, d\\u2019abord.'); });
    contTouffes.appendChild(b);
  });
}
function dessinerGrille(){
  grille.innerHTML = '';
  if(choisie < 0){
    grille.innerHTML = '<p style="color:var(--brume);font-style:italic;font-size:15.5px;padding:8px 0">Choisissez une touffe pour ouvrir la grille.</p>';
    return;
  }
  CRIT.forEach((c,i)=>{
    const d = document.createElement('div');
    d.className = 'crit' + (i===etape ? ' ouvert':'') + (i<etape ? ' rempli ouvert':'');
    let opts = '';
    c[1].forEach(o=>{
      const pris = saisie[i] === o;
      opts += '<button class="opt'+(pris?' pris':'')+'" data-i="'+i+'" data-o="'+o+'">'+o+'</button>';
    });
    d.innerHTML = '<div class="k">'+c[0]+'</div><div class="opts">'+opts+'</div>';
    grille.appendChild(d);
  });
  grille.querySelectorAll('.opt').forEach(b=>{
    b.addEventListener('click', ()=>{
      const i = +b.dataset.i;
      if(i !== etape) return;
      saisie[i] = b.dataset.o;
      etape++;
      dessinerGrille();
      if(etape < CRIT.length) dit(etape + ' critère' + (etape>1?'s':'') + ' sur ' + CRIT.length);
      else terminer();
    });
  });
}
function terminer(){
  const t = TOUFFES[choisie];
  let justes = 0;
  saisie.forEach((v,i)=>{ if(v === t.cle[i]) justes++; });
  t.faite = true;
  dessinerTouffes();
  reveal.classList.add('on');
  reveal.innerHTML =
    '<div class="r"><div class="t">Votre relevé</div><div class="d">' + justes + ' critère' + (justes>1?'s':'') +
    ' sur ' + CRIT.length + ' correspondent à ce qu\\'elle a noté de son côté.</div></div>' +
    '<div class="r' + (justes < 5 ? ' mauvaise':'') + '"><div class="t">' + t.role + '</div><div class="d"><b>' +
    t.nom + '</b>. ' + t.d + '</div></div>';
  if(justes >= 6) dit('Description juste. Vous auriez pu la nommer sans son aide.', 'ok');
  else if(justes >= 4) dit('Description passable. Elle vous ferait recommencer.', '');
  else dit('Vous avez regardé sans voir. C\\u2019est ce qu\\'elle attendait.', 'ko');
  const reste = TOUFFES.filter(x=>!x.faite).length;
  document.getElementById('exo-consigne').textContent = reste
    ? 'Il vous reste ' + reste + ' touffe' + (reste>1?'s':'') + ' à décrire.'
    : 'Les trois sont décrites. Vous savez maintenant laquelle est laquelle, et pourquoi.';
}
document.getElementById('btn-reprendre').addEventListener('click', ()=>{
  choisie = -1; etape = 0; saisie = [];
  TOUFFES.forEach(t=>delete t.faite);
  reveal.classList.remove('on'); reveal.innerHTML = '';
  dit('');
  document.getElementById('exo-consigne').textContent =
    "Choisissez une touffe, puis décrivez-la dans l'ordre imposé. Chaque critère n'ouvre le suivant qu'une fois rempli.";
  dessinerTouffes(); dessinerGrille();
});
dessinerTouffes(); dessinerGrille();

/* ---------- le mur de bocaux ---------- */
const BOCAUX = [
 ["Bruyère des falaises","1re année","Fleurs. Infusion contre la toux d'hiver. Le bocal le plus vide du mur en février."],
 ["Camarine noire","1re année","Baies. Jus, réserves, teinture sombre. Le village en fait autre chose, et elle vous dira quoi."],
 ["Airelle rouge","1re année","Baies. Tisane et provisions d'hiver."],
 ["Angélique du littoral","1re année","Tige. Digestif, aromate, conservation."],
 ["Mousse d'Islande","1re année","Thalle. Décoction adoucissante pour la gorge."],
 ["Achillée millefeuille","1re année","Feuilles. Arrête les petits saignements. Vous venez de la décrire dehors."],
 ["Bouleau nain","1re année","Écorce. Décoction contre les douleurs."],
 ["Genévrier","2e année","Baies. Conservation et fumigation de la réserve. Pas au programme cette année."],
 ["Sphaigne","3e année","Mousse entière. Pansement absorbant. Le bocal est deux fois plus grand que les autres."],
 ["Reine-des-prés","3e année","Fleurs. Tisane de fièvre. L'infirmerie en réclame tout l'hiver."],
 ["Étiquette illisible","",'L\\u2019encre a coulé. Le bocal est plein, la plante est reconnaissable, et personne ne l\\u2019a réétiquetée depuis des années.'],
 ["Bocal vide","","Lavé, séché, bouchon posé à côté. Il y en a toujours un de libre au bout du rang, et c\\u2019est délibéré."]
];
const mur = document.getElementById('mur');
const etiq = document.getElementById('etiquette');
BOCAUX.forEach((b,i)=>{
  const el = document.createElement('button');
  el.className = 'boc';
  el.setAttribute('aria-label', b[0]);
  el.innerHTML = '<div class="et"></div>';
  el.addEventListener('click', ()=>{
    document.querySelectorAll('.boc').forEach(x=>x.classList.remove('actif'));
    el.classList.add('actif');
    etiq.classList.remove('vide');
    etiq.innerHTML = '<div><span class="nom">'+b[0]+'</span>'+
                     (b[1] ? '<span class="an">'+b[1]+'</span>' : '')+'</div>'+
                     '<div class="txt">'+b[2]+'</div>';
  });
  mur.appendChild(el);
});

document.getElementById('btn-controle').addEventListener('click', function(){
  /* Le contrôle est une page à part, servie et gardée par le serveur.
     L'adresse se dérive de celle-ci : la leçon vit à /cours/1/<matiere>/1,
     son contrôle à /cours/1/<matiere>/1/controle. On ne l'écrit pas en dur —
     ce serait la seule chose de cette page qui connaîtrait le plan du site. */
  this.textContent = 'Ouverture du contrôle'; this.disabled = true;
  const ici = location.pathname;
  location.href = (ici.endsWith('/') ? ici.slice(0, -1) : ici) + '/controle';
});
</script>
</body>
</html>
`;
