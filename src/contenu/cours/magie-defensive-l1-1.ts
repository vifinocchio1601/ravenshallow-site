import "server-only";

/**
 * La leçon 1 de Magie défensive — « La garde et la distance ».
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
 * `data:image` sont devenus l'adresse `/cours/magie-defensive/halle.jpg`.
 * C'était **la même image encodée trois fois**, 474 Ko dont 316 pour
 * rien, et rien de tout cela ne pouvait être mis en cache. La page passe de
 * 660 Ko à 29 Ko ; l'image est téléchargée une fois et gardée.
 *
 * ⚠️ **Et une seconde, qui n'est pas de moi.** L'accord de « cercles »,
 * corrigé le 3 septembre 2026 à sa demande, **avait disparu de son envoi du
 * même jour** : son fichier de 8 h 42 le portait, celui du zip de 10 h 09 non.
 * Il a été reposé ici. C'est exactement ce que la note du lot précédent
 * annonçait — une correction portée dans le dépôt seul revient dès qu'on
 * repart de la source du joueur —, et c'est arrivé au premier renvoi.
 *
 * Le reste — le texte, la mise en scène, le plan de la halle en SVG et l'exercice de placement — est celui du joueur,
 * au signe près. Les apostrophes droites comprises.
 */

export const LECON_MAGIE_DEFENSIVE_L1_1 = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Magie défensive — Leçon 1 : La garde et la distance</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Spectral:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@300;500&display=swap" rel="stylesheet">
<style>
:root{
  --encre:#0B1017; --nuit:#111A24; --pierre:#18232F; --trait:#26343F;
  --brume:#7A8FA1; --givre:#B9C8D4; --argent:#E4ECF2;
  --lueur:#6FA8B8; --lueur-sourde:#3E5F6B; --craie:#D8DFE4;
  --alerte:#8E6B72; --alerte-vive:#B08088;
  --display:'Cormorant Garamond',Georgia,serif;
  --corps:'Spectral',Georgia,serif;
  --data:'JetBrains Mono',ui-monospace,monospace;
  --rune:'Segoe UI Symbol','Noto Sans Runic','Segoe UI Historic',serif;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body::before{content:"";position:fixed;inset:0;z-index:-2;
  background:url("/cours/magie-defensive/halle.jpg") center 40% / cover no-repeat;
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
  background:url("/cours/magie-defensive/halle.jpg") center 42% / cover no-repeat;
  opacity:.34}
#seuil.parti{opacity:0;pointer-events:none}
#seuil .eyebrow{font-family:var(--data);font-size:10px;letter-spacing:.28em;
  text-transform:uppercase;color:var(--lueur-sourde);margin-bottom:26px}
#seuil h1{font-family:var(--display);font-weight:300;font-size:clamp(32px,6.5vw,54px);
  margin:0 0 18px;color:var(--argent)}
#seuil p{max-width:48ch;color:var(--brume);margin:0 0 26px;font-size:17px}
#linteau{font-family:var(--rune);font-size:38px;letter-spacing:.5em;color:var(--givre);
  opacity:0;margin:0 0 10px;transition:opacity 2s ease}
#linteau.on{opacity:.85}
#linteau-note{font-size:14.5px;color:var(--brume);font-style:italic;opacity:0;
  margin:0 0 30px;transition:opacity 1.4s ease .8s}
#linteau-note.on{opacity:1}
.lien-passer{background:none;border:none;color:#31414D;font-family:var(--corps);
  font-size:13px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;
  padding:8px;text-decoration:underline;text-underline-offset:4px;margin-top:16px}
.lien-passer:hover{color:var(--brume)}

#barre{position:fixed;top:0;left:0;height:2px;background:var(--lueur);width:0;z-index:50;
  transition:width .15s linear}

/* ---------- en-tête ---------- */
header.tete{border-bottom:1px solid var(--trait);margin-bottom:56px;padding:30px 0 22px}
.retour{display:inline-block;font-family:var(--data);font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--brume);text-decoration:none;margin-bottom:14px;
  transition:color .3s}
.retour:hover,.retour:focus-visible{color:var(--givre)}
.fil{font-family:var(--data);font-size:10px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--brume);margin-bottom:14px}
h1.titre{font-family:var(--display);font-weight:300;font-size:clamp(32px,6vw,52px);
  margin:0 0 22px;color:var(--argent);line-height:1.06}
.module{display:flex;align-items:center;gap:20px;border:1px solid var(--trait);
  background:var(--nuit);padding:18px 24px}
.module .g{width:34px;height:34px;border-radius:50%;border:1px solid var(--craie);
  opacity:.45;flex:0 0 34px}
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
.etapes{display:flex;gap:8px;padding:16px 26px 14px}
.etape{flex:1;border-top:2px solid var(--trait);padding-top:8px;
  font-family:var(--data);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#41525F}
.etape.en-cours{border-top-color:var(--craie);color:var(--givre)}
.etape.faite{border-top-color:var(--lueur);color:var(--lueur)}
#plan{display:block;width:100%;height:auto}
.commande{padding:4px 26px 0}
.commande label{font-family:var(--data);font-size:10px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--brume);display:block;margin-bottom:10px}
input[type=range]{width:100%;accent-color:var(--lueur)}
.jauge{height:3px;background:var(--trait);position:relative;margin:16px 0 8px}
.jauge i{position:absolute;inset:0 auto 0 0;background:var(--lueur);transition:width .15s linear}
.jauge b{position:absolute;top:-5px;bottom:-5px;width:1px;background:var(--craie);opacity:.55}
.mesure{display:flex;justify-content:space-between;font-family:var(--data);font-size:10.5px;
  letter-spacing:.1em;text-transform:uppercase;color:var(--brume)}
.mesure b{color:var(--givre);font-weight:500}
.exo-pied{display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:16px 26px 22px;flex-wrap:wrap}
#verdict{font-family:var(--data);font-size:11.5px;letter-spacing:.06em;color:var(--brume);
  min-height:20px;flex:1;text-transform:uppercase}
#verdict.ok{color:var(--lueur)}
#verdict.ko{color:var(--alerte-vive)}

button.acte{font-family:var(--corps);font-size:13px;letter-spacing:.1em;text-transform:uppercase;
  padding:11px 22px;background:none;border:1px solid var(--trait);color:var(--givre);
  cursor:pointer;transition:border-color .2s,color .2s,background .2s}
button.acte:hover:not(:disabled){border-color:var(--lueur-sourde);color:var(--argent);background:var(--pierre)}
button.acte.primaire{border-color:var(--lueur-sourde);color:var(--lueur)}
button.acte.primaire:hover:not(:disabled){background:rgba(111,168,184,.08)}
button.acte:disabled{opacity:.35;cursor:not-allowed}
button.acte:focus-visible{outline:2px solid var(--lueur);outline-offset:2px}

.ardoise{border:1px solid var(--trait);background:linear-gradient(180deg,#141D26,#101822);
  padding:28px 30px;margin:8px 0}
.ardoise .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--brume);margin-bottom:16px}
.ardoise ul{margin:0;padding:0;list-style:none}
.ardoise li{padding:0 0 12px 20px;position:relative;font-size:16px;color:var(--givre)}
.ardoise li::before{content:"";position:absolute;left:0;top:11px;width:7px;height:1px;background:var(--craie);opacity:.6}
.ardoise li:last-child{padding-bottom:0}
.consigne{border:1px solid var(--trait);border-left:2px solid var(--lueur-sourde);
  background:var(--nuit);padding:24px 28px;margin:8px 0 0}
.pied{margin-top:72px;border-top:1px solid var(--trait);padding-top:34px;
  display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.pied .note{font-size:14.5px;color:var(--brume);font-style:italic;max-width:44ch}
.verrou{font-family:var(--data);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--brume)}

@media (max-width:640px){ body{font-size:16px} .exo-tete,.exo-pied,.commande,.etapes{padding-left:18px;padding-right:18px} }
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>

<div id="barre"></div>

<div id="seuil">
  <div id="seuil-fond"></div>
  <div class="eyebrow">Magie défensive · Première année · Leçon 1 sur 4</div>
  <h1>Rangez vos baguettes</h1>
  <p id="seuil-txt">Il attend à l'entrée et fait ranger les baguettes dans les poches, une par une, avant de laisser entrer qui que ce soit.</p>
  <div id="linteau">&#5833;&#5800;&#5809;&#5822;</div>
  <p id="linteau-note">Quatre signes sont gravés dans le linteau au-dessus de vous. Vous ne savez pas encore les lire.</p>
  <button class="acte primaire" id="btn-entrer">Ranger sa baguette</button>
  <button class="lien-passer" id="btn-passer">Passer l'introduction</button>
</div>

<div class="wrap">

  <header class="tete">
    <a class="retour" href="/cours/1">&#8592; Retour aux cours</a>
    <div class="fil">Magie défensive · Première année · Leçon 1 sur 4</div>
    <h1 class="titre">La garde et la distance</h1>
    <div class="module">
      <div class="g"></div>
      <div><b>Module : Se couvrir</b><i>Aucun sort n'est lancé de toute la leçon, ce qui surprend beaucoup.</i></div>
    </div>
  </header>

  <h2>La salle</h2>
  <p>Ce n'est pas une salle de classe. C'est une halle voûtée au rez-de-chaussée de l'aile est, dont on a sorti tous les meubles il y a si longtemps que personne ne se rappelle ce qu'il y avait avant. Le sol est de dalles, les murs de pierre nue, et il y fait froid toute l'année.</p>
  <p>Des bancs courent le long des deux murs, sans dossier, assez bas pour qu'on s'y relève vite. Le sol est couvert de cercles tracés à la craie, une trentaine, en rangs décalés du fond vers l'entrée. Ils sont refaits chaque matin. Un élève en occupe un et n'en sort pas sans qu'on le lui demande.</p>

  <div class="salle">
    <img src="/cours/magie-defensive/halle.jpg" alt="La halle de magie défensive, vue depuis l'entrée">
    <div class="hots">
      <button class="hot" style="left:50%;top:7%"    data-k="linteau" aria-label="Le linteau"><i>1</i></button>
      <button class="hot" style="left:21%;top:26%"   data-k="fenetres" aria-label="Les fenêtres"><i>2</i></button>
      <button class="hot" style="left:55.5%;top:36%" data-k="marques" aria-label="Les marques du mur"><i>3</i></button>
      <button class="hot" style="left:61%;top:50%"   data-k="sacs" aria-label="Les sacs suspendus"><i>4</i></button>
      <button class="hot" style="left:38%;top:55%"   data-k="ratelier" aria-label="Le râtelier"><i>5</i></button>
      <button class="hot" style="left:45%;top:80%"   data-k="cercles" aria-label="Les cercles de craie"><i>6</i></button>
    </div>
    <figcaption>Six points à examiner</figcaption>
  </div>
  <div id="detail" class="vide"><p>Touchez un point de la salle pour vous en approcher.</p></div>

  <h2>Celui qui enseigne</h2>
  <p>Il ne porte pas de robe, seulement une veste courte, parce qu'il bouge. C'est le seul professeur du château dans ce cas et les élèves le remarquent tous le premier jour.</p>
  <p>Il ne démontre jamais en premier. Il demande à quelqu'un d'essayer, regarde, et explique ensuite ce qui vient de se passer. Il ne hausse jamais la voix, y compris quand il faudrait, et compte les pas à voix haute.</p>

  <h2>Le cours</h2>
  <p>Il désigne un élève au hasard et lui demande de se placer dans le cercle le plus proche du sien.</p>
  <p class="dial">« Reculez d'un cercle. »</p>
  <p>L'élève recule. Il attend.</p>
  <p class="dial">« Encore un. Encore. Encore. Arrêtez-vous quand vous vous sentirez tranquille. »</p>

  <div class="exo">
    <div class="exo-tete">
      <div class="lbl">Exercice de placement</div>
      <h3 id="exo-titre">Reculer</h3>
      <p id="exo-consigne">Reculez d'un cercle à la fois, et arrêtez-vous quand vous vous sentirez tranquille.</p>
    </div>
    <div class="etapes">
      <div class="etape en-cours" id="et1">1 · la distance</div>
      <div class="etape" id="et2">2 · l'angle</div>
      <div class="etape" id="et3">3 · les sorties</div>
    </div>

    <svg id="plan" viewBox="0 0 720 300" role="img" aria-label="Plan de la halle vu de dessus">
      <rect x="20" y="30" width="680" height="240" fill="#0D141B" stroke="#26343F"/>
      <rect x="60" y="42" width="600" height="9" fill="none" stroke="#2C3B47"/>
      <rect x="60" y="249" width="600" height="9" fill="none" stroke="#2C3B47"/>
      <text x="360" y="38" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="8"
            fill="#33434F" letter-spacing="2">BANCS</text>
      <g id="cercles"></g>
      <g id="sorties">
        <rect class="porte" data-p="1" x="20" y="128" width="10" height="52" fill="#0D141B" stroke="#26343F"/>
        <rect class="porte" data-p="2" x="676" y="132" width="24" height="44" fill="#0D141B" stroke="#26343F"/>
      </g>
      <g id="prof">
        <circle cx="96" cy="150" r="11" fill="none" stroke="#7A8FA1" stroke-width="1.4"/>
        <text x="96" y="184" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="9"
              fill="#4A5B68" letter-spacing="1.5">LUI</text>
      </g>
      <g id="vous">
        <g id="cone" opacity=".2"></g>
        <ellipse id="corps" cx="156" cy="150" rx="11" ry="11" fill="rgba(111,168,184,.22)" stroke="#6FA8B8" stroke-width="1.4"/>
        <text id="lbl-vous" x="156" y="184" text-anchor="middle" font-family="'JetBrains Mono',monospace"
              font-size="9" fill="#6FA8B8" letter-spacing="1.5">VOUS</text>
      </g>
    </svg>

    <div class="commande" id="cmd-pas">
      <div class="mesure"><span>Distance</span><span><b id="nbpas">0</b> <span id="motcercle">cercle</span></span></div>
      <div class="jauge"><i id="j-pas" style="width:0%"></i></div>
    </div>

    <div class="commande" id="cmd-angle" style="display:none">
      <label for="angle">Orientation du corps</label>
      <input type="range" id="angle" min="0" max="120" value="0">
      <div class="jauge"><i id="j-surf" style="width:100%"></i><b style="left:30%"></b></div>
      <div class="mesure"><span>Surface offerte : <b id="surf">100</b> %</span><span id="vue">Vous le voyez</span></div>
    </div>

    <div class="exo-pied">
      <div id="verdict"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="acte" id="btn-reprendre">Reprendre</button>
        <button class="acte" id="btn-stop" style="display:none">Je m'arrête ici</button>
        <button class="acte primaire" id="btn-action">Reculer d'un cercle</button>
      </div>
    </div>
  </div>

  <p class="aparte">Il se tourne vers la classe et fait remarquer que personne n'a lancé quoi que ce soit, que personne n'a menacé personne, et que l'élève s'est quand même senti mieux en reculant.</p>
  <p class="dial">« Voilà votre première protection. Elle est gratuite, elle ne rate jamais, et vous l'avez déjà. »</p>
  <p>L'heure entière se passe ainsi : se placer, reculer, se tourner de trois quarts pour offrir moins de surface, mettre un obstacle entre soi et l'autre, repérer les deux sorties de la halle. Il fait tout recommencer en marchant, puis en courant, et les cercles se brouillent sous les semelles bien avant la fin.</p>
  <p>À un moment, il demande combien d'élèves savent où sont les sorties. Trois mains se lèvent. Il ne commente pas et fait reprendre l'exercice.</p>

  <h2>La règle première</h2>
  <p>Il termine par une phrase qu'il répétera tous les ans jusqu'en cinquième année, et que les grandes années citent de mémoire.</p>
  <p class="dial">« Quand vous avez peur, vous le dites. À voix haute, tout de suite, à qui se trouve là. Aucun professeur de cette maison n'a jamais sanctionné un élève pour avoir appelé pour rien. Vous ne serez pas les premiers. »</p>
  <div class="alerte">Aucun sort de cette matière ne se lance sur un camarade en première année. Y compris avec son accord, y compris pour rire. La règle sera rappelée à chaque leçon et n'a jamais eu d'exception.</div>

  <h2>Ce qu'il laisse au tableau</h2>
  <div class="ardoise">
    <div class="lbl">Se couvrir · première leçon</div>
    <ul>
      <li>Un pas en arrière vaut mieux qu'un bouclier tenu trop tôt.</li>
      <li>De trois quarts, on offre moins de surface. De face, on offre tout.</li>
      <li>Le dos tourné n'offre rien et ne voit rien. Ce n'est pas une garde, c'est une fuite mal faite.</li>
      <li>On repère les sorties d'une pièce avant de s'y installer, toujours.</li>
      <li>Un obstacle vaut une protection tant qu'il tient debout.</li>
      <li>On se signale quand on a peur. C'est la règle première et elle passe avant les autres.</li>
    </ul>
  </div>

  <h2>Ce qu'il demande pour la semaine</h2>
  <div class="consigne">
    <p class="dial" style="margin-bottom:0">« Dans chaque pièce où vous entrerez cette semaine, vous chercherez les sorties avant de vous asseoir. Vous ne le direz à personne. Je vous demanderai à la prochaine leçon combien de fois vous y avez pensé, et je saurai si vous mentez. »</p>
  </div>
  <p style="margin-top:22px">En sortant, vous repassez sous le linteau. Les quatre signes sont toujours là. Dans quinze jours, en runologie, vous saurez les lire.</p>

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
  document.getElementById('seuil-txt').textContent = "Vous entrez les mains vides. C'est la première fois de la semaine.";
  document.getElementById('linteau').classList.add('on');
  document.getElementById('linteau-note').classList.add('on');
  document.getElementById('btn-passer').textContent = "Entrer dans la halle";
});
window.addEventListener('scroll', ()=>{
  const h = document.body.scrollHeight - window.innerHeight;
  document.getElementById('barre').style.width = (window.scrollY / h * 100) + '%';
});

/* ---------- salle ---------- */
const DETAILS = {
  linteau:['Le linteau',
    "Quatre signes gravés dans la pierre au-dessus de l'entrée, plus anciens que l'usage qu'on fait de cette halle. Le professeur ne les commente jamais. Vous saurez les lire d'ici la fin du mois, et vous serez surpris de leur banalité."],
  fenetres:['Les fenêtres',
    "Quatre meurtrières, deux de chaque côté, trop hautes pour qu'on voie dehors et trop étroites pour éclairer quoi que ce soit. Les lanternes murales restent allumées de septembre à juin."],
  marques:['Les marques du mur du fond',
    "Des dizaines d'anneaux pâles sur la pierre, à toutes les hauteurs. Ce sont des impacts, laissés par des sorts déviés par des élèves qui n'ont pas choisi leur angle. Aucun n'a jamais été réparé, et c'est délibéré."],
  sacs:['Les sacs suspendus',
    "Des cibles de toile bourrées de sable, pendues à une potence de bois. On s'en sert à partir de la deuxième année pour apprendre à dévier. Les premières années ne les touchent pas et n'ont pas le droit de passer derrière la potence."],
  ratelier:['Le râtelier',
    "Des perches de bois de longueurs différentes, une par distance réglementaire. Elles servent à vérifier un écart quand deux élèves ne sont pas d'accord, et à rien d'autre. On ne les prend pas en main sans qu'on vous le demande."],
  cercles:['Les cercles de craie',
    "Une trentaine, en rangs décalés, refaits chaque matin avant le premier cours. Un élève en occupe un et n'en sort pas sans qu'on le lui demande. À la fin d'une heure de travail, ils sont illisibles : c'est à cela qu'on voit que l'heure a servi."]
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

/* ---------- plan ---------- */
const X0 = 156, PAS = 52, MAXPAS = 9;
let etape = 1, pas = 0, trouvees = 0;

const gc = document.getElementById('cercles');
let html = '';
for(let i=0;i<=MAXPAS;i++){
  const x = X0 + i*PAS;
  if(x > 668) break;
  html += '<circle cx="'+x+'" cy="150" r="17" fill="none" stroke="#D8DFE4" stroke-opacity=".18"/>';
  if(i < MAXPAS){
    const x2 = x + PAS/2;
    if(x2 < 660){
      html += '<circle cx="'+x2+'" cy="104" r="17" fill="none" stroke="#D8DFE4" stroke-opacity=".10"/>';
      html += '<circle cx="'+x2+'" cy="196" r="17" fill="none" stroke="#D8DFE4" stroke-opacity=".10"/>';
    }
  }
}
gc.innerHTML = html;

const corps = document.getElementById('corps');
const lblVous = document.getElementById('lbl-vous');
const cone = document.getElementById('cone');
const verdict = document.getElementById('verdict');
const btnAction = document.getElementById('btn-action');
const btnStop = document.getElementById('btn-stop');
const slider = document.getElementById('angle');

function dit(t, cls){ verdict.textContent = t || ''; verdict.className = cls || ''; }
function posX(){ return Math.min(X0 + pas*PAS, 668); }

function majPlan(){
  const x = posX();
  corps.setAttribute('cx', x);
  lblVous.setAttribute('x', x);
  const a = +slider.value;
  const rx = 11 * (0.30 + 0.70*Math.cos(Math.min(a,90)*Math.PI/180));
  corps.setAttribute('rx', Math.max(3.4, rx));
  const dir = 180 + a, r = 74, w = 34;
  const p = ang => [x + r*Math.cos((dir+ang)*Math.PI/180), 150 + r*Math.sin((dir+ang)*Math.PI/180)];
  const a1 = p(-w/2), a2 = p(w/2);
  cone.innerHTML = '<path d="M '+x+' 150 L '+a1[0].toFixed(1)+' '+a1[1].toFixed(1)+
                   ' L '+a2[0].toFixed(1)+' '+a2[1].toFixed(1)+' Z" fill="#6FA8B8"/>';
}

const COMM = ["","Un cercle. Il ne bouge pas.","Deux. Il attend.","Trois. Vous respirez mieux.",
  "Quatre. Vous ne sauriez pas dire pourquoi.","Cinq. Il n'a toujours rien fait.",
  "Six. Vous voyez la halle entière maintenant.","Sept. Les bancs sont derrière vous.",
  "Huit. Vous touchez presque le mur.","Neuf. Vous ne pouvez plus reculer."];

btnAction.addEventListener('click', ()=>{
  if(etape === 1){
    if(pas < MAXPAS){
      pas++; majPlan(); dit(COMM[pas]);
      document.getElementById('nbpas').textContent = pas;
      document.getElementById('motcercle').textContent = pas > 1 ? 'cercles' : 'cercle';
      document.getElementById('j-pas').style.width = (pas/MAXPAS*100)+'%';
      btnStop.style.display = '';
      if(pas >= MAXPAS) finEtape1();
    }
  } else if(etape === 2){
    etape3();
  }
});
btnStop.addEventListener('click', finEtape1);

function finEtape1(){
  if(etape !== 1) return;
  etape = 2;
  btnStop.style.display = 'none';
  btnAction.textContent = "Passer aux sorties";
  document.getElementById('et1').className = 'etape faite';
  document.getElementById('et2').className = 'etape en-cours';
  document.getElementById('cmd-angle').style.display = '';
  document.getElementById('exo-titre').textContent = "Se tourner";
  document.getElementById('exo-consigne').textContent =
    "De trois quarts, vous offrez moins de surface. Le dos tourné n'offre rien et ne voit rien.";
  let m;
  if(pas <= 2) m = "Deux cercles ou moins : vous êtes de ceux qui restent près. Il le note et ne dit rien.";
  else if(pas <= 7) m = "Entre trois et sept cercles. C'est là que s'arrête la plupart des élèves.";
  else m = "Vous seriez sorti de la halle si elle avait été plus longue. Il le note aussi.";
  dit(m, 'ok');
}

slider.addEventListener('input', ()=>{
  const a = +slider.value;
  const surf = Math.round(30 + 70*Math.cos(Math.min(a,90)*Math.PI/180));
  document.getElementById('surf').textContent = surf;
  document.getElementById('j-surf').style.width = surf + '%';
  const vue = document.getElementById('vue');
  if(a > 95){ vue.textContent = "Vous ne le voyez plus"; vue.style.color = 'var(--alerte-vive)'; }
  else { vue.textContent = "Vous le voyez"; vue.style.color = 'var(--brume)'; }
  majPlan();
  if(etape === 2){
    if(a > 95) dit("Le dos tourné n'est pas une garde.", 'ko');
    else if(a >= 55 && a <= 85) dit("Trois quarts. C'est ce qu'il demande.", 'ok');
    else if(a < 25) dit("De face, vous offrez tout.", 'ko');
    else dit("");
  }
});

function etape3(){
  etape = 3;
  document.getElementById('et2').className = 'etape faite';
  document.getElementById('et3').className = 'etape en-cours';
  document.getElementById('exo-titre').textContent = "Les sorties";
  document.getElementById('exo-consigne').textContent =
    "Cette halle en a deux. Trouvez-les sur le plan. Trois élèves de la classe savaient où elles étaient.";
  btnAction.style.display = 'none';
  document.getElementById('cmd-angle').style.display = 'none';
  document.getElementById('cmd-pas').style.display = 'none';
  dit("0 sortie sur 2");
  document.querySelectorAll('#sorties .porte').forEach(p=>{
    p.style.cursor = 'pointer';
    p.addEventListener('click', ev=>{
      ev.stopPropagation();
      if(p.dataset.trouve) return;
      p.dataset.trouve = '1';
      p.setAttribute('stroke','#6FA8B8');
      p.setAttribute('fill','rgba(111,168,184,.28)');
      trouvees++;
      if(trouvees === 2){
        dit("Les deux sorties. Vous pouvez vous asseoir.", 'ok');
        document.getElementById('et3').className = 'etape faite';
        document.getElementById('exo-consigne').textContent =
          "Vous saurez désormais que vous ne les cherchiez jamais avant aujourd'hui.";
      } else dit(trouvees + " sortie sur 2");
    });
  });
  document.getElementById('plan').addEventListener('click', ()=>{
    if(etape === 3 && trouvees < 2) dit("Rien ici. Regardez les murs, pas le milieu.", 'ko');
  });
}

document.getElementById('btn-reprendre').addEventListener('click', ()=>{
  etape = 1; pas = 0; trouvees = 0; slider.value = 0;
  document.getElementById('nbpas').textContent = '0';
  document.getElementById('motcercle').textContent = 'cercle';
  document.getElementById('j-pas').style.width = '0%';
  document.getElementById('surf').textContent = '100';
  document.getElementById('j-surf').style.width = '100%';
  document.getElementById('vue').textContent = 'Vous le voyez';
  document.getElementById('vue').style.color = 'var(--brume)';
  document.getElementById('cmd-angle').style.display = 'none';
  document.getElementById('cmd-pas').style.display = '';
  document.getElementById('et1').className = 'etape en-cours';
  document.getElementById('et2').className = 'etape';
  document.getElementById('et3').className = 'etape';
  document.getElementById('exo-titre').textContent = "Reculer";
  document.getElementById('exo-consigne').textContent =
    "Reculez d'un cercle à la fois, et arrêtez-vous quand vous vous sentirez tranquille.";
  btnAction.style.display = '';
  btnAction.textContent = "Reculer d'un cercle";
  btnStop.style.display = 'none';
  document.querySelectorAll('#sorties .porte').forEach(p=>{
    delete p.dataset.trouve;
    p.setAttribute('stroke','#26343F'); p.setAttribute('fill','#0D141B'); p.style.cursor='default';
  });
  dit('');
  majPlan();
});

majPlan();
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
