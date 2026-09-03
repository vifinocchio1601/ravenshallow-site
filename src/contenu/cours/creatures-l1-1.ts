import "server-only";

/**
 * La leçon 1 de Créatures magiques — « Regarder ».
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
 * `data:image` sont devenus l'adresse `/cours/creatures/ecurie.jpg`.
 * C'était **la même image encodée trois fois**, 510 Ko dont 340 pour
 * rien, et rien de tout cela ne pouvait être mis en cache. La page passe de
 * 706 Ko à 26 Ko ; l'image est téléchargée une fois et gardée.
 *
 * Le reste — le texte, la mise en scène, les fiches du bestiaire et l'exercice d'observation — est celui du joueur,
 * au signe près. Les apostrophes droites comprises.
 */

export const LECON_CREATURES_L1_1 = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Créatures magiques — Leçon 1 : Regarder</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Spectral:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@300;500&display=swap" rel="stylesheet">
<style>
:root{
  --encre:#0B1017; --nuit:#111A24; --pierre:#18232F; --trait:#26343F;
  --brume:#7A8FA1; --givre:#B9C8D4; --argent:#E4ECF2;
  --lueur:#6FA8B8; --lueur-sourde:#3E5F6B; --craie:#D8DFE4; --platre:#CBC6BA;
  --alerte:#8E6B72; --alerte-vive:#B08088;
  --display:'Cormorant Garamond',Georgia,serif;
  --corps:'Spectral',Georgia,serif;
  --data:'JetBrains Mono',ui-monospace,monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body::before{content:"";position:fixed;inset:0;z-index:-2;
  background:url("/cours/creatures/ecurie.jpg") center 42% / cover no-repeat;
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
  background:url("/cours/creatures/ecurie.jpg") center 44% / cover no-repeat;opacity:.36}
#seuil.parti{opacity:0;pointer-events:none}
#seuil .eyebrow{font-family:var(--data);font-size:10px;letter-spacing:.28em;
  text-transform:uppercase;color:var(--lueur-sourde);margin-bottom:26px}
#seuil h1{font-family:var(--display);font-weight:300;font-size:clamp(32px,6.5vw,54px);
  margin:0 0 18px;color:var(--argent)}
#seuil p{max-width:48ch;color:var(--brume);margin:0 0 26px;font-size:17px}
#minuteur{font-family:var(--data);font-size:12px;letter-spacing:.24em;color:#22303B;min-height:22px;
  margin-bottom:22px;transition:color .6s}
#minuteur.on{color:#31414D}
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
.module .g{width:34px;height:34px;flex:0 0 34px;border:1px solid var(--platre);opacity:.45;
  border-radius:50% 50% 44% 44% / 62% 62% 38% 38%}
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

/* traversée */
#couloir{position:relative;height:120px;margin:16px 26px 0;border-top:1px solid var(--trait);
  border-bottom:1px solid var(--trait);overflow:hidden;background:rgba(13,20,27,.55)}
#rang{position:absolute;inset:0;display:flex;align-items:center;gap:0;
  opacity:0;transition:opacity .5s ease}
#rang.on{opacity:1}
.moulage{flex:0 0 auto;width:30px;text-align:center;position:relative}
.moulage .p{width:19px;height:24px;margin:0 auto;background:var(--platre);opacity:.55;
  border-radius:52% 52% 44% 44% / 66% 66% 34% 34%}
.moulage .e{width:9px;height:13px;background:rgba(216,223,228,.28);margin:3px auto 0;
  transform:rotate(-8deg)}
.moulage .num{position:absolute;top:-2px;left:0;right:0;font-family:var(--data);font-size:9px;
  color:var(--lueur);opacity:0;transition:opacity .2s}
.moulage.compte .num{opacity:1}
.moulage.compte .p{opacity:.9}
#voile{position:absolute;inset:0;background:var(--nuit);opacity:1;transition:opacity .4s ease;
  display:grid;place-items:center;font-family:var(--data);font-size:11px;letter-spacing:.2em;
  text-transform:uppercase;color:#3A4A57}
#voile.off{opacity:0;pointer-events:none}
.choix{display:flex;gap:8px;flex-wrap:wrap;padding:18px 26px 0}
.ch{background:none;border:1px solid var(--trait);color:var(--givre);font-family:var(--data);
  font-size:15px;padding:9px 20px;cursor:pointer;transition:border-color .2s,background .2s}
.ch:hover:not(:disabled){border-color:var(--lueur-sourde);background:var(--pierre)}
.ch.juste{border-color:var(--lueur);color:var(--lueur);background:rgba(111,168,184,.1)}
.ch.faux{border-color:var(--alerte);color:var(--alerte-vive)}
.ch:disabled{cursor:default}

/* deux colonnes */
.phrases{padding:14px 26px 0}
.ph{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;
  padding:11px 0;border-bottom:1px solid var(--trait)}
.ph .t{font-size:16px;color:var(--givre)}
.ph .b{display:flex;gap:6px}
.pb{background:none;border:1px solid var(--trait);color:var(--brume);font-family:var(--data);
  font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:7px 12px;cursor:pointer;
  transition:border-color .2s,color .2s,background .2s}
.pb:hover:not(:disabled){border-color:var(--lueur-sourde);color:var(--givre)}
.pb.pris{border-color:var(--craie);color:var(--argent);background:rgba(216,223,228,.08)}
.ph.juste .pb.pris{border-color:var(--lueur);color:var(--lueur);background:rgba(111,168,184,.1)}
.ph.faux .pb.pris{border-color:var(--alerte);color:var(--alerte-vive);background:rgba(142,107,114,.1)}
.pb:disabled{cursor:default}

.exo-pied{display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:18px 26px 22px;flex-wrap:wrap}
#verdict,#verdict2{font-family:var(--data);font-size:11.5px;letter-spacing:.06em;color:var(--brume);
  min-height:20px;flex:1;text-transform:uppercase}
.ok{color:var(--lueur)!important}
.ko{color:var(--alerte-vive)!important}

.ardoise{border:1px solid var(--trait);background:linear-gradient(180deg,#141D26,#101822);
  padding:28px 30px;margin:8px 0}
.ardoise .lbl{font-family:var(--data);font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--brume);margin-bottom:16px}
.ardoise ul{margin:0;padding:0;list-style:none}
.ardoise li{padding:0 0 12px 20px;position:relative;font-size:16px;color:var(--givre)}
.ardoise li::before{content:"";position:absolute;left:0;top:11px;width:7px;height:1px;background:var(--platre);opacity:.7}
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
  .exo-tete,.exo-pied,.choix,.phrases{padding-left:18px;padding-right:18px}
  #couloir{margin-left:18px;margin-right:18px}
  .ph{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>

<div id="barre"></div>

<div id="seuil">
  <div id="seuil-fond"></div>
  <div class="eyebrow">Créatures magiques · Première année · Leçon 1 sur 4</div>
  <h1>Il ne dit rien</h1>
  <p id="seuil-txt">Il est déjà là, assis sur le coin de la table, et il regarde vers le fond de la salle. Il ne se lève pas, ne salue pas, et ne dit rien pendant que vous vous installez.</p>
  <div id="minuteur"></div>
  <button class="acte primaire" id="btn-entrer">Attendre</button>
  <button class="lien-passer" id="btn-passer">Passer l'introduction</button>
</div>

<div class="wrap">

  <header class="tete">
    <div class="fil">Créatures magiques · Première année · Leçon 1 sur 4</div>
    <h1 class="titre">Regarder</h1>
    <div class="module">
      <div class="g"></div>
      <div><b>Module : La faune du domaine</b><i>Rien de dangereux, tout d'observation.</i></div>
    </div>
  </header>

  <h2>La salle</h2>
  <p>L'ancienne écurie du château, au bout de la cour nord. On y a monté des rayonnages jusqu'à la charpente, mais on n'a jamais démonté les box : ils sont toujours là, alignés le long des deux murs, vides. Personne n'y loge plus rien, et le professeur ne dit pas depuis quand.</p>
  <p>Au pied des box court une double rangée de moulages d'empreintes, en plâtre, chacun avec son étiquette plantée dedans. Il y en a beaucoup. On passe entre eux pour rejoindre les deux tables du milieu, et on ne les regarde pas.</p>

  <div class="salle">
    <img src="/cours/creatures/ecurie.jpg" alt="L'ancienne écurie, salle des créatures magiques">
    <div class="hots">
      <button class="hot" style="left:30%;top:70%"   data-k="moulages" aria-label="Les moulages"><i>1</i></button>
      <button class="hot" style="left:13%;top:33%"   data-k="rayons" aria-label="Les rayonnages"><i>2</i></button>
      <button class="hot" style="left:49%;top:39%"   data-k="carte" aria-label="La carte"><i>3</i></button>
      <button class="hot" style="left:73%;top:55%"   data-k="box" aria-label="Les box"><i>4</i></button>
      <button class="hot" style="left:13%;top:79%"   data-k="commode" aria-label="La commode"><i>5</i></button>
      <button class="hot" style="left:50%;top:92%"   data-k="rigole" aria-label="La rigole"><i>6</i></button>
    </div>
    <figcaption>Six points à examiner</figcaption>
  </div>
  <div id="detail" class="vide"><p>Touchez un point de la salle pour vous en approcher.</p></div>

  <h2>Celui qui enseigne</h2>
  <p>Un homme encore jeune, d'une patience qui met mal à l'aise. Il commence chaque leçon en ne disant rien pendant plusieurs minutes, assis sur le coin de la table, à regarder les fenêtres hautes.</p>
  <p>Un corbeau s'y pose presque toujours, et n'en repart pas avant la fin de l'heure. Il ne le nourrit pas et ne le regarde pas deux fois.</p>

  <h2>Le cours</h2>
  <p>Le silence dure. Les élèves s'agitent, puis se taisent, puis finissent par regarder dans la même direction que lui. Quand toute la classe s'est tue, il parle.</p>
  <p class="dial">« Combien d'empreintes avez-vous longées en entrant ? »</p>

  <div class="exo">
    <div class="exo-tete">
      <div class="lbl">Premier exercice</div>
      <h3 id="exo1-titre">La traversée</h3>
      <p id="exo1-consigne">Vous êtes entré par le fond et vous avez remonté la rangée de gauche jusqu'aux tables. Combien de moulages avez-vous longés ?</p>
    </div>
    <div id="couloir">
      <div id="rang"></div>
      <div id="voile">vous êtes déjà passé devant</div>
    </div>
    <div class="choix" id="choix"></div>
    <div class="exo-pied">
      <div id="verdict"></div>
      <button class="acte" id="btn-recompter" style="display:none">Les compter</button>
    </div>
  </div>

  <p>Les réponses fusent, de vingt à cinquante. Personne ne tombe juste, et deux élèves seulement osent répondre qu'ils n'en savent rien.</p>
  <p class="dial">« Vous n'avez pas mal vu. Vous n'avez pas regardé. Ce n'est pas la même faute et elle ne se corrige pas de la même façon. »</p>
  <p>Suit la seule véritable leçon de l'heure : la distance, l'immobilité, le vent, l'heure, et la différence entre ce qu'on voit et ce qu'on en déduit. Il fait ouvrir le carnet d'observation, qui sera tenu jusqu'en juin, et impose deux colonnes.</p>
  <p class="dial">« À gauche, ce que vous avez vu. À droite, ce que vous croyez que cela veut dire. La colonne de gauche est un fait. Celle de droite est vous. »</p>

  <div class="exo">
    <div class="exo-tete">
      <div class="lbl">Second exercice</div>
      <h3>Deux colonnes</h3>
      <p id="exo2-consigne">Il descend un moulage de son étagère et le pose sur la table. Voici huit phrases entendues dans la classe. Rangez-les.</p>
    </div>
    <div class="phrases" id="phrases"></div>
    <div class="exo-pied">
      <div id="verdict2"></div>
      <button class="acte" id="btn-corriger">Corriger</button>
    </div>
  </div>

  <p>La classe passe ensuite une demi-heure à décrire le moulage sans le toucher. Quand il retourne enfin l'étiquette, elle porte trois mots que personne n'avait devinés, et une date.</p>
  <p class="aparte">Deux élèves écrivent que l'animal boitait. Il souligne les deux phrases sans dire si c'est juste.</p>
  <p>À la fin de l'heure, quelqu'un demande à quoi servent les box. Il répond qu'ils ne servent pas, et passe à autre chose.</p>

  <h2>Ce qu'il laisse au tableau</h2>
  <div class="ardoise">
    <div class="lbl">La faune du domaine · première leçon</div>
    <ul>
      <li>Deux colonnes : ce qu'on voit, ce qu'on en déduit. Jamais mélangées.</li>
      <li>Une observation sans heure ni lieu n'est pas une observation.</li>
      <li>On n'approche pas pour mieux voir. On attend, ou on renonce.</li>
      <li>Les corbeaux du domaine portent le courrier. Les sauvages n'ont rien à voir avec eux.</li>
      <li>On ne siffle jamais un corbeau sauvage.</li>
    </ul>
  </div>
  <div class="alerte">Aucune créature du bestiaire n'apparaît dans cette salle, ni dans aucune sortie de première année. Ce que vous étudiez cette année vit sur le domaine, se laisse voir, et n'a jamais fait de mal à personne.</div>

  <h2>Ce qu'il demande pour la semaine</h2>
  <div class="consigne">
    <p class="dial" style="margin-bottom:0">« Une observation par jour, sept jours, n'importe quoi de vivant. Un chien, une mouette, un chat de cuisine. Deux colonnes. Celui qui écrira sept fois la même chose l'aura peut-être bien fait : je vous dirai lequel des deux. »</p>
  </div>
  <p style="margin-top:22px">En sortant, vous repassez entre les moulages. Cette fois, vous les comptez.</p>

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
  const m = document.getElementById('minuteur');
  m.classList.add('on');
  const lignes = ["Rien.","Une chaise racle.","Quelqu'un tousse.","Rien.",
                  "Un élève se retourne vers la porte.","Rien.",
                  "La classe entière regarde dans la même direction que lui."];
  let i = 0;
  const t = setInterval(()=>{
    m.textContent = lignes[i];
    i++;
    if(i >= lignes.length){
      clearInterval(t);
      setTimeout(()=>{
        document.getElementById('seuil-txt').textContent = "Alors il parle.";
        m.textContent = "";
        setTimeout(ouvrir, 1400);
      }, 1600);
    }
  }, 1300);
  document.getElementById('btn-passer').textContent = "Ne pas attendre";
});
window.addEventListener('scroll', ()=>{
  const h = document.body.scrollHeight - window.innerHeight;
  document.getElementById('barre').style.width = (window.scrollY / h * 100) + '%';
});

/* ---------- salle ---------- */
const DETAILS = {
  moulages:['Les moulages',
    "Une double rangée au pied des box, en plâtre, relevés sur le domaine depuis des générations. Chaque moulage porte une étiquette plantée dedans : le lieu, la date, et le nom de celui qui l'a relevé. Les plus anciennes sont écrites d'une main qu'on ne sait plus lire."],
  rayons:['Les rayonnages',
    "Ils montent jusqu'à la charpente et contiennent des registres d'observation, pas des traités. Ce sont les carnets des promotions passées, reliés année par année. Le vôtre y sera dans sept ans, et quelqu'un le lira."],
  carte:['La carte',
    "La carte des relevés : où chaque moulage a été pris, avec sa date. Elle est constellée de marques et certaines zones en sont couvertes. D'autres, sur la même carte, n'en portent aucune."],
  box:['Les box',
    "L'écurie n'a jamais été démontée. Les box sont vides, en bon état, et fermés. On n'y loge plus rien, et le professeur ne dit pas depuis quand ni pourquoi. La question revient chaque année et reçoit chaque année la même absence de réponse."],
  commode:['La commode',
    "Des tiroirs plats, un par catégorie : plumes, poils, pelotes de réjection, coquilles, fragments. Tout y est classé, étiqueté, et rien n'y est spectaculaire. C'est la pièce du château qui contient le plus d'objets et le moins de mystère."],
  rigole:['La rigole',
    "Elle date de l'écurie et n'a jamais été comblée. Elle sert encore : on lave la salle après chaque séance de moulage, parce que le plâtre prend partout."]
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

/* ---------- exercice 1 : la traversée ---------- */
const NB = 34;
const rang = document.getElementById('rang');
for(let i=0;i<NB;i++){
  const d = document.createElement('div');
  d.className = 'moulage';
  d.innerHTML = '<div class="num">'+(i+1)+'</div><div class="p"></div><div class="e"></div>';
  rang.appendChild(d);
}
const CHOIX = [26, 31, 34, 39, "Je n'en sais rien"];
const contChoix = document.getElementById('choix');
const verdict = document.getElementById('verdict');
const btnRecompter = document.getElementById('btn-recompter');

CHOIX.forEach(c=>{
  const b = document.createElement('button');
  b.className = 'ch';
  b.textContent = c;
  b.addEventListener('click', ()=>{
    document.querySelectorAll('.ch').forEach(x=>x.disabled = true);
    document.getElementById('voile').classList.add('off');
    rang.classList.add('on');
    if(c === 34){
      b.classList.add('juste');
      verdict.textContent = "Trente-quatre. Vous êtes le troisième en sept ans.";
      verdict.className = 'ok';
    } else if(c === "Je n'en sais rien"){
      b.classList.add('juste');
      verdict.textContent = "La seule réponse honnête. Il la préfère à un chiffre inventé.";
      verdict.className = 'ok';
    } else {
      b.classList.add('faux');
      document.querySelectorAll('.ch').forEach(x=>{ if(x.textContent === '34') x.classList.add('juste'); });
      verdict.textContent = "Il y en a trente-quatre. Vous n'avez pas mal vu : vous n'avez pas regardé.";
      verdict.className = 'ko';
    }
    btnRecompter.style.display = '';
    document.getElementById('exo1-consigne').textContent =
      "Ils sont là depuis toujours et vous êtes passé devant sans en voir un seul.";
  });
  contChoix.appendChild(b);
});

btnRecompter.addEventListener('click', function(){
  this.disabled = true;
  const cases = document.querySelectorAll('.moulage');
  let i = 0;
  const t = setInterval(()=>{
    if(cases[i]) cases[i].classList.add('compte');
    i++;
    if(i >= cases.length){
      clearInterval(t);
      document.getElementById('exo1-titre').textContent = "Trente-quatre";
    }
  }, 55);
});

/* ---------- exercice 2 : deux colonnes ---------- */
const PHRASES = [
  ["Cinq doigts, bien détachés.", "vu"],
  ["L'animal était pressé.", "deduit"],
  ["Le talon s'enfonce plus que l'avant.", "vu"],
  ["Il boitait.", "deduit"],
  ["Aucune griffe ne marque le plâtre.", "vu"],
  ["Ce n'est pas un chien.", "deduit"],
  ["L'empreinte mesure onze centimètres.", "vu"],
  ["Elle a été laissée de nuit.", "deduit"]
];
const contPh = document.getElementById('phrases');
const rep = new Array(PHRASES.length).fill(null);
PHRASES.forEach((p,i)=>{
  const d = document.createElement('div');
  d.className = 'ph';
  d.innerHTML = '<div class="t">'+p[0]+'</div><div class="b">'+
    '<button class="pb" data-i="'+i+'" data-v="vu">ce que je vois</button>'+
    '<button class="pb" data-i="'+i+'" data-v="deduit">ce que j\\u2019en déduis</button></div>';
  contPh.appendChild(d);
});
const verdict2 = document.getElementById('verdict2');
contPh.querySelectorAll('.pb').forEach(b=>{
  b.addEventListener('click', ()=>{
    const i = +b.dataset.i;
    rep[i] = b.dataset.v;
    b.parentNode.querySelectorAll('.pb').forEach(x=>x.classList.remove('pris'));
    b.classList.add('pris');
    const n = rep.filter(x=>x).length;
    verdict2.textContent = n + ' phrase' + (n>1?'s':'') + ' rangée' + (n>1?'s':'') + ' sur ' + PHRASES.length;
    verdict2.className = '';
  });
});
document.getElementById('btn-corriger').addEventListener('click', function(){
  if(rep.filter(x=>x).length < PHRASES.length){
    verdict2.textContent = "Rangez les huit avant de corriger.";
    verdict2.className = 'ko';
    return;
  }
  this.disabled = true;
  let justes = 0;
  contPh.querySelectorAll('.ph').forEach((d,i)=>{
    const ok = rep[i] === PHRASES[i][1];
    d.classList.add(ok ? 'juste' : 'faux');
    if(ok) justes++;
    d.querySelectorAll('.pb').forEach(x=>x.disabled = true);
  });
  verdict2.textContent = justes + ' sur ' + PHRASES.length;
  verdict2.className = justes === PHRASES.length ? 'ok' : (justes >= 6 ? '' : 'ko');
  const c = document.getElementById('exo2-consigne');
  if(justes === PHRASES.length)
    c.textContent = "Les huit sont à leur place. Il ne dira rien, et c'est déjà beaucoup.";
  else if(justes >= 6)
    c.textContent = "Presque. Ce qui vous a piégé est ce qui semblait évident.";
  else
    c.textContent = "La colonne de droite a débordé sur celle de gauche. C'est le défaut de toute la promotion.";
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
