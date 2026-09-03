import "server-only";

/**
 * La leçon 1 de Sortilèges — « La Torche ».
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
 * `data:image` sont devenus l'adresse `/cours/sortileges/salle.jpg`.
 * C'était **la même image encodée trois fois**, 489 Ko dont 326 pour
 * rien, et rien de tout cela ne pouvait être mis en cache. La page passe de
 * 684 Ko à 32 Ko ; l'image est téléchargée une fois et gardée.
 *
 * Le reste — le texte, la mise en scène, le script du tracé — est celui du joueur,
 * au signe près. Les apostrophes droites comprises.
 */

export const LECON_SORTILEGES_L1_1 = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sortilèges — Leçon 1 : La Torche</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Spectral:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@300;500&display=swap" rel="stylesheet">
<style>
:root{
  --encre:#0B1017; --nuit:#111A24; --pierre:#18232F; --trait:#26343F;
  --brume:#7A8FA1; --givre:#B9C8D4; --argent:#E4ECF2;
  --lueur:#6FA8B8; --lueur-sourde:#3E5F6B; --flamme:#CFE6EE;
  --alerte:#8E6B72;
  --display:'Cormorant Garamond',Georgia,serif;
  --corps:'Spectral',Georgia,serif;
  --data:'JetBrains Mono',ui-monospace,monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body::before{content:"";position:fixed;inset:0;z-index:-2;
  background:url("/cours/sortileges/salle.jpg") center 22% / cover no-repeat;
  opacity:.42;filter:saturate(.55) contrast(1.02) blur(1.6px)}
body::after{content:"";position:fixed;inset:0;z-index:-1;
  background:linear-gradient(180deg,rgba(11,16,23,.58) 0%,rgba(11,16,23,.84) 38%,rgba(11,16,23,.93) 70%,rgba(11,16,23,.96) 100%)}
body{background:var(--encre);color:var(--givre);
  font-family:var(--corps); font-weight:300; font-size:17px; line-height:1.72;
  -webkit-font-smoothing:antialiased;
  background-image:radial-gradient(ellipse 110% 55% at 50% -8%, rgba(111,168,184,.06), transparent 62%);
  background-attachment:fixed;
}
.wrap{max-width:760px;margin:0 auto;padding:0 24px 120px}

/* ---------- seuil ---------- */
#seuil-fond{position:absolute;inset:0;z-index:-1;
  background:url("/cours/sortileges/salle.jpg") center 30% / cover no-repeat;
  opacity:.34;transition:opacity 2.4s ease}
#seuil.eteint #seuil-fond{opacity:0}
#seuil{position:fixed;inset:0;background:var(--encre);z-index:60;overflow:hidden;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:32px;transition:opacity 1.4s ease}
#seuil.parti{opacity:0;pointer-events:none}
#seuil .eyebrow{font-family:var(--data);font-size:10px;letter-spacing:.28em;
  text-transform:uppercase;color:var(--lueur-sourde);margin-bottom:26px}
#seuil h1{font-family:var(--display);font-weight:300;font-size:clamp(34px,7vw,58px);
  margin:0 0 18px;color:var(--argent);letter-spacing:.02em}
#seuil p{max-width:46ch;color:var(--brume);margin:0 0 34px;font-size:17px}
#seuil .noir{min-height:120px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:22px}
#compteur{font-family:var(--data);font-size:13px;letter-spacing:.2em;color:#1A242E}
#compteur.visible{color:#2C3B47}
.lien-passer{background:none;border:none;color:#31414D;font-family:var(--corps);
  font-size:13px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;
  padding:8px;text-decoration:underline;text-underline-offset:4px}
.lien-passer:hover{color:var(--brume)}

/* ---------- barre de lecture ---------- */
#barre{position:fixed;top:0;left:0;height:2px;background:var(--lueur);width:0;z-index:50;
  transition:width .15s linear}

/* ---------- flamme d'accompagnement ---------- */
#flammette{position:fixed;right:26px;bottom:26px;z-index:40;text-align:center;
  opacity:0;transition:opacity 1s ease}
#flammette.on{opacity:1}
#flammette .f{width:14px;height:22px;margin:0 auto 8px;border-radius:50% 50% 45% 45%;
  background:radial-gradient(ellipse at 50% 70%, #fff 0%, var(--flamme) 38%, rgba(111,168,184,.45) 68%, transparent 78%);
  box-shadow:0 0 22px 6px rgba(155,205,220,.20);
  animation:vac 2.6s ease-in-out infinite}
@keyframes vac{0%,100%{transform:scaleY(1) translateX(0);opacity:.95}
  40%{transform:scaleY(1.1) translateX(.6px);opacity:1}
  70%{transform:scaleY(.94) translateX(-.5px);opacity:.88}}
#flammette span{font-family:var(--data);font-size:9px;letter-spacing:.16em;
  text-transform:uppercase;color:#3A4A57}

/* ---------- en-tête ---------- */
header.tete{border-bottom:1px solid var(--trait);margin-bottom:56px;padding:30px 0 22px}
.retour{display:inline-block;font-family:var(--data);font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--brume);text-decoration:none;margin-bottom:14px;
  transition:color .3s}
.retour:hover,.retour:focus-visible{color:var(--givre)}
.fil{font-family:var(--data);font-size:10px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--brume);margin-bottom:14px}
h1.titre{font-family:var(--display);font-weight:300;font-size:clamp(38px,8vw,62px);
  margin:0 0 22px;color:var(--argent);letter-spacing:.01em;line-height:1}
.rune-fiche{display:flex;align-items:center;gap:22px;border:1px solid var(--trait);
  background:var(--nuit);padding:18px 24px}
.rune-fiche .g{font-size:44px;line-height:1;color:var(--givre);
  font-family:'Segoe UI Symbol','Noto Sans Runic',serif}
.rune-fiche b{display:block;font-family:var(--display);font-size:25px;font-weight:400;
  color:var(--argent);line-height:1.2}
.rune-fiche i{font-size:14.5px;color:var(--brume)}

/* ---------- texte ---------- */
h2{font-family:var(--data);font-size:11px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--lueur);font-weight:500;margin:64px 0 18px}
p{margin:0 0 20px}
.dial{margin:0 0 22px;padding-left:22px;border-left:1px solid var(--lueur-sourde);
  color:var(--argent);font-size:18px;font-style:italic}
.aparte{color:var(--brume);font-size:15.5px;font-style:italic}

/* ---------- salle interactive ---------- */
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

/* ---------- exercice de tracé ---------- */
.exo{border:1px solid var(--trait);background:var(--nuit);margin:12px 0 8px}
.exo-tete{padding:20px 26px 0}
.exo-tete .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--lueur);margin-bottom:8px}
.exo-tete h3{font-family:var(--display);font-size:26px;font-weight:400;margin:0 0 8px;color:var(--argent)}
.exo-tete p{font-size:15.5px;color:var(--brume);margin:0 0 4px}
#ardoise{display:block;width:100%;height:auto;touch-action:none;cursor:crosshair}
.exo-pied{display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:0 26px 22px;flex-wrap:wrap}
#verdict{font-family:var(--data);font-size:11.5px;letter-spacing:.06em;color:var(--brume);
  min-height:20px;flex:1;text-transform:uppercase}
#verdict.ok{color:var(--lueur)}
#verdict.ko{color:var(--alerte)}
button.acte{font-family:var(--corps);font-size:13px;letter-spacing:.1em;text-transform:uppercase;
  padding:10px 20px;background:none;border:1px solid var(--trait);color:var(--givre);
  cursor:pointer;transition:border-color .2s,color .2s,background .2s}
button.acte:hover:not(:disabled){border-color:var(--lueur-sourde);color:var(--argent);background:var(--pierre)}
button.acte.primaire{border-color:var(--lueur-sourde);color:var(--lueur)}
button.acte.primaire:hover:not(:disabled){background:rgba(111,168,184,.08)}
button.acte:disabled{opacity:.35;cursor:not-allowed}
button.acte:focus-visible{outline:2px solid var(--lueur);outline-offset:2px}
.etapes{display:flex;gap:8px;padding:0 26px 16px}
.etape{flex:1;border-top:2px solid var(--trait);padding-top:8px;
  font-family:var(--data);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#41525F}
.etape.en-cours{border-top-color:var(--givre);color:var(--givre)}
.etape.faite{border-top-color:var(--lueur);color:var(--lueur)}

/* ---------- souffle ---------- */
#souffle{padding:0 26px 24px;display:none}
#souffle.on{display:block}
#souffle .jauge{height:3px;background:var(--trait);position:relative;margin:14px 0 10px}
#souffle .jauge i{position:absolute;inset:0 auto 0 0;width:0;background:var(--lueur)}
#souffle .aide{font-family:var(--data);font-size:10.5px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--brume)}

/* ---------- tableau noir ---------- */
.ardoise-prof{border:1px solid var(--trait);background:linear-gradient(180deg,#141D26,#101822);
  padding:28px 30px;margin:8px 0}
.ardoise-prof .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--brume);margin-bottom:16px}
.ardoise-prof ul{margin:0;padding:0;list-style:none}
.ardoise-prof li{padding:0 0 12px 20px;position:relative;font-size:16px;color:var(--givre)}
.ardoise-prof li::before{content:"";position:absolute;left:0;top:11px;width:7px;height:1px;
  background:var(--lueur-sourde)}
.ardoise-prof li:last-child{padding-bottom:0}

/* ---------- ratés en accordéon ---------- */
.rate{border-bottom:1px solid var(--trait)}
.rate button{width:100%;text-align:left;background:none;border:none;padding:16px 0;
  color:var(--givre);font-family:var(--corps);font-size:16.5px;cursor:pointer;
  display:flex;justify-content:space-between;gap:16px;align-items:baseline}
.rate button:hover{color:var(--argent)}
.rate button:focus-visible{outline:2px solid var(--lueur);outline-offset:2px}
.rate .sig{font-family:var(--data);font-size:10px;letter-spacing:.16em;color:var(--brume);
  text-transform:uppercase;white-space:nowrap}
.rate .corps{max-height:0;overflow:hidden;transition:max-height .3s ease}
.rate.ouvert .corps{max-height:220px}
.rate .corps p{padding:0 0 18px;margin:0;color:var(--brume);font-size:15.5px;max-width:62ch}

/* ---------- consigne ---------- */
.consigne{border:1px solid var(--trait);border-left:2px solid var(--lueur-sourde);
  background:var(--nuit);padding:24px 28px;margin:8px 0 0}

/* ---------- pied ---------- */
.pied{margin-top:72px;border-top:1px solid var(--trait);padding-top:34px;
  display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.pied .note{font-size:14.5px;color:var(--brume);font-style:italic;max-width:44ch}
.verrou{font-family:var(--data);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--brume)}

@media (max-width:640px){
  body{font-size:16px}
  .rune-fiche{gap:16px;padding:16px 18px}
  .etapes{padding:0 18px 14px}
  .exo-tete,.exo-pied,#souffle{padding-left:18px;padding-right:18px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>

<div id="barre"></div>

<!-- ============ SEUIL ============ -->
<div id="seuil">
  <div id="seuil-fond"></div>
  <div class="eyebrow">Sortilèges · Première année · Leçon 1 sur 4</div>
  <h1>La salle de sortilèges</h1>
  <p id="seuil-txt">Il attend que tout le monde soit installé, puis fait le tour des tables et mouche les chandelles une par une, entre deux doigts, sans se servir de sa baguette.</p>
  <div class="noir">
    <button class="acte primaire" id="btn-entrer">Prendre sa place</button>
    <div id="compteur"></div>
    <button class="lien-passer" id="btn-passer">Passer l'introduction</button>
  </div>
</div>

<!-- ============ FLAMMETTE ============ -->
<div id="flammette"><div class="f"></div><span>votre flamme</span></div>

<div class="wrap">

  <header class="tete">
    <a class="retour" href="/cours/1">&#8592; Retour aux cours</a>
    <div class="fil">Sortilèges · Première année · Leçon 1 sur 4</div>
    <h1 class="titre">La Torche</h1>
    <div class="rune-fiche">
      <div class="g">&#5810;</div>
      <div><b>Kenaz</b><i>la torche, la lumière tenue</i></div>
    </div>
  </header>

  <h2>La salle</h2>
  <p>La salle de sortilèges occupe le bout du couloir nord, deux niveaux sous les dortoirs. Charpente apparente, murs de pierre nue, dalles usées, une cheminée qui ne chauffe rien. Le jour n'y entre que par trois hautes fenêtres sur le mur ouest, et il y entre gris. Près de la porte, dans votre dos, un papier jauni est punaisé à hauteur d'yeux. De loin, on dirait une facture. Personne ne vous en parle aujourd'hui.</p>

  <figure class="salle">
    <img src="/cours/sortileges/salle.jpg" alt="La salle de sortilèges, vue depuis le fond">
    <div class="hots">
      <button class="hot" style="left:12.5%;top:34%"  data-k="fenetres" aria-label="Les fenêtres"><i>1</i></button>
      <button class="hot" style="left:47.5%;top:40%"  data-k="tableau"  aria-label="Le tableau"><i>2</i></button>
      <button class="hot" style="left:50%;top:53%"    data-k="estrade"  aria-label="L'estrade et le pupitre"><i>3</i></button>
      <button class="hot" style="left:33%;top:45%"    data-k="etageres" aria-label="Les étagères"><i>4</i></button>
      <button class="hot" style="left:78.5%;top:50%"  data-k="cheminee" aria-label="La cheminée"><i>5</i></button>
      <button class="hot" style="left:31%;top:66%"    data-k="tables"   aria-label="Les tables"><i>6</i></button>
      <button class="hot" style="left:56%;top:87%"    data-k="sol"      aria-label="Le sol"><i>7</i></button>
    </div>
    <figcaption>Sept points à examiner</figcaption>
  </figure>
  <div id="detail" class="vide"><p>Touchez un point de la salle pour vous en approcher.</p></div>

  <h2>Celui qui enseigne</h2>
  <p>Il n'a pas de nom. Il en a forcément un, mais il ne l'a jamais donné, il ne figure sur aucun document affiché, et les élèves des années supérieures affirment tous l'avoir cherché sans le trouver. On l'appelle monsieur, et cela lui convient.</p>
  <p>Impossible de lui donner un âge. Selon la lumière, il paraît en avoir quarante ou soixante-dix. Il porte des mitaines à l'intérieur, en toute saison, et garde sa baguette dans sa manche plutôt qu'à la ceinture. Il parle bas et ne répète jamais. Ceux qui n'ont pas entendu demandent à leur voisin.</p>

  <h2>Le cours</h2>
  <p>Il rallume. Le noir aura duré une minute, ce qui est très long. Une chaise a raclé, quelqu'un a ri trop fort, puis plus rien.</p>
  <p class="dial">« Voilà. C'est pour cela que celui-ci vient en premier. »</p>
  <p>Il ne reviendra jamais sur ce moment, ni cette année ni les suivantes. Il n'en a pas besoin.</p>
  <p>Il trace ensuite la rune au tableau, lentement, en décomposant. Deux traits. Une descente franche, puis un angle qui s'ouvre vers l'avant depuis le milieu du premier trait, et non depuis son extrémité.</p>
  <p class="dial">« Ce que vous obtenez ressemble à une bouche. Ou à un bec, si vous préférez : les deux images sont bonnes. Ce qui n'est pas bon, c'est un livre ouvert. Votre angle est alors trop large et vous n'obtiendrez rien du tout. »</p>
  <p>Il explique que la rune ne fabrique pas la lumière, elle la désigne. Kenaz nomme la torche, c'est-à-dire non pas le feu mais la lumière que quelqu'un tient et entretient. Voilà pourquoi cette flamme ne consume rien : elle n'a rien à consumer, elle ne se nourrit pas de ce qui l'entoure, elle tient à l'attention de celui qui l'a tracée.</p>
  <p class="dial">« Ceux d'entre vous qui retiennent cela ne rateront presque jamais ce sort. Les autres passeront l'hiver à se demander pourquoi leur flamme meurt dès qu'ils pensent à leur dîner. »</p>
  <p>L'incantation vient ensuite. Le nom de la rune, et rien d'autre. Kenaz, deux syllabes, l'accent sur la première, la finale à peine sonore. Le mot se dit sur l'expiration et s'achève avant le tracé.</p>
  <p>Puis il passe entre les tables, les mains derrière le dos, et compte à voix basse pendant que vous tracez.</p>

  <h2>À vous</h2>

  <div class="exo">
    <div class="exo-tete">
      <div class="lbl">Exercice de tracé</div>
      <h3>Tracer Kenaz</h3>
      <p id="exo-consigne">Premier trait : une descente franche, du haut vers le bas. Maintenez et faites glisser.</p>
    </div>
    <div class="etapes">
      <div class="etape en-cours" id="et1">1 · la descente</div>
      <div class="etape" id="et2">2 · l'angle</div>
      <div class="etape" id="et3">3 · le souffle</div>
    </div>
    <svg id="ardoise" viewBox="0 0 640 300" role="application" aria-label="Zone de tracé de la rune">
      <rect x="0" y="0" width="640" height="300" fill="#0D141B"/>
      <g id="guide" opacity=".22">
        <line x1="290" y1="70" x2="290" y2="230" stroke="#6FA8B8" stroke-width="1" stroke-dasharray="3 6"/>
        <line x1="290" y1="150" x2="378" y2="96" stroke="#6FA8B8" stroke-width="1" stroke-dasharray="3 6"/>
        <line x1="290" y1="150" x2="378" y2="204" stroke="#6FA8B8" stroke-width="1" stroke-dasharray="3 6"/>
      </g>
      <circle id="ancre" cx="290" cy="150" r="4" fill="none" stroke="#3E5F6B" opacity="0"/>
      <path id="trace1" fill="none" stroke="#B9C8D4" stroke-width="2.4" stroke-linecap="round"/>
      <path id="trace2" fill="none" stroke="#B9C8D4" stroke-width="2.4" stroke-linecap="round"/>
      <g id="flamme-svg" opacity="0">
        <ellipse id="fl" cx="290" cy="60" rx="9" ry="15" fill="#CFE6EE"/>
        <ellipse cx="290" cy="62" rx="4" ry="8" fill="#ffffff" opacity=".85"/>
      </g>
    </svg>
    <div id="souffle">
      <div class="aide" id="souffle-txt">Maintenez le bouton et comptez jusqu'à trois. Relâchez trop tôt et la flamme meurt.</div>
      <div class="jauge"><i id="jauge-i"></i></div>
      <button class="acte primaire" id="btn-souffle">Maintenir le souffle</button>
    </div>
    <div class="exo-pied">
      <div id="verdict"></div>
      <button class="acte" id="btn-reprendre">Reprendre</button>
    </div>
  </div>
  <p class="aparte">Sa propre flamme, pendant tout ce temps, brûle au bout de la baguette restée dans sa manche. Elle est plus petite que toutes les vôtres. Elle ne bouge pas d'un cheveu.</p>

  <h2>Ce qu'il laisse au tableau</h2>
  <div class="ardoise-prof">
    <div class="lbl">Kenaz · la torche</div>
    <ul>
      <li>Deux traits, jamais trois. Descente franche, puis angle ouvert depuis le milieu du premier trait.</li>
      <li>Le mot se dit sur l'expiration et s'achève avant le tracé.</li>
      <li>Le souffle se relâche lentement pendant le tracé et continue après lui : la flamme vit tant que dure l'expiration.</li>
      <li>Flamme froide : elle n'allume ni feu, ni lampe, ni mèche, et ne se transmet à rien.</li>
      <li>Portée d'éclairage : trois pas. Ce n'est pas une lanterne.</li>
      <li>Elle ne traverse pas la brume. Sur le chemin escarpé, elle vous montrera vos pieds et rien de plus.</li>
    </ul>
  </div>

  <h2>Les ratés qu'il annonce d'avance</h2>
  <p>Il en donne cinq, dans cet ordre, et prévient que vous les ferez tous.</p>
  <div id="rates"></div>

  <h2>Ce qu'il demande pour la semaine</h2>
  <div class="consigne">
    <p class="dial">« Vous traverserez un couloir entier sans que votre flamme s'éteigne. Seul. Sans lampe et sans compagnie. Le jour où cela comptera vraiment, vous serez seul. »</p>
    <p class="dial" style="margin-bottom:0">« Vous noterez ensuite combien de fois elle a vacillé, et à quel endroit. Neuf élèves sur dix constatent qu'elle faiblit toujours au même point du trajet. Cet endroit dit quelque chose de vous, et rien du tout du couloir. »</p>
  </div>
  <p style="margin-top:22px">Il rallume les chandelles des tables une par une, avec une longue allumette, toujours sans sa baguette. La séance est terminée. Il ne salue pas.</p>

  <div class="pied">
    <div class="note">Le contrôle compte cinq questions. Vos réponses restent modifiables tant que vous ne l'avez pas envoyé. L'envoi est définitif.</div>
    <div style="text-align:right">
      <button class="acte primaire" id="btn-controle">Passer le contrôle</button>
      <div class="verrou" style="margin-top:10px">Leçon 2 scellée · sept jours après l'envoi</div>
    </div>
  </div>

</div>

<script>
/* ---------------- seuil : la minute dans le noir ---------------- */
const seuil = document.getElementById('seuil');
const btnEntrer = document.getElementById('btn-entrer');
const btnPasser = document.getElementById('btn-passer');
const compteur = document.getElementById('compteur');
const seuilTxt = document.getElementById('seuil-txt');
const flammette = document.getElementById('flammette');

function ouvrir(){
  seuil.classList.add('parti');
  setTimeout(()=>{ seuil.style.display='none'; flammette.classList.add('on'); }, 1400);
}
btnPasser.addEventListener('click', ouvrir);

btnEntrer.addEventListener('click', ()=>{
  btnEntrer.style.display='none';
  btnPasser.textContent = 'Rallumer tout de suite';
  seuilTxt.style.transition='opacity 1.2s ease';
  seuilTxt.style.opacity='0';
  document.querySelector('#seuil h1').style.transition='opacity 1.6s ease';
  document.querySelector('#seuil h1').style.opacity='0';
  document.querySelector('#seuil .eyebrow').style.transition='opacity 1.6s ease';
  document.querySelector('#seuil .eyebrow').style.opacity='0';
  let s = 0;
  compteur.classList.add('visible');
  const t = setInterval(()=>{
    s++;
    compteur.textContent = s < 3 ? '' : 'Il ne se passe rien.';
    if(s >= 7){
      clearInterval(t);
      compteur.textContent = '';
      seuilTxt.textContent = 'Il rallume.';
      seuilTxt.style.opacity = '1';
      setTimeout(ouvrir, 1600);
    }
  }, 1000);
});

/* ---------------- barre de lecture ---------------- */
window.addEventListener('scroll', ()=>{
  const h = document.body.scrollHeight - window.innerHeight;
  document.getElementById('barre').style.width = (window.scrollY / h * 100) + '%';
});

/* ---------------- salle : points chauds ---------------- */
const DETAILS = {
  fenetres:['Les hautes fenêtres',
    "Trois ogives à losanges de plomb sur le mur ouest. Elles ne s'ouvrent pas. Elles donnent sur la mer, et par gros temps on entend l'eau contre la falaise sans rien voir du tout. Le jour qui passe au travers est gris même en été."],
  tableau:['Le tableau',
    "Une ardoise immense, si usée par les décennies de craie qu'elle en est devenue grise plutôt que noire. Les tracés d'anciennes promotions n'en partent plus tout à fait : par certaines lumières, on distingue des runes que personne dans la salle n'a apprises."],
  estrade:["L'estrade et le pupitre",
    "Trois marches et un lutrin de bois sombre. Il ne s'en sert jamais. Il enseigne en marchant entre les tables, les mains derrière le dos, et le pupitre reste vide toute l'année comme s'il attendait quelqu'un d'autre."],
  etageres:['Les étagères',
    "Des bocaux scellés, des flacons, des boîtes étiquetées d'une écriture qui n'est pas la sienne. Rien de tout cela ne sert au programme de première année. On vous demande de ne pas y toucher, une seule fois, le premier jour."],
  cheminee:['La cheminée',
    "Vaste, de pierre, et froide. Elle tire mal depuis toujours et ne sert plus qu'une nuit par an, pour la veillée des braises. Le reste du temps, la salle se chauffe comme le reste du château : mal."],
  tables:['Les tables',
    "De longues tables de chêne noirci, deux chandelles par table, quatre élèves de chaque côté. Les places sont attribuées le premier jour et fixées pour l'année. La vôtre est celle où vous vous êtes assis sans réfléchir, et vous ne saurez jamais si c'était un hasard."],
  sol:['Le sol',
    "Des dalles usées, des brûlures rondes, quelques auréoles claires laissées par du gel, et par endroits des marques plus anciennes que personne ne sait plus dater. Aucune n'a jamais été réparée."]
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

/* ---------------- exercice de tracé ---------------- */
const svg = document.getElementById('ardoise');
const t1 = document.getElementById('trace1'), t2 = document.getElementById('trace2');
const ancre = document.getElementById('ancre');
const flammeSvg = document.getElementById('flamme-svg'), fl = document.getElementById('fl');
const verdict = document.getElementById('verdict');
const consigne = document.getElementById('exo-consigne');
const et1 = document.getElementById('et1'), et2 = document.getElementById('et2'), et3 = document.getElementById('et3');
const blocSouffle = document.getElementById('souffle');

let etape = 1, dessine = false, pts = [], stroke1 = null;

function pt(e){
  const r = svg.getBoundingClientRect();
  return { x:(e.clientX - r.left)/r.width*640, y:(e.clientY - r.top)/r.height*300 };
}
function dis(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
function dit(txt, cls){ verdict.textContent = txt; verdict.className = cls||''; }

svg.addEventListener('pointerdown', e=>{
  if(etape > 2) return;
  svg.setPointerCapture(e.pointerId);
  dessine = true; pts = [pt(e)];
  (etape===1?t1:t2).setAttribute('d','M '+pts[0].x+' '+pts[0].y);
});
svg.addEventListener('pointermove', e=>{
  if(!dessine) return;
  const p = pt(e); pts.push(p);
  const el = etape===1 ? t1 : t2;
  el.setAttribute('d', el.getAttribute('d') + ' L '+p.x+' '+p.y);
});
svg.addEventListener('pointerup', ()=>{
  if(!dessine) return;
  dessine = false;
  if(pts.length < 4){ (etape===1?t1:t2).setAttribute('d',''); return; }
  etape===1 ? juger1() : juger2();
});

function juger1(){
  const a = pts[0], b = pts[pts.length-1];
  const dy = b.y - a.y, dx = Math.abs(b.x - a.x), len = dis(a,b);
  if(dy < 0){ echec("Kenaz descend. Reprenez du haut."); return; }
  if(dx > Math.abs(dy) * 0.42){ echec("Le premier trait doit être franc et droit."); return; }
  if(len < 90){ echec("Trait trop court : sa fermeté décide de l'intensité."); return; }
  stroke1 = {a, b, mid:{x:(a.x+b.x)/2, y:(a.y+b.y)/2}, len};
  ancre.setAttribute('cx', stroke1.mid.x); ancre.setAttribute('cy', stroke1.mid.y);
  ancre.setAttribute('opacity','1');
  etape = 2;
  et1.className = 'etape faite'; et2.className = 'etape en-cours';
  consigne.textContent = "Second trait : depuis le milieu du premier, un angle qui s'ouvre vers l'avant. Une bouche, pas un livre.";
  dit("Descente correcte.", 'ok');
}

function juger2(){
  const a = pts[0], b = pts[pts.length-1];
  if(dis(a, stroke1.mid) > 34){
    echec("Le second trait part du milieu du premier, pas de son extrémité."); return;
  }
  if(dis(a,b) < 45){ echec("Angle trop court pour tenir."); return; }
  const ang = Math.abs(Math.atan2(b.y-a.y, Math.abs(b.x-a.x)) * 180/Math.PI);
  if(b.x < a.x){ echec("Le tracé a été mené à l'envers : la flamme naîtrait derrière la main."); return; }
  if(ang > 74){ echec("Angle trop fermé : le trait se confond avec la descente."); return; }
  if(ang < 22){ echec("Une bouche, pas un livre. Votre angle est trop ouvert."); return; }
  etape = 3;
  et2.className = 'etape faite'; et3.className = 'etape en-cours';
  consigne.textContent = "Le tracé est juste. Il reste le souffle, qui continue après le geste.";
  dit("Tracé juste. La flamme attend le souffle.", 'ok');
  blocSouffle.classList.add('on');
  flammeSvg.setAttribute('opacity','.25');
  flammeSvg.setAttribute('transform','translate('+(stroke1.a.x-290)+','+(stroke1.a.y-100)+')');
}

function echec(msg){
  dit(msg, 'ko');
  (etape===1?t1:t2).setAttribute('d','');
  pts = [];
}

/* ---------------- le souffle ---------------- */
const btnSouffle = document.getElementById('btn-souffle');
const jauge = document.getElementById('jauge-i');
const souffleTxt = document.getElementById('souffle-txt');
let tenu = 0, boucle = null, fini = false;

function debutSouffle(){
  if(fini || etape < 3) return;
  tenu = 0;
  boucle = setInterval(()=>{
    tenu += 60;
    const p = Math.min(tenu/3000, 1);
    jauge.style.width = (p*100)+'%';
    flammeSvg.setAttribute('opacity', String(.25 + p*.75));
    fl.setAttribute('ry', String(9 + p*8));
    if(p >= 1){ finSouffle(true); }
  }, 60);
}
function finSouffle(reussi){
  clearInterval(boucle); boucle = null;
  if(reussi){
    fini = true;
    btnSouffle.disabled = true;
    btnSouffle.textContent = 'La flamme tient';
    souffleTxt.textContent = "Elle tient d'elle-même, maintenant. Elle vivra aussi longtemps que vous y penserez.";
    dit("Sortilège de la Torche acquis.", 'ok');
    et3.className = 'etape faite';
    consigne.textContent = "Vous savez allumer. La leçon 2 vous apprendra à éteindre.";
  } else if(tenu > 0){
    jauge.style.width = '0%';
    flammeSvg.setAttribute('opacity','.25'); fl.setAttribute('ry','15');
    souffleTxt.textContent = "Le souffle a été coupé à la fin du tracé, par réflexe. Comptez jusqu'à trois.";
    dit("La flamme naît et meurt aussitôt.", 'ko');
    tenu = 0;
  }
}
['pointerdown','keydown'].forEach(ev=>btnSouffle.addEventListener(ev, e=>{
  if(ev==='keydown' && e.key!==' ' && e.key!=='Enter') return;
  if(ev==='keydown') e.preventDefault();
  debutSouffle();
}));
['pointerup','pointerleave','keyup','blur'].forEach(ev=>btnSouffle.addEventListener(ev, ()=>{
  if(boucle) finSouffle(false);
}));

document.getElementById('btn-reprendre').addEventListener('click', ()=>{
  etape = 1; pts = []; stroke1 = null; fini = false; tenu = 0;
  clearInterval(boucle); boucle = null;
  t1.setAttribute('d',''); t2.setAttribute('d','');
  ancre.setAttribute('opacity','0');
  flammeSvg.setAttribute('opacity','0'); flammeSvg.removeAttribute('transform');
  fl.setAttribute('ry','15');
  jauge.style.width = '0%';
  blocSouffle.classList.remove('on');
  btnSouffle.disabled = false; btnSouffle.textContent = 'Maintenir le souffle';
  souffleTxt.textContent = "Maintenez le bouton et comptez jusqu'à trois. Relâchez trop tôt et la flamme meurt.";
  et1.className = 'etape en-cours'; et2.className = 'etape'; et3.className = 'etape';
  consigne.textContent = "Premier trait : une descente franche, du haut vers le bas. Maintenez et faites glisser.";
  dit('');
});

/* ---------------- les ratés ---------------- */
const RATES = [
  ["La flamme naît et meurt aussitôt","le souffle",
   "Le souffle a été coupé à la fin du tracé, par réflexe. Rejouez le geste en comptant à voix basse jusqu'à trois après l'avoir terminé."],
  ["La flamme naît derrière la main","le sens",
   "Le tracé a été mené à l'envers, ce qui arrive à tous les gauchers tant que personne ne les a corrigés. Ce n'est pas une faute, c'est un réglage."],
  ["Rien ne se produit","l'angle",
   "L'angle est trop ouvert. Une bouche, pas un livre."],
  ["La flamme vacille sans cesse","l'attention",
   "Vous pensez à autre chose. Le plus banal des ratés, et le plus vexant : la flamme tient à l'attention de celui qui l'a tracée."],
  ["La flamme tient mais éclaire à peine","le premier trait",
   "Il a été tracé mollement. Sa fermeté décide de l'intensité, et rien ne rattrape ensuite une descente molle."]
];
const cont = document.getElementById('rates');
RATES.forEach((r,i)=>{
  const d = document.createElement('div');
  d.className = 'rate';
  d.innerHTML = '<button aria-expanded="false"><span>'+r[0]+'</span><span class="sig">'+r[1]+'</span></button>'+
                '<div class="corps"><p>'+r[2]+'</p></div>';
  d.querySelector('button').addEventListener('click', function(){
    const o = d.classList.toggle('ouvert');
    this.setAttribute('aria-expanded', o ? 'true':'false');
  });
  cont.appendChild(d);
});

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
