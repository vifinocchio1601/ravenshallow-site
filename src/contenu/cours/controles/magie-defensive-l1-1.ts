import "server-only";

/**
 * Le contrôle de la leçon 1 de Magie défensive — la page du joueur, **vidée de ses
 * réponses**.
 *
 * ── Ce qui a changé par rapport au fichier d'origine ──
 *
 * Trois choses, et la première est toute la raison de ce lot :
 *
 *   • **`QUESTIONS` ne porte plus ni `bonne` ni `e`.** Dans sa maquette, les
 *     cinq bonnes réponses et leurs explications vivaient dans le JavaScript
 *     de la page : n'importe quel élève ouvrant le code source les avait avant
 *     de commencer. Elles sont maintenant dans `lib/cours/questionnaires.ts`,
 *     qui est `server-only`, et la route n'injecte ici que les énoncés. C'est
 *     ce que son propre commentaire annonçait — « comme il le sera côté
 *     serveur » — et c'est la solution du barème de la Cérémonie du Miroir ;
 *   • **`envoyer()` passe par le serveur.** Il envoie les réponses, reçoit la
 *     correction, et peint exactement ce que la page peignait : la même
 *     boucle, les mêmes classes, les mêmes mots. Un envoi qui échoue ne perd
 *     rien — les réponses sont encore à l'écran, et rien n'a été écrit ;
 *   • **la page s'ouvre sur son résultat** quand le contrôle est déjà envoyé.
 *     Il ne se repasse pas (`REGLES.controleEnvoiUnique`), et une page qui
 *     redemanderait les cinq réponses laisserait croire le contraire.
 *
 * L'horloge des sept jours part désormais de l'envoi **réel**, et non du
 * chargement : elle repartait à sept jours pleins à chaque rafraîchissement.
 *
 * ⚠️ **Deux marques sont remplies par la route** — `__DONNEES_QUESTIONS__` et
 * `__DONNEES_ETAT__`. Les laisser telles quelles rendrait une page qui ne
 * s'exécute pas ; `controles.test.ts` vérifie qu'elles sont bien ici, et que
 * ni `bonne` ni les explications n'y sont restées.
 *
 * Le reste — le texte, la mise en page, les mots du professeur — est celui du
 * joueur, au signe près. Les apostrophes droites comprises.
 *
 * ⚠️ **L'image de fond reste encodée dans la page**, à la différence des
 * leçons. Elle n'y est qu'**une** fois — 18 Ko, aucun gâchis à récupérer —
 * et cette page est servie `no-store` : sortie en fichier, elle ne serait pas
 * gardée davantage. À revoir le jour où un contrôle en porterait plusieurs.
 */

export const CONTROLE_MAGIE_DEFENSIVE_L1_1 = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Magie défensive — Contrôle de la leçon 1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Spectral:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@300;500&display=swap" rel="stylesheet">
<style>
:root{
  --encre:#0B1017; --nuit:#111A24; --pierre:#18232F; --trait:#26343F;
  --brume:#7A8FA1; --givre:#B9C8D4; --argent:#E4ECF2;
  --lueur:#6FA8B8; --lueur-sourde:#3E5F6B; --flamme:#CFE6EE;
  --alerte:#8E6B72; --alerte-vive:#B08088;
  --display:'Cormorant Garamond',Georgia,serif;
  --corps:'Spectral',Georgia,serif;
  --data:'JetBrains Mono',ui-monospace,monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body::before{content:"";position:fixed;inset:0;z-index:-2;
  background:url("data:image/jpeg;base64,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") center 28% / cover no-repeat;
  opacity:.34;filter:saturate(.55) contrast(1.02) blur(1px)}
body::after{content:"";position:fixed;inset:0;z-index:-1;
  background:linear-gradient(180deg,rgba(11,16,23,.66) 0%,rgba(11,16,23,.88) 45%,rgba(11,16,23,.95) 100%)}
body{background:var(--encre);color:var(--givre);font-family:var(--corps);font-weight:300;
  font-size:17px;line-height:1.7;-webkit-font-smoothing:antialiased}
.wrap{max-width:720px;margin:0 auto;padding:0 24px 110px}

/* flamme */
#flammette{position:fixed;right:26px;bottom:26px;z-index:40;text-align:center}
#flammette .f{width:13px;height:20px;margin:0 auto 8px;border-radius:50% 50% 45% 45%;
  background:radial-gradient(ellipse at 50% 70%, #fff 0%, var(--flamme) 38%, rgba(111,168,184,.42) 68%, transparent 78%);
  box-shadow:0 0 20px 5px rgba(155,205,220,.18);animation:vac 2.6s ease-in-out infinite}
@keyframes vac{0%,100%{transform:scaleY(1)}40%{transform:scaleY(1.1)}70%{transform:scaleY(.94)}}
#flammette span{font-family:var(--data);font-size:9px;letter-spacing:.16em;
  text-transform:uppercase;color:#3A4A57}

/* en-tête */
header{border-bottom:1px solid var(--trait);margin-bottom:34px;padding:32px 0 24px}
.retour{display:inline-block;font-family:var(--data);font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--brume);text-decoration:none;margin-bottom:14px;
  transition:color .3s}
.retour:hover,.retour:focus-visible{color:var(--givre)}
.fil{font-family:var(--data);font-size:10px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--brume);margin-bottom:14px}
h1{font-family:var(--display);font-weight:300;font-size:clamp(34px,7vw,52px);
  margin:0 0 10px;color:var(--argent);line-height:1.05}
.chapeau{color:var(--brume);font-size:16px;margin:0}

/* avertissement */
.avert{border:1px solid var(--trait);border-left:2px solid var(--alerte);
  background:var(--nuit);padding:18px 22px;margin-bottom:12px}
.avert p{margin:0;font-size:15px;color:var(--brume);font-style:italic}
.avert b{color:var(--givre);font-weight:400;font-style:normal}

/* barre d'avancement */
.suivi{display:flex;align-items:center;gap:14px;padding:14px 22px;border:1px solid var(--trait);
  border-top:none;background:rgba(17,26,36,.7);margin-bottom:40px;flex-wrap:wrap}
.pastilles{display:flex;gap:7px}
.pas{width:26px;height:3px;background:var(--trait)}
.pas.on{background:var(--lueur)}
.suivi span{font-family:var(--data);font-size:10.5px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--brume)}

/* questions */
.q{border-bottom:1px solid var(--trait);padding:0 0 30px;margin-bottom:30px}
.q:last-of-type{border-bottom:none}
.q .num{font-family:var(--data);font-size:10px;letter-spacing:.22em;text-transform:uppercase;
  color:var(--brume);margin-bottom:8px}
.q .txt{font-family:var(--display);font-size:25px;font-weight:400;color:var(--argent);
  margin:0 0 18px;line-height:1.3}
label.choix{display:flex;gap:14px;align-items:flex-start;padding:12px 16px;cursor:pointer;
  border:1px solid transparent;transition:border-color .2s,background .2s;margin-bottom:4px;
  font-size:16.5px}
label.choix:hover{background:var(--pierre)}
label.choix:has(input:checked){border-color:var(--lueur-sourde);background:rgba(111,168,184,.07)}
label.choix input{accent-color:var(--lueur);margin-top:6px;flex:0 0 auto}
label.choix .lettre{font-family:var(--data);font-size:12px;color:var(--brume);
  margin-top:3px;flex:0 0 auto}

/* état corrigé */
body.corrige label.choix{cursor:default;pointer-events:none}
label.choix.bonne{border-color:var(--lueur-sourde);background:rgba(111,168,184,.10)}
label.choix.mauvaise{border-color:var(--alerte);background:rgba(142,107,114,.10)}
.marque{font-family:var(--data);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;
  margin-left:auto;white-space:nowrap;padding-top:5px}
.marque.ok{color:var(--lueur)}
.marque.ko{color:var(--alerte-vive)}
.expli{display:none;margin-top:14px;padding-left:18px;border-left:1px solid var(--trait);
  color:var(--brume);font-size:15.5px}
body.corrige .expli{display:block}

/* pied */
.pied{border-top:1px solid var(--trait);padding-top:30px;margin-top:14px;
  display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.pied .etat{font-family:var(--data);font-size:10.5px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--brume)}
button.acte{font-family:var(--corps);font-size:13.5px;letter-spacing:.1em;text-transform:uppercase;
  padding:12px 26px;background:none;border:1px solid var(--trait);color:var(--givre);
  cursor:pointer;transition:border-color .2s,color .2s,background .2s}
button.acte:hover:not(:disabled){border-color:var(--lueur-sourde);color:var(--argent);background:var(--nuit)}
button.acte.primaire{border-color:var(--lueur-sourde);color:var(--lueur)}
button.acte.primaire:hover:not(:disabled){background:rgba(111,168,184,.09)}
button.acte:disabled{opacity:.32;cursor:not-allowed}
button.acte:focus-visible{outline:2px solid var(--lueur);outline-offset:2px}

/* confirmation */
#confirm{position:fixed;inset:0;z-index:70;background:rgba(6,10,14,.88);
  display:none;align-items:center;justify-content:center;padding:26px}
#confirm.on{display:flex}
#confirm .boite{max-width:460px;border:1px solid var(--trait);background:var(--nuit);
  padding:34px 36px;text-align:center}
#confirm h3{font-family:var(--display);font-size:30px;font-weight:400;margin:0 0 14px;color:var(--argent)}
#confirm p{color:var(--brume);font-size:16px;margin:0 0 26px}
#confirm .actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}

/* résultat */
#resultat{display:none;border:1px solid var(--trait);background:var(--nuit);
  padding:34px 36px;margin-bottom:44px}
body.corrige #resultat{display:block}
#resultat .lbl{font-family:var(--data);font-size:10px;letter-spacing:.22em;text-transform:uppercase;
  color:var(--lueur);margin-bottom:14px}
#resultat .score{font-family:var(--display);font-size:56px;color:var(--argent);line-height:1;
  margin-bottom:6px}
#resultat .score small{font-size:26px;color:var(--brume)}
#resultat p{color:var(--brume);font-size:16px;margin:14px 0 0;max-width:56ch}
.sceau{display:flex;align-items:center;gap:20px;border-top:1px solid var(--trait);
  margin-top:26px;padding-top:24px}
.sceau .rond{width:52px;height:52px;flex:0 0 52px;border-radius:50%;border:1px solid var(--lueur-sourde);
  display:grid;place-items:center;font-family:'Segoe UI Symbol',serif;font-size:21px;color:var(--lueur-sourde)}
.sceau .lbl2{font-family:var(--data);font-size:10px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--brume);margin-bottom:5px}
.sceau .horloge{font-family:var(--data);font-size:23px;color:var(--givre);letter-spacing:.05em}

@media (max-width:620px){
  body{font-size:16px}
  .q .txt{font-size:22px}
  #resultat{padding:26px 22px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
</head>
<body>

<div id="flammette"><div class="f"></div><span>votre flamme</span></div>

<div class="wrap">
  <header>
    <a class="retour" href="/cours/1">&#8592; Retour aux cours</a>
    <div class="fil">Magie défensive · Première année · Leçon 1 sur 4</div>
    <h1>Contrôle de fin de leçon</h1>
    <p class="chapeau">La garde et la distance · cinq questions</p>
  </header>

  <div class="avert" id="avert">
    <p>Vos réponses restent modifiables tant que vous n'avez pas envoyé le contrôle. <b>L'envoi est définitif : il n'existe pas de seconde tentative</b>, et il ouvre le délai de sept jours avant la leçon suivante.</p>
  </div>
  <div class="suivi">
    <div class="pastilles" id="pastilles"></div>
    <span id="compte">Brouillon · aucune réponse sur 5</span>
  </div>

  <div id="resultat">
    <div class="lbl">Contrôle envoyé</div>
    <div class="score"><span id="score">0</span><small> / 5</small></div>
    <p id="mot"></p>
    <div class="sceau">
      <div class="rond">&#5833;</div>
      <div>
        <div class="lbl2">Leçon 2 — Le Sortilège de l'Élan</div>
        <div class="horloge" id="horloge">7 j 00 h 00 m 00 s</div>
      </div>
    </div>
  </div>

  <form id="qcm"></form>

  <div class="pied">
    <div class="etat" id="etat">Cinq réponses attendues avant l'envoi</div>
    <button class="acte primaire" id="envoyer" disabled>Envoyer le contrôle</button>
  </div>
</div>

<div id="confirm">
  <div class="boite">
    <h3>Envoyer maintenant ?</h3>
    <p>Une fois envoyé, ce contrôle ne se repasse pas. Vos réponses seront figées et le délai de sept jours commencera.</p>
    <div class="actions">
      <button class="acte" id="annuler">Relire encore</button>
      <button class="acte primaire" id="valider">Envoyer définitivement</button>
    </div>
  </div>
</div>

<script>
const QUESTIONS = __DONNEES_QUESTIONS__;
const ETAT = __DONNEES_ETAT__;

/* ordre des réponses mélangé à l'affichage, comme il le sera côté serveur */
function melange(n){
  const a = [...Array(n).keys()];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

const form = document.getElementById('qcm');
const ordres = QUESTIONS.map(q=>melange(q.r.length));
const reponses = new Array(QUESTIONS.length).fill(null);

QUESTIONS.forEach((q,i)=>{
  const d = document.createElement('div');
  d.className = 'q';
  let html = '<div class="num">Question '+(i+1)+' sur 5</div><div class="txt">'+q.q+'</div>';
  ordres[i].forEach((idx,pos)=>{
    html += '<label class="choix" data-q="'+i+'" data-i="'+idx+'">'+
            '<input type="radio" name="q'+i+'" value="'+idx+'">'+
            '<span class="lettre">'+String.fromCharCode(97+pos)+'</span>'+
            '<span class="lib">'+q.r[idx]+'</span>'+
            '<span class="marque"></span></label>';
  });
  html += '<div class="expli"></div>';
  d.innerHTML = html;
  form.appendChild(d);
});

const pastilles = document.getElementById('pastilles');
QUESTIONS.forEach(()=>{ const s=document.createElement('div'); s.className='pas'; pastilles.appendChild(s); });

const compte = document.getElementById('compte');
const etat = document.getElementById('etat');
const btn = document.getElementById('envoyer');

form.addEventListener('change', e=>{
  const l = e.target.closest('label');
  reponses[+l.dataset.q] = +l.dataset.i;
  maj();
});

function maj(){
  let n = 0;
  reponses.forEach((r,i)=>{
    const on = r !== null;
    if(on) n++;
    pastilles.children[i].classList.toggle('on', on);
  });
  compte.textContent = n === 0 ? 'Brouillon · aucune réponse sur 5'
    : 'Brouillon enregistré · ' + n + ' réponse' + (n>1?'s':'') + ' sur 5';
  btn.disabled = n < 5;
  if(n < 5){
    const manque = reponses.map((r,i)=>r===null?i+1:null).filter(x=>x);
    etat.textContent = manque.length <= 3
      ? 'Il manque la question ' + manque.join(', ')
      : 'Il manque ' + manque.length + ' réponses';
  } else {
    etat.textContent = 'Toutes les réponses sont données';
  }
}
maj();

/* ---- confirmation ---- */
const conf = document.getElementById('confirm');
btn.addEventListener('click', ()=>{
  /* Le même bouton sert deux fois : il ouvre la confirmation avant l'envoi,
     il ramène aux cours après. Un drapeau plutôt qu'un second écouteur —
     addEventListener ne se retire pas en posant onclick par-dessus. */
  if(btn.dataset.sortie){ location.href = ETAT.retour; return; }
  conf.classList.add('on');
});
document.getElementById('annuler').addEventListener('click', ()=> conf.classList.remove('on'));
document.getElementById('valider').addEventListener('click', envoyer);
conf.addEventListener('click', e=>{ if(e.target===conf) conf.classList.remove('on'); });

/* ---- l'envoi passe par le serveur ---- */
/* Les bonnes reponses ne sont jamais descendues : elles remontent avec la
   correction, et seulement une fois le controle envoye. */

function peindreLaCorrection(c){
  QUESTIONS.forEach((q,i)=>{
    document.querySelectorAll('label[data-q="'+i+'"]').forEach(l=>{
      const idx = +l.dataset.i;
      const choisi = c.reponses[i] === idx;
      const input = l.querySelector('input');
      input.checked = choisi;
      if(idx === c.bonnes[i]){
        l.classList.add('bonne');
        l.querySelector('.marque').textContent = choisi ? 'votre réponse' : 'attendu';
        l.querySelector('.marque').className = 'marque ok';
      } else if(choisi){
        l.classList.add('mauvaise');
        l.querySelector('.marque').textContent = 'votre réponse';
        l.querySelector('.marque').className = 'marque ko';
      }
      input.disabled = true;
    });
    const bloc = form.children[i].querySelector('.expli');
    if(bloc) bloc.textContent = c.explications[i];
    pastilles.children[i].classList.add('on');
  });

  document.body.classList.add('corrige');
  document.getElementById('score').textContent = c.note;
  document.getElementById('mot').textContent = c.mot;
  document.getElementById('avert').style.display = 'none';
  compte.textContent = 'Contrôle envoyé · résultat consigné';
  etat.textContent = 'Ce contrôle ne se repasse pas';
  /* Le contrôle est passé : « Contrôle envoyé » est déjà écrit deux fois
     plus haut — dans le bandeau de suivi et sur le résultat. Le bouton n'a
     plus rien à annoncer, il devient donc la sortie. Sans lui, on reste
     bloqué sur une page qui ne propose plus rien. */
  btn.textContent = 'Retour aux cours';
  btn.disabled = false;
  btn.dataset.sortie = '1';
  horloge(c.envoyeLe);
}

async function envoyer(){
  conf.classList.remove('on');
  btn.disabled = true;
  btn.textContent = 'Envoi en cours';
  etat.textContent = 'Envoi en cours';
  let reponse, corps;
  try{
    reponse = await fetch(ETAT.envoi, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        matiere: ETAT.matiere, annee: ETAT.annee, rang: ETAT.rang, reponses: reponses
      })
    });
    corps = await reponse.json();
  } catch(e){ corps = null; }

  if(!corps || !corps.correction){
    /* Rien n'est perdu : les reponses sont encore a l'ecran, et rien n'a ete
       ecrit en base. On le dit, et on rend le bouton. */
    btn.disabled = false;
    btn.textContent = 'Envoyer le contrôle';
    etat.textContent = (corps && corps.message)
      ? corps.message
      : "L'envoi n'est pas parti. Vos réponses sont toujours là — réessayez.";
    return;
  }
  peindreLaCorrection(corps.correction);
  window.scrollTo({top:0, behavior:'smooth'});
}

/* Deja envoye : la page s'ouvre sur son resultat, elle ne le repasse pas. */
if(ETAT.envoye){ peindreLaCorrection(ETAT.envoye); }

/* ---- sept jours ---- */
function horloge(depuis){
  const fin = (depuis || Date.now()) + 7*86400000;
  const el = document.getElementById('horloge');
  const t = ()=>{
    let d = fin - Date.now(); if(d < 0) d = 0;
    const j = Math.floor(d/86400000), h = Math.floor(d%86400000/3600000),
          m = Math.floor(d%3600000/60000), s = Math.floor(d%60000/1000);
    el.textContent = j+' j '+String(h).padStart(2,'0')+' h '+String(m).padStart(2,'0')+' m '+String(s).padStart(2,'0')+' s';
  };
  t(); setInterval(t, 1000);
}
</script>
</body>
</html>
`;
