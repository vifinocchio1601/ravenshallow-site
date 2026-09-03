import "server-only";

/**
 * La leçon 1 de Runologie — « Vingt-quatre signes, vingt-quatre sons ».
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
 * `data:image` sont devenus l'adresse `/cours/runologie/salle.jpg`.
 * C'était **la même image encodée trois fois**, 621 Ko dont 414 pour
 * rien, et rien de tout cela ne pouvait être mis en cache. La page passe de
 * 856 Ko à 27 Ko ; l'image est téléchargée une fois et gardée.
 *
 * Le reste — le texte, la mise en scène, la table du futhark et l'exercice de translittération — est celui du joueur,
 * au signe près. Les apostrophes droites comprises.
 */

export const LECON_RUNOLOGIE_L1_1 = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Runologie — Leçon 1 : Vingt-quatre signes, vingt-quatre sons</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Spectral:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@300;500&display=swap" rel="stylesheet">
<style>
:root{
  --encre:#0B1017; --nuit:#111A24; --pierre:#18232F; --trait:#26343F;
  --brume:#7A8FA1; --givre:#B9C8D4; --argent:#E4ECF2;
  --lueur:#6FA8B8; --lueur-sourde:#3E5F6B; --flamme:#E4C98A;
  --alerte:#8E6B72;
  --display:'Cormorant Garamond',Georgia,serif;
  --corps:'Spectral',Georgia,serif;
  --data:'JetBrains Mono',ui-monospace,monospace;
  --rune:'Segoe UI Symbol','Noto Sans Runic','Segoe UI Historic',serif;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body::before{content:"";position:fixed;inset:0;z-index:-2;
  background:url("/cours/runologie/salle.jpg") center 30% / cover no-repeat;
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
  background:url("/cours/runologie/salle.jpg") center 34% / cover no-repeat;
  opacity:.32;transition:opacity 2s ease}
#seuil.parti{opacity:0;pointer-events:none}
#seuil .eyebrow{font-family:var(--data);font-size:10px;letter-spacing:.28em;
  text-transform:uppercase;color:var(--lueur-sourde);margin-bottom:26px}
#seuil h1{font-family:var(--display);font-weight:300;font-size:clamp(32px,6.5vw,54px);
  margin:0 0 18px;color:var(--argent);letter-spacing:.02em}
#seuil p{max-width:48ch;color:var(--brume);margin:0 0 30px;font-size:17px}
#feuille{max-width:520px;border:1px solid var(--trait);background:rgba(17,26,36,.86);
  padding:26px 28px;margin-bottom:28px;display:none}
#feuille.on{display:block}
#feuille .runes{font-family:var(--rune);font-size:26px;color:var(--givre);
  letter-spacing:.22em;line-height:1.9;margin-bottom:16px}
#feuille .trad{font-size:15.5px;color:var(--brume);font-style:italic;margin:0}
.lien-passer{background:none;border:none;color:#31414D;font-family:var(--corps);
  font-size:13px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;
  padding:8px;text-decoration:underline;text-underline-offset:4px}
.lien-passer:hover{color:var(--brume)}

#barre{position:fixed;top:0;left:0;height:2px;background:var(--lueur);width:0;z-index:50;
  transition:width .15s linear}

/* ---------- lanterne d'accompagnement ---------- */
#lanterne{position:fixed;right:26px;bottom:26px;z-index:40;text-align:center;
  opacity:0;transition:opacity 1s ease}
#lanterne.on{opacity:1}
#lanterne .f{width:12px;height:18px;margin:0 auto 8px;border-radius:50% 50% 45% 45%;
  background:radial-gradient(ellipse at 50% 70%, #fff 0%, var(--flamme) 40%, rgba(228,201,138,.35) 70%, transparent 80%);
  box-shadow:0 0 20px 5px rgba(228,201,138,.18);animation:vac 3s ease-in-out infinite}
@keyframes vac{0%,100%{transform:scaleY(1)}45%{transform:scaleY(1.12)}75%{transform:scaleY(.93)}}
#lanterne span{font-family:var(--data);font-size:9px;letter-spacing:.16em;
  text-transform:uppercase;color:#3A4A57}

/* ---------- en-tête ---------- */
header.tete{border-bottom:1px solid var(--trait);margin-bottom:56px;padding:30px 0 22px}
.fil{font-family:var(--data);font-size:10px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--brume);margin-bottom:14px}
h1.titre{font-family:var(--display);font-weight:300;font-size:clamp(32px,6vw,52px);
  margin:0 0 22px;color:var(--argent);letter-spacing:.01em;line-height:1.06}
.module{display:flex;align-items:center;gap:20px;border:1px solid var(--trait);
  background:var(--nuit);padding:18px 24px}
.module .g{font-family:var(--rune);font-size:34px;line-height:1;color:var(--brume)}
.module b{display:block;font-family:var(--display);font-size:23px;font-weight:400;color:var(--argent)}
.module i{font-size:14.5px;color:var(--brume)}

h2{font-family:var(--data);font-size:11px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--lueur);font-weight:500;margin:64px 0 18px}
p{margin:0 0 20px}
.dial{margin:0 0 22px;padding-left:22px;border-left:1px solid var(--lueur-sourde);
  color:var(--argent);font-size:18px;font-style:italic}
.aparte{color:var(--brume);font-size:15.5px;font-style:italic}

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
.hot.actif{background:rgba(111,168,184,.45);border-color:var(--flamme)}
.hot.actif::after{animation:none;opacity:0}
#detail{border:1px solid var(--trait);border-top:none;background:rgba(24,35,47,.94);
  padding:22px 26px;min-height:96px;margin-bottom:12px}
#detail .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--lueur);margin-bottom:8px}
#detail p{margin:0;font-size:16px;color:var(--givre)}
#detail.vide p{color:var(--brume);font-style:italic}

/* ---------- table du futhark ---------- */
.exo{border:1px solid var(--trait);background:var(--nuit);margin:12px 0 8px}
.exo-tete{padding:22px 26px 4px}
.exo-tete .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--lueur);margin-bottom:8px}
.exo-tete h3{font-family:var(--display);font-size:26px;font-weight:400;margin:0 0 8px;color:var(--argent)}
.exo-tete p{font-size:15.5px;color:var(--brume);margin:0 0 6px}
.aett{padding:6px 26px 0}
.aett .nom{font-family:var(--data);font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;
  color:#4A5B68;margin:14px 0 8px}
.grille{display:grid;grid-template-columns:repeat(8,1fr);gap:5px}
.rn{aspect-ratio:1;border:1px solid var(--trait);background:rgba(13,20,27,.6);cursor:pointer;
  display:grid;place-items:center;padding:0;transition:border-color .2s,background .2s}
.rn span{font-family:var(--rune);font-size:23px;color:var(--givre);line-height:1}
.rn:hover{border-color:var(--lueur-sourde);background:var(--pierre)}
.rn.actif{border-color:var(--flamme);background:rgba(228,201,138,.10)}
.rn.actif span{color:var(--flamme)}
.rn:focus-visible{outline:2px solid var(--lueur);outline-offset:2px}
#fiche{margin:18px 26px 0;border-top:1px solid var(--trait);padding:18px 0 0;min-height:74px}
#fiche .l1{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:6px}
#fiche .nom2{font-family:var(--display);font-size:25px;color:var(--argent)}
#fiche .val{font-family:var(--data);font-size:22px;color:var(--flamme);letter-spacing:.1em}
#fiche .sens{font-size:16px;color:var(--brume)}
#fiche.vide .sens{font-style:italic}
.exo-pied{display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:20px 26px 22px;flex-wrap:wrap}
#futhark{font-family:var(--data);font-size:13px;letter-spacing:.22em;color:var(--brume);
  text-transform:uppercase;min-height:20px;flex:1}
#futhark b{color:var(--flamme);font-weight:500}

/* ---------- translittération ---------- */
.inscr{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:8px 26px 0}
.sig{width:52px;text-align:center;background:none;border:none;padding:8px 0;cursor:pointer;
  border-bottom:1px solid var(--trait);transition:border-color .2s}
.sig .g2{display:block;font-family:var(--rune);font-size:30px;color:var(--givre);line-height:1.1}
.sig .l2{display:block;font-family:var(--data);font-size:15px;color:transparent;margin-top:8px;
  transition:color .3s;text-transform:uppercase;letter-spacing:.1em}
.sig.lu{border-bottom-color:var(--flamme)}
.sig.lu .l2{color:var(--flamme)}
.sig:disabled{cursor:default}
.sig.suivant{border-bottom-color:var(--lueur)}
#mot{text-align:center;font-family:var(--display);font-size:34px;color:var(--argent);
  letter-spacing:.16em;margin:22px 0 0;min-height:44px;opacity:0;transition:opacity 1.2s ease}
#mot.on{opacity:1}
#motnote{text-align:center;font-size:15.5px;color:var(--brume);font-style:italic;
  margin:8px 0 0;opacity:0;transition:opacity 1.2s ease .4s}
#motnote.on{opacity:1}

/* ---------- tableau ---------- */
.ardoise{border:1px solid var(--trait);background:linear-gradient(180deg,#141D26,#101822);
  padding:28px 30px;margin:8px 0}
.ardoise .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--brume);margin-bottom:16px}
.ardoise ul{margin:0;padding:0;list-style:none}
.ardoise li{padding:0 0 12px 20px;position:relative;font-size:16px;color:var(--givre)}
.ardoise li::before{content:"";position:absolute;left:0;top:11px;width:7px;height:1px;background:var(--lueur-sourde)}
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
  .grille{grid-template-columns:repeat(4,1fr)}
  .exo-tete,.aett,.exo-pied,.inscr{padding-left:18px;padding-right:18px}
  #fiche{margin-left:18px;margin-right:18px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>

<div id="barre"></div>

<div id="seuil">
  <div id="seuil-fond"></div>
  <div class="eyebrow">Runologie · Première année · Leçon 1 sur 4</div>
  <h1>Elle ne se présente pas</h1>
  <p id="seuil-txt">Elle attend que la classe soit assise, sort une feuille de sa manche et la fait passer au premier rang sans un mot.</p>
  <div id="feuille">
    <div class="runes">&#5809;&#5815;&#5811;&#5825;&nbsp;&nbsp;&#5794;&#5794;&#5809;&#5810;&nbsp;&nbsp;&#5809;&#5815;&#5815;&#5809;</div>
    <p class="trad">Il y est question de sel, de corde et de trois brebis. La feuille a quatre cents ans.</p>
  </div>
  <button class="acte primaire" id="btn-prendre">Prendre la feuille</button>
  <button class="lien-passer" id="btn-passer" style="margin-top:18px">Passer l'introduction</button>
</div>

<div id="lanterne"><div class="f"></div><span>votre lanterne</span></div>

<div class="wrap">

  <header class="tete">
    <div class="fil">Runologie · Première année · Leçon 1 sur 4</div>
    <h1 class="titre">Vingt-quatre signes, vingt-quatre sons</h1>
    <div class="module">
      <div class="g">&#5792;&#5794;&#5822;</div>
      <div><b>Module : Lire</b><i>Aucun sort de toute l'année. On apprend à lire ce que d'autres ont écrit.</i></div>
    </div>
  </header>

  <h2>La salle</h2>
  <p>Une pièce longue et basse, au-dessus de la bibliothèque, à laquelle on accède par un escalier trop étroit pour deux. Une seule fenêtre, étroite et en ogive, sur le mur de gauche : elle n'éclaire rien. On travaille à la lanterne toute l'année, une par table, allumée avant l'arrivée des élèves.</p>
  <p>Les deux murs sont couverts d'estampages, alignés en rangs jusqu'au plafond. Il y en a des centaines. Aucun n'est légendé.</p>

  <div class="salle">
    <img src="/cours/runologie/salle.jpg" alt="La salle de runologie, vue depuis le fond">
    <div class="hots">
      <button class="hot" style="left:27.5%;top:36%" data-k="fenetre" aria-label="La fenêtre"><i>1</i></button>
      <button class="hot" style="left:11%;top:33%"   data-k="estampages" aria-label="Les estampages"><i>2</i></button>
      <button class="hot" style="left:51%;top:32%"   data-k="mur" aria-label="Le mur du fond"><i>3</i></button>
      <button class="hot" style="left:47%;top:82%"   data-k="tables" aria-label="Les tables"><i>4</i></button>
      <button class="hot" style="left:86.5%;top:56%" data-k="vitrine" aria-label="La vitrine"><i>5</i></button>
    </div>
    <figcaption>Cinq points à examiner</figcaption>
  </div>
  <div id="detail" class="vide"><p>Touchez un point de la salle pour vous en approcher.</p></div>

  <h2>Celle qui enseigne</h2>
  <p>C'est la Directrice. Elena Runa Tidevann tient elle-même la première année de runologie, et ne s'en explique jamais. Les élèves l'apprennent en entrant dans la salle, en la trouvant déjà là, debout entre les tables, à vérifier les lanternes une par une.</p>
  <p>Elle a de l'encre jusqu'à la deuxième phalange, et elle en aura toute l'année. Elle marche entre les rangs en lisant à mi-voix des mots que personne ne comprend, et elle ne s'en rend pas compte. Quand un élève trace mal, elle lui prend le poignet sans demander et refait le geste avec lui, une fois, en silence.</p>
  <p class="aparte">Elle n'écrit jamais au tableau. Il n'y en a pas : le mur du fond porte déjà l'alphabet, et il le portait avant elle.</p>

  <h2>Le cours</h2>
  <p>Elle commence par une question à laquelle personne ne répond correctement : à quoi sert une rune. On lui dit qu'elle sert à lancer des sorts. Elle laisse dire, puis fait circuler la feuille.</p>
  <p class="dial">« Ceci est une liste de courses. Elle a quatre cents ans. Il y est question de sel, de corde et de trois brebis. »</p>
  <p>Elle laisse la feuille faire le tour de la salle avant de reprendre.</p>
  <p class="dial">« Avant d'être un outil de sorcier, le Futhark est une écriture. Des gens qui n'étaient pas mages l'ont gravé sur cette côte pendant des siècles pour marquer un nom, une dette, une propriété, et parfois une insulte. Vous apprendrez d'abord à les lire. »</p>
  <p>Vient alors la table, celle du mur du fond, qu'elle fait réciter groupe par groupe jusqu'à ce que la classe entière tienne les six premiers signes sans hésiter.</p>

  <div class="exo">
    <div class="exo-tete">
      <div class="lbl">Le mur du fond</div>
      <h3>La table à connaître par cœur</h3>
      <p>Vingt-quatre signes rangés en trois groupes de huit, les ættir. Touchez un signe pour son nom, sa valeur sonore et ce qu'il désigne.</p>
    </div>
    <div class="aett">
      <div class="nom">Première ætt</div><div class="grille" id="g0"></div>
      <div class="nom">Deuxième ætt</div><div class="grille" id="g1"></div>
      <div class="nom">Troisième ætt</div><div class="grille" id="g2"></div>
    </div>
    <div id="fiche" class="vide"><div class="l1"><span class="nom2">&nbsp;</span></div><div class="sens">Aucun signe sélectionné.</div></div>
    <div class="exo-pied">
      <div id="futhark"></div>
      <button class="acte" id="btn-six">Réciter les six premiers</button>
    </div>
  </div>

  <p class="dial">« Fehu, Uruz, Thurisaz, Ansuz, Raidho, Kenaz. F, u, þ, a, r, k. Vous venez de prononcer le nom de l'alphabet. Il ne s'appelle pas autrement. »</p>
  <p>Un élève fait remarquer qu'il apprendra Kenaz cette semaine en Sortilèges. Elle répond que oui, et qu'il apprendra à l'allumer sans savoir ce qu'elle vaut, ce qui est l'ordre habituel des choses dans ce château.</p>
  <p class="dial">« Un sorcier qui sait lancer Kenaz sans savoir qu'elle vaut k ne sait pas lire. La moitié de cette maison est dans ce cas, professeurs compris. »</p>

  <h2>À vous</h2>
  <p>Elle pose alors une planchette d'ardoise sur la table du premier rang, y trace sept signes, et ne dit rien de plus.</p>

  <div class="exo">
    <div class="exo-tete">
      <div class="lbl">Exercice de translittération</div>
      <h3>Lire, de gauche à droite</h3>
      <p id="exo-consigne">Touchez les signes dans l'ordre. Chacun rend sa valeur sonore, et rien d'autre.</p>
    </div>
    <div class="inscr" id="inscr"></div>
    <div id="mot"></div>
    <p id="motnote"></p>
    <div class="exo-pied">
      <div id="verdict" style="font-family:var(--data);font-size:11.5px;letter-spacing:.06em;color:var(--brume);text-transform:uppercase;flex:1"></div>
      <button class="acte" id="btn-reprendre">Reprendre</button>
    </div>
  </div>

  <p>La fin de l'heure se passe à recopier la table, à la main, en entier. Elle passe, corrige des poignets, et ne dit plus rien.</p>

  <h2>Ce qu'elle fait passer</h2>
  <div class="ardoise">
    <div class="lbl">Le Futhark ancien</div>
    <ul>
      <li>Vingt-quatre signes, trois groupes de huit appelés ættir. L'ordre ne change jamais.</li>
      <li>Chaque rune porte une valeur sonore avant de porter un sens.</li>
      <li>Les six premières donnent f, u, þ, a, r, k, d'où le nom de l'alphabet.</li>
      <li>On trace du haut vers le bas et de la gauche vers la droite, sauf quatre exceptions vues plus tard.</li>
      <li>La plupart des inscriptions de la côte ne sont ni magiques ni solennelles.</li>
      <li>On translittère toujours avant de traduire. L'inverse s'appelle deviner.</li>
    </ul>
  </div>

  <h2>Ce qu'elle demande pour la semaine</h2>
  <div class="consigne">
    <p class="dial" style="margin-bottom:0">« La table entière, par cœur, dans l'ordre, avec les valeurs. Vous la réciterez debout. Ceux qui la savent déjà la réciteront à l'envers. »</p>
  </div>
  <p style="margin-top:22px">Elle éteint les lanternes une par une en sortant, et laisse la dernière allumée pour celui qui range.</p>

  <div class="pied">
    <div class="note">Le contrôle compte cinq questions. Vos réponses restent modifiables tant que vous ne l'avez pas envoyé. L'envoi est définitif.</div>
    <div style="text-align:right">
      <button class="acte primaire" id="btn-controle">Passer le contrôle</button>
      <div class="verrou" style="margin-top:10px">Leçon 2 scellée · sept jours après l'envoi</div>
    </div>
  </div>

</div>

<script>
/* ---------------- données ---------------- */
const RUNES = [
 ["ᚠ","Fehu","f","le bétail, le bien qui se déplace"],
 ["ᚢ","Uruz","u","l'aurochs, la force brute"],
 ["ᚦ","Thurisaz","þ","l'épine, ce qui blesse en défendant"],
 ["ᚨ","Ansuz","a","la parole, le souffle qui porte"],
 ["ᚱ","Raidho","r","la chevauchée, ce qui vient à soi"],
 ["ᚲ","Kenaz","k","la torche, la lumière tenue"],
 ["ᚷ","Gebo","g","le don, ce qui se cède"],
 ["ᚹ","Wunjo","w","la joie, l'apaisement"],
 ["ᚺ","Hagalaz","h","la grêle, ce qui fend"],
 ["ᚾ","Naudhiz","n","la contrainte, le lien qui tient"],
 ["ᛁ","Isa","i","la glace, l'arrêt"],
 ["ᛃ","Jera","j","la moisson, le temps qui mûrit"],
 ["ᛇ","Eihwaz","ï","l'if, ce qui absorbe"],
 ["ᛈ","Perthro","p","le cornet du sort, ce qui se tire"],
 ["ᛉ","Algiz","z","l'élan, la protection dressée"],
 ["ᛊ","Sowilo","s","le soleil, la chaleur donnée"],
 ["ᛏ","Tiwaz","t","Tyr, la règle et l'arbitrage"],
 ["ᛒ","Berkano","b","le bouleau, ce qui repousse"],
 ["ᛖ","Ehwaz","e","le cheval, la charge portée"],
 ["ᛗ","Mannaz","m","l'homme, le semblable"],
 ["ᛚ","Laguz","l","l'eau, ce qui lave"],
 ["ᛜ","Ingwaz","ŋ","la semence close, ce qui contient"],
 ["ᛞ","Dagaz","d","l'aube, ce qui révèle"],
 ["ᛟ","Othala","o","le foyer, ce qui demeure"]
];

/* ---------------- seuil ---------------- */
const seuil = document.getElementById('seuil');
const lanterne = document.getElementById('lanterne');
function ouvrir(){
  seuil.classList.add('parti');
  setTimeout(()=>{ seuil.style.display='none'; lanterne.classList.add('on'); }, 1400);
}
document.getElementById('btn-passer').addEventListener('click', ouvrir);
document.getElementById('btn-prendre').addEventListener('click', function(){
  this.style.display='none';
  document.getElementById('seuil-txt').textContent = "Vous ne comprenez rien à ce que vous tenez. C'est le but.";
  document.getElementById('feuille').classList.add('on');
  document.getElementById('btn-passer').textContent = "Entrer en classe";
});

/* ---------------- barre ---------------- */
window.addEventListener('scroll', ()=>{
  const h = document.body.scrollHeight - window.innerHeight;
  document.getElementById('barre').style.width = (window.scrollY / h * 100) + '%';
});

/* ---------------- salle ---------------- */
const DETAILS = {
  fenetre:['La fenêtre',
    "Une seule, étroite, en ogive, sur le mur de gauche. Elle ne sert à rien : la lumière qu'elle laisse passer meurt à deux pas du mur. On travaille à la lanterne toute l'année, y compris en juin."],
  estampages:['Les estampages',
    "Des centaines de relevés d'inscriptions, punaisés en rangs jusqu'au plafond, certains si anciens que le papier a bruni jusqu'au noir. Aucun n'est légendé. On apprend à les identifier au fil des années, et il en reste toujours qu'on n'identifie pas."],
  mur:['Le mur du fond',
    "Les vingt-quatre signes, tracés à même l'enduit en trois rangées de huit. Ils étaient là avant la Directrice, avant les estampages, et personne ne sait qui les a tracés. C'est la seule chose de cette salle que l'on n'a jamais retouchée."],
  tables:['Les tables',
    "Rouleaux d'écorce, planchettes d'ardoise, styles de fer, et des éclats de pierre gravée que l'on fait circuler sans jamais les sortir de la pièce. Pas une baguette, pas un chaudron, pas un bocal."],
  vitrine:['La vitrine',
    "Quelques volumes reliés, sous verre, qui ne s'ouvrent pas en première année. Ils s'ouvrent en sixième, sur autorisation nominative, et certains ne sortent pas de la salle même à ce moment-là."]
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

/* ---------------- table du futhark ---------------- */
const fiche = document.getElementById('fiche');
for(let g=0; g<3; g++){
  const cont = document.getElementById('g'+g);
  RUNES.slice(g*8, g*8+8).forEach((r,i)=>{
    const b = document.createElement('button');
    b.className = 'rn';
    b.setAttribute('aria-label', r[1]);
    b.innerHTML = '<span>'+r[0]+'</span>';
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.rn').forEach(x=>x.classList.remove('actif'));
      b.classList.add('actif');
      fiche.classList.remove('vide');
      fiche.innerHTML = '<div class="l1"><span class="nom2">'+r[1]+'</span><span class="val">'+r[2]+'</span></div>'+
                        '<div class="sens">'+r[3]+'</div>';
    });
    cont.appendChild(b);
  });
}
document.getElementById('btn-six').addEventListener('click', function(){
  this.disabled = true;
  const cible = document.getElementById('futhark');
  const six = RUNES.slice(0,6);
  let i = 0;
  const t = setInterval(()=>{
    const cases = document.querySelectorAll('.rn');
    cases.forEach(x=>x.classList.remove('actif'));
    if(cases[i]) cases[i].classList.add('actif');
    cible.innerHTML = six.slice(0,i+1).map(r=>r[2]).join(' &middot; ');
    i++;
    if(i >= 6){
      clearInterval(t);
      setTimeout(()=>{
        cible.innerHTML = 'f &middot; u &middot; þ &middot; a &middot; r &middot; k &nbsp;&nbsp; <b>futhark</b>';
        document.querySelectorAll('.rn').forEach(x=>x.classList.remove('actif'));
      }, 700);
    }
  }, 620);
});

/* ---------------- translittération ---------------- */
const MOT = [
  ["ᚲ","k"],["ᚨ","a"],["ᛚ","l"],["ᛞ","d"],["ᚹ","v"],["ᛁ","i"],["ᚲ","k"]
];
const inscr = document.getElementById('inscr');
let pos = 0;

function dessinerInscription(){
  inscr.innerHTML = '';
  MOT.forEach((m,i)=>{
    const b = document.createElement('button');
    b.className = 'sig' + (i < pos ? ' lu' : '') + (i === pos ? ' suivant' : '');
    b.innerHTML = '<span class="g2">'+m[0]+'</span><span class="l2">'+m[1]+'</span>';
    b.disabled = i !== pos;
    b.addEventListener('click', ()=>{
      pos++;
      dessinerInscription();
      if(pos === MOT.length) fin();
      else document.getElementById('verdict').textContent = pos + ' signe' + (pos>1?'s':'') + ' sur ' + MOT.length;
    });
    inscr.appendChild(b);
  });
}
function fin(){
  document.getElementById('verdict').textContent = 'Translittération complète';
  const mot = document.getElementById('mot');
  mot.textContent = 'KALDVIK';
  mot.classList.add('on');
  const note = document.getElementById('motnote');
  note.textContent = "Vous venez de lire le nom du village. Elle ne le commente pas.";
  note.classList.add('on');
  document.getElementById('exo-consigne').textContent =
    "Sept signes, sept sons, et un mot que vous connaissiez déjà sans savoir l'écrire.";
}
document.getElementById('btn-reprendre').addEventListener('click', ()=>{
  pos = 0;
  dessinerInscription();
  document.getElementById('mot').classList.remove('on');
  document.getElementById('motnote').classList.remove('on');
  document.getElementById('verdict').textContent = '';
  document.getElementById('exo-consigne').textContent =
    "Touchez les signes dans l'ordre. Chacun rend sa valeur sonore, et rien d'autre.";
});
dessinerInscription();

document.getElementById('btn-controle').addEventListener('click', function(){
  /* Le contrôle est une page à part, servie et gardée par le serveur.
     L'adresse se dérive de celle-ci : la leçon vit à /cours/1/<matiere>/1,
     son contrôle à /cours/1/<matiere>/1/controle. On ne l'écrit pas en dur —
     ce serait la seule chose de cette page qui connaîtrait le plan du site. */
  this.textContent = 'Ouverture du contrôle';
  this.disabled = true;
  const ici = location.pathname;
  location.href = (ici.endsWith('/') ? ici.slice(0, -1) : ici) + '/controle';
});
</script>
</body>
</html>
`;
