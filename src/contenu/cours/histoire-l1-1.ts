import "server-only";

/**
 * La leçon 1 de Histoire de Ravenshallow — « La côte avant l’école ».
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
 * `data:image` sont devenus l'adresse `/cours/histoire/salle.jpg`.
 * C'était **la même image encodée trois fois**, 600 Ko dont 400 pour
 * rien, et rien de tout cela ne pouvait être mis en cache. La page passe de
 * 828 Ko à 27 Ko ; l'image est téléchargée une fois et gardée.
 *
 * Le reste — le texte, la mise en scène, la frise et ses volets — est celui du joueur,
 * au signe près. Les apostrophes droites comprises.
 */

export const LECON_HISTOIRE_L1_1 = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Histoire de Ravenshallow — Leçon 1 : La côte avant l'école</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Spectral:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@300;500&display=swap" rel="stylesheet">
<style>
:root{
  --encre:#0B1017; --nuit:#111A24; --pierre:#18232F; --trait:#26343F;
  --brume:#7A8FA1; --givre:#B9C8D4; --argent:#E4ECF2;
  --lueur:#6FA8B8; --lueur-sourde:#3E5F6B; --craie:#D8DFE4; --laiton:#9C8A5E;
  --alerte:#8E6B72; --alerte-vive:#B08088;
  --display:'Cormorant Garamond',Georgia,serif;
  --corps:'Spectral',Georgia,serif;
  --data:'JetBrains Mono',ui-monospace,monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body::before{content:"";position:fixed;inset:0;z-index:-2;
  background:url("/cours/histoire/salle.jpg") center 40% / cover no-repeat;
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
  background:url("/cours/histoire/salle.jpg") center 34% / cover no-repeat;opacity:.36}
#seuil.parti{opacity:0;pointer-events:none}
#seuil .eyebrow{font-family:var(--data);font-size:10px;letter-spacing:.28em;
  text-transform:uppercase;color:var(--lueur-sourde);margin-bottom:26px}
#seuil h1{font-family:var(--display);font-weight:300;font-size:clamp(32px,6.5vw,54px);
  margin:0 0 18px;color:var(--argent)}
#seuil p{max-width:50ch;color:var(--brume);margin:0 0 26px;font-size:17px}
#quatre{display:flex;gap:14px;justify-content:center;margin:0 0 26px;opacity:0;transition:opacity 1.4s ease}
#quatre.on{opacity:1}
#quatre .c{width:56px;height:70px;border:1px solid var(--trait);background:rgba(24,35,47,.7)}
#quatre .c.q{border-color:var(--laiton)}
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
.module .g{width:34px;height:34px;flex:0 0 34px;border:1px solid var(--laiton);opacity:.5}
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

/* ---------- exercices ---------- */
.exo{border:1px solid var(--trait);background:var(--nuit);margin:12px 0 8px}
.exo-tete{padding:22px 26px 0}
.exo-tete .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--lueur);margin-bottom:8px}
.exo-tete h3{font-family:var(--display);font-size:26px;font-weight:400;margin:0 0 8px;color:var(--argent)}
.exo-tete p{font-size:15.5px;color:var(--brume);margin:0 0 4px}

/* les quatre cadres */
.cadres{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:18px 26px 0}
.cadre{background:none;border:1px solid var(--trait);padding:0;cursor:pointer;
  transition:border-color .2s,background .2s}
.cadre:hover{border-color:var(--lueur-sourde)}
.cadre.actif{border-color:var(--laiton);background:rgba(156,138,94,.07)}
.cadre .toile{aspect-ratio:.82;margin:9px;background:
  radial-gradient(ellipse at 50% 34%, rgba(216,223,228,.16) 0%, rgba(216,223,228,.05) 42%, transparent 66%),
  linear-gradient(180deg,#141C25,#0E151D);border:1px solid #1E2A35}
.cadre .plaque{margin:0 9px 9px;height:16px;background:rgba(156,138,94,.22);
  border:1px solid rgba(156,138,94,.35)}
.cadre.court .plaque{background:rgba(156,138,94,.10)}
#fiche{margin:18px 26px 0;border-top:1px solid var(--trait);padding-top:18px;min-height:104px}
#fiche .nom{font-family:var(--display);font-size:25px;color:var(--argent)}
#fiche .dates{font-family:var(--data);font-size:12px;letter-spacing:.16em;color:var(--laiton);margin-top:5px}
#fiche .txt{font-size:15.5px;color:var(--brume);margin-top:9px}
#fiche.vide .txt{font-style:italic}

/* les villages */
.villages{padding:16px 26px 0}
.vil{display:grid;grid-template-columns:120px 1fr 54px;gap:14px;align-items:center;
  padding:9px 0;border-bottom:1px solid var(--trait);cursor:pointer;transition:background .2s}
.vil:hover{background:rgba(24,35,47,.6)}
.vil .n{font-size:15.5px;color:var(--givre)}
.vil .axe{position:relative;height:12px;background:rgba(216,223,228,.05)}
.vil .seg{position:absolute;top:0;bottom:0;background:rgba(111,168,184,.30);
  border-left:1px solid var(--lueur);border-right:1px solid var(--lueur);
  transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.2,.7,.3,1)}
.vil.on .seg{transform:scaleX(1)}
.vil .c{font-family:var(--data);font-size:12px;color:var(--brume);text-align:right}
.vil.on .c{color:var(--argent)}
#superpose{position:relative;height:34px;margin:20px 26px 0;background:rgba(216,223,228,.05)}
#superpose .s{position:absolute;top:0;bottom:0;background:rgba(111,168,184,.16)}
#superpose .band{position:absolute;top:0;bottom:0;background:rgba(111,168,184,.42);
  border-left:1px solid var(--craie);border-right:1px solid var(--craie);opacity:0;transition:opacity 1s ease .6s}
#superpose.on .band{opacity:1}
.echelle{display:flex;justify-content:space-between;margin:6px 26px 0;
  font-family:var(--data);font-size:9.5px;letter-spacing:.12em;color:#41525F;text-transform:uppercase}
.exo-pied{display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:18px 26px 22px;flex-wrap:wrap}
#verdict,#verdict2{font-family:var(--data);font-size:11.5px;letter-spacing:.06em;color:var(--brume);
  min-height:20px;flex:1;text-transform:uppercase}
.ok{color:var(--lueur)!important}

.ardoise{border:1px solid var(--trait);background:linear-gradient(180deg,#141D26,#101822);
  padding:28px 30px;margin:8px 0}
.ardoise .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--brume);margin-bottom:16px}
.ardoise ul{margin:0;padding:0;list-style:none}
.ardoise li{padding:0 0 12px 20px;position:relative;font-size:16px;color:var(--givre)}
.ardoise li::before{content:"";position:absolute;left:0;top:11px;width:7px;height:1px;background:var(--laiton);opacity:.8}
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
  .exo-tete,.exo-pied,.cadres,.villages{padding-left:18px;padding-right:18px}
  #fiche,#superpose,.echelle{margin-left:18px;margin-right:18px}
  .vil{grid-template-columns:92px 1fr 44px;gap:9px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>

<div id="barre"></div>

<div id="seuil">
  <div id="seuil-fond"></div>
  <div class="eyebrow">Histoire de Ravenshallow · Première année · Leçon 1 sur 4</div>
  <h1>Ils sont quatre</h1>
  <p id="seuil-txt">Il enseigne debout, derrière un lutrin, et il ne s'assied pas de toute l'heure. Derrière lui, quatre portraits sont accrochés au mur de pierre, chacun sous sa plaque de laiton.</p>
  <div id="quatre"><div class="c"></div><div class="c"></div><div class="c"></div><div class="c q"></div></div>
  <button class="acte primaire" id="btn-entrer">Lever les yeux</button>
  <button class="lien-passer" id="btn-passer">Passer l'introduction</button>
</div>

<div class="wrap">

  <header class="tete">
    <div class="fil">Histoire de Ravenshallow · Première année · Leçon 1 sur 4</div>
    <h1 class="titre">La côte avant l'école</h1>
    <div class="module">
      <div class="g"></div>
      <div><b>Module : Les quatre</b><i>L'histoire de l'école telle qu'on la raconte aux enfants de treize ans.</i></div>
    </div>
  </header>

  <h2>La salle</h2>
  <p>Une salle haute, aux deux murs latéraux montés de rayonnages jusqu'à la charpente. Une échelle glisse le long du mur ouest ; les premières années n'ont pas le droit d'y monter, et personne ne le leur interdit vraiment, ce qui revient au même.</p>
  <p>Les pupitres sont lourds, usés jusqu'au brillant, et gravés d'initiales dont les plus anciennes ne correspondent à aucun nom du registre. Au fond, un tableau noir, un lutrin, un poêle de fonte, et une porte basse cerclée de fer qui ne s'ouvre pas.</p>
  <p>Au-dessus du tableau, les quatre.</p>

  <div class="salle">
    <img src="/cours/histoire/salle.jpg" alt="La salle d'histoire, vue depuis le fond">
    <div class="hots">
      <button class="hot" style="left:50%;top:28%"   data-k="portraits" aria-label="Les portraits"><i>1</i></button>
      <button class="hot" style="left:44%;top:39.5%" data-k="plaques" aria-label="Les plaques"><i>2</i></button>
      <button class="hot" style="left:47%;top:59%"   data-k="lutrin" aria-label="Le lutrin"><i>3</i></button>
      <button class="hot" style="left:63.5%;top:61%" data-k="poele" aria-label="Le poêle"><i>4</i></button>
      <button class="hot" style="left:68%;top:52%"   data-k="porte" aria-label="La porte cerclée"><i>5</i></button>
      <button class="hot" style="left:15%;top:44%"   data-k="echelle" aria-label="L'échelle"><i>6</i></button>
    </div>
    <figcaption>Six points à examiner</figcaption>
  </div>
  <div id="detail" class="vide"><p>Touchez un point de la salle pour vous en approcher.</p></div>

  <h2>Celui qui enseigne</h2>
  <p>Un très vieil homme qui enseigne debout, derrière le lutrin, et qui ne s'assied pas de toute l'heure. Il connaît le manuel par cœur et le dit dès la première minute, sans y mettre de fierté particulière.</p>
  <p>Quand on l'interrompt, il s'arrête au milieu d'une phrase, répond entièrement à la question, puis reprend exactement là où il s'était arrêté, au mot près. Les élèves essaient de le prendre en défaut chaque année et n'y parviennent pas.</p>

  <h2>Le cours</h2>
  <p>Il ne commence pas par les fondateurs. Il commence par le vide qui les précède.</p>
  <p class="dial">« Avant cette école, il y avait des villages. Ils vivaient de la mer, ils enterraient leurs morts, ils tenaient des comptes. Et pendant un certain nombre d'années, dont nous discuterons, ils ont perdu des habitants. »</p>
  <p>Il ouvre alors le registre posé sur le lutrin, à une page qu'il n'a pas eu besoin de chercher, et fait relever au tableau ce que les comptes des paroisses permettent d'établir.</p>

  <div class="exo">
    <div class="exo-tete">
      <div class="lbl">Premier exercice</div>
      <h3>Les comptes des paroisses</h3>
      <p id="exo1-consigne">Cinq villages de la côte, et les années où chacun a enregistré des pertes inexpliquées. Touchez un village pour voir sa période.</p>
    </div>
    <div class="villages" id="villages"></div>
    <div class="echelle"><span>Début du relevé</span><span>Trente ans plus tard</span></div>
    <div id="superpose"><div class="band" style="left:30%;width:26%"></div></div>
    <div class="exo-pied">
      <div id="verdict"></div>
      <button class="acte" id="btn-superposer">Superposer les cinq</button>
    </div>
  </div>

  <p class="dial">« Séparément, chacune de ces séries s'explique. Une mauvaise saison, une épidémie, un hiver dur. Ensemble, elles ne s'expliquent plus, et c'est la seule chose que ce relevé prouve. »</p>
  <p>Un élève demande alors ce qui les provoquait. Il s'arrête au milieu d'une phrase, comme toujours.</p>
  <p class="dial">« Nous ne savons pas. Le cours ne le dira pas cette année et ne le dira aucune autre. Ce n'est pas un secret que je garde : c'est un renseignement que personne ne possède. »</p>
  <p>Puis il reprend au mot où il s'était interrompu.</p>

  <h2>Les quatre</h2>
  <p>Il ne les présente pas. Il désigne le mur derrière lui, et laisse la classe regarder aussi longtemps qu'elle veut. Les plaques sont à hauteur d'yeux quand on se lève, et il ne demande à personne de se rasseoir.</p>

  <div class="exo">
    <div class="exo-tete">
      <div class="lbl">Second exercice</div>
      <h3>Les plaques de laiton</h3>
      <p id="exo2-consigne">Quatre portraits, quatre plaques. Touchez-en une pour la lire.</p>
    </div>
    <div class="cadres" id="cadres"></div>
    <div id="fiche" class="vide"><div class="txt">Aucune plaque lue.</div></div>
    <div class="exo-pied">
      <div id="verdict2"></div>
      <button class="acte" id="btn-reprendre">Reprendre</button>
    </div>
  </div>

  <p>Le reste de l'heure porte sur la côte elle-même : les métiers, les hivers, les routes, ce qui reliait les villages et ce qui les séparait. C'est plus long que ce que les élèves attendaient d'un cours d'histoire de la magie, et c'est délibéré.</p>
  <div class="alerte">Une question sur la grotte reçoit une réponse d'une phrase, et la même chaque année. Elle est scellée depuis la fondation, elle n'est pas au programme, et vous n'en approcherez pas.</div>

  <h2>Ce qu'il laisse au tableau</h2>
  <div class="ardoise">
    <div class="lbl">Les quatre · première leçon</div>
    <ul>
      <li>Les villages de la côte existaient avant l'école et vivaient de la mer.</li>
      <li>Des disparitions inexpliquées ont touché plusieurs villages à la fois, pendant des années.</li>
      <li>Les comptes des paroisses confirment les pertes. C'est la source la plus fiable dont on dispose.</li>
      <li>On ignore ce qui les provoquait. Le cours ne le dira jamais.</li>
      <li>Les disparitions ont cessé. C'est le seul fait que toutes les sources rapportent de la même manière.</li>
    </ul>
  </div>

  <h2>Ce qu'il demande pour la semaine</h2>
  <div class="consigne">
    <p class="dial" style="margin-bottom:0">« Vous relèverez, dans le manuel, tout ce qui est présenté comme certain. Vous ferez une seconde liste de ce qui est présenté comme probable. La deuxième sera plus longue que vous ne le croyez, et c'est tout l'objet de l'exercice. »</p>
  </div>
  <p style="margin-top:22px">En sortant, vous repassez sous les quatre portraits. Trois vous regardent. Le quatrième aussi.</p>

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
  document.getElementById('quatre').classList.add('on');
  document.getElementById('seuil-txt').textContent =
    "Trois plaques portent un nom et deux dates. La quatrième porte un nom et une seule.";
  document.getElementById('btn-passer').textContent = "Prendre place";
});
window.addEventListener('scroll', ()=>{
  const h = document.body.scrollHeight - window.innerHeight;
  document.getElementById('barre').style.width = (window.scrollY / h * 100) + '%';
});

/* ---------- salle ---------- */
const DETAILS = {
  portraits:['Les quatre portraits',
    "Peints du vivant des fondateurs, dit-on, mais aucune source ne le confirme et le style des quatre toiles n'est pas tout à fait le même. Ils sont accrochés là depuis plus longtemps que le tableau noir, et on a monté le tableau en dessous plutôt que de les déplacer."],
  plaques:['Les plaques',
    "Quatre plaques de laiton, une par portrait, à hauteur d'yeux quand on se lève. Trois portent un nom et deux dates. La quatrième porte un nom et une seule. Le professeur ne le fait jamais remarquer, et n'a jamais refusé d'en parler à qui le remarquait."],
  lutrin:['Le lutrin',
    "Un registre y reste ouvert toute l'année, à une page qu'il n'a pas besoin de chercher. On ne l'a jamais vu tourner un feuillet ni baisser les yeux dessus. Il connaît le manuel par cœur et le dit dès la première minute."],
  poele:['Le poêle',
    "Le seul allumé de tout l'étage. Les autres salles sont froides, celle-ci ne l'est pas, et aucun élève ne s'en est jamais plaint. C'est le poêle qui explique que les cours d'histoire soient les plus suivis de l'hiver."],
  porte:['La porte cerclée',
    "Elle donne sur les archives. Elle est fermée, elle le restera, et elle s'ouvre en sixième année sur autorisation nominative. Les premières années n'en verront jamais l'intérieur, et personne ne le leur cache : on le leur dit le premier jour."],
  echelle:["L'échelle",
    "Elle court le long du mur ouest et dessert les trois rangs du haut. Les premières années n'ont pas le droit d'y monter, et personne ne le leur interdit vraiment, ce qui revient au même. Ceux qui y montent quand même redescendent avec des volumes qu'ils ne savent pas lire."]
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

/* ---------- exercice 1 : les villages ---------- */
const VILLAGES = [
  ["Kaldvik",      22, 46, 9,  "Le seul village encore habité aujourd'hui. Les comptes y sont tenus sans interruption depuis la fondation de la paroisse."],
  ["Sjøvik",       30, 62, 14, "Perdu quatorze habitants en dix ans. Le village a été abandonné une génération plus tard, pour d'autres raisons."],
  ["Bregnes",      34, 58, 11, "Les registres y sont tenus par le même homme pendant toute la période, ce qui les rend particulièrement comparables."],
  ["Nordhamn",     28, 55, 7,  "Sept pertes seulement, mais toutes en hiver, et toutes des adultes en âge de travailler."],
  ["Stavtangen",   38, 66, 12, "Le relevé s'interrompt brutalement au milieu de la période. Personne ne sait pourquoi, et le cours le signale sans commenter."]
];
const contV = document.getElementById('villages');
const verdict = document.getElementById('verdict');
let ouverts = 0;

VILLAGES.forEach((v,i)=>{
  const d = document.createElement('div');
  d.className = 'vil';
  d.innerHTML = '<div class="n">'+v[0]+'</div>'+
                '<div class="axe"><div class="seg" style="left:'+v[1]+'%;width:'+(v[2]-v[1])+'%"></div></div>'+
                '<div class="c">'+v[3]+'</div>';
  d.addEventListener('click', ()=>{
    if(!d.classList.contains('on')){
      d.classList.add('on');
      ouverts++;
      verdict.textContent = ouverts + ' village' + (ouverts>1?'s':'') + ' sur 5';
    }
    detailVillage(v);
  });
  contV.appendChild(d);
});
function detailVillage(v){
  const c = document.getElementById('exo1-consigne');
  c.textContent = v[0] + ' — ' + v[4];
}
document.getElementById('btn-superposer').addEventListener('click', function(){
  this.disabled = true;
  document.querySelectorAll('.vil').forEach((d,i)=>{
    setTimeout(()=>{ d.classList.add('on'); }, i*220);
  });
  const sup = document.getElementById('superpose');
  VILLAGES.forEach(v=>{
    const s = document.createElement('div');
    s.className = 's';
    s.style.left = v[1]+'%'; s.style.width = (v[2]-v[1])+'%';
    sup.insertBefore(s, sup.firstChild);
  });
  setTimeout(()=>{
    sup.classList.add('on');
    verdict.textContent = "Les cinq séries se recouvrent sur seize ans";
    verdict.className = 'ok';
    document.getElementById('exo1-consigne').textContent =
      "Séparément, chacune s'explique. Ensemble, elles ne s'expliquent plus, et c'est la seule chose que ce relevé prouve.";
  }, 1300);
});

/* ---------- exercice 2 : les plaques ---------- */
const QUATRE = [
  ["Sigrid Kaldenor", "née · morte", false,
   "C'est elle qui est allée chercher les trois autres. Le cours le dit, et c'est le seul point de la leçon qu'aucune source ne conteste."],
  ["Torvald Bryggen", "né · mort", false,
   "Le seul dont la discipline se soit scindée en deux matières encore enseignées aujourd'hui, l'alchimie et l'herboristerie."],
  ["Einar Tidevann", "né · mort", false,
   "Mort quelques années après la fondation. Comment, l'école ne le dit pas : la deuxième année de ce cours y reviendra, et n'en dira pas davantage."],
  ["Alaric Nattmor", "né", true,
   "Une seule date. Il a quitté l'école et n'y est jamais revenu ; nul ne sait quand il est mort, ni où. La plaque est de la même main que les trois autres, ce qui veut dire qu'on l'a gravée en sachant qu'on ne pourrait pas la compléter."]
];
const contC = document.getElementById('cadres');
const fiche = document.getElementById('fiche');
const verdict2 = document.getElementById('verdict2');
let lues = 0;

QUATRE.forEach((q,i)=>{
  const b = document.createElement('button');
  b.className = 'cadre' + (q[2] ? ' court' : '');
  b.setAttribute('aria-label', 'Portrait ' + (i+1));
  b.innerHTML = '<div class="toile"></div><div class="plaque"></div>';
  b.addEventListener('click', ()=>{
    document.querySelectorAll('.cadre').forEach(x=>x.classList.remove('actif'));
    b.classList.add('actif');
    if(!b.dataset.lu){ b.dataset.lu = '1'; lues++; }
    fiche.classList.remove('vide');
    fiche.innerHTML = '<div class="nom">'+q[0]+'</div><div class="dates">'+q[1]+'</div>'+
                      '<div class="txt">'+q[3]+'</div>';
    if(lues === 4){
      verdict2.textContent = "Les quatre plaques lues";
      verdict2.className = 'ok';
      document.getElementById('exo2-consigne').textContent =
        "Trois portent deux dates. La quatrième en porte une. Il ne le fera jamais remarquer.";
    } else {
      verdict2.textContent = lues + ' plaque' + (lues>1?'s':'') + ' sur 4';
      verdict2.className = '';
    }
  });
  contC.appendChild(b);
});
document.getElementById('btn-reprendre').addEventListener('click', ()=>{
  lues = 0;
  document.querySelectorAll('.cadre').forEach(x=>{ x.classList.remove('actif'); delete x.dataset.lu; });
  fiche.classList.add('vide');
  fiche.innerHTML = '<div class="txt">Aucune plaque lue.</div>';
  verdict2.textContent = ''; verdict2.className = '';
  document.getElementById('exo2-consigne').textContent = "Quatre portraits, quatre plaques. Touchez-en une pour la lire.";
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
