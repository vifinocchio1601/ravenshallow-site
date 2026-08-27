# Ravenshallow

Forum de jeu de rôle textuel : une école de magie sur la côte nordique.
Next.js 14 (App Router), TypeScript strict, Tailwind 3, Prisma + PostgreSQL.

**En ligne :** https://ravenshallow-site.vercel.app — base Neon (Francfort),
déploiement automatique au push sur `main`.

---

## Avant d'écrire quoi que ce soit

**La documentation de référence n'est pas dans le dépôt.** Deux `.docx`, deux
niveaux au-dessus, dans `Perso/Ravenshallow/` — **rendus par le joueur le
26 août 2026**, après une disparition de quelques jours. S'ils manquent encore,
les redemander plutôt que de trancher au jugé.

- `Bible_du_LORE.docx` — seize sections, mise à jour du 26 août 2026 : le
  monde et **la carte opposable**, la fondation et la grotte, les quatre
  maisons, la magie et la baguette, le bestiaire, les figures, la structure
  scolaire, le parcours du joueur, **le vocabulaire des espaces**, l'identité
  visuelle, et les points encore ouverts
- `Reglement_Ravenshallow.docx` — identique à `src/lib/reglement.ts`, ses
  87 points revérifiés par comparaison automatique le 26 août 2026 : 87 sur 87,
  aucun écart de texte

Les extraire avec `zipfile` + `word/document.xml`. **Attention à l'extraction
ligne à ligne** : quatre points du règlement (6.2, 10.2, 10.4, 15.2) se
poursuivent au paragraphe suivant, et une comparaison naïve les croit
divergents alors que le code porte bien le texte entier.

Toute question de lore ou de règle se tranche là, pas au jugé.

**Le règlement fait autorité sur le produit.** Les durées de bannissement
(art. 8), le droit de contester dans les quinze jours (8.5), le format des
avatars (art. 6), l'âge d'entrée (10.2) : ce sont des règles écrites par le
joueur, pas des choix d'implémentation. Ne pas les réécrire sans demander.

---

## Démarrer

```bash
npm run dev              # http://localhost:3000
npm test                 # vitest, 484 tests — ne touche JAMAIS la base
npm run lint
npx tsc --noEmit
npm run build            # à passer avant tout déploiement
npm run courriel:verifier # teste l'authentification SMTP sans rien envoyer
npm run base:importer     # reprend .donnees/dossiers.json dans la base
npm run base:migrer       # applique les migrations en attente
npm run corbeaux:essai    # exerce la Tour aux Corbeaux SUR LA VRAIE BASE
npm run base:sauvegarder  # recopie toute la base dans un fichier, hors du dépôt
npm run forum:essai       # exerce les pouvoirs ET le forum SUR LA VRAIE BASE
```

`base:migrer` existe parce que la CLI Prisma ne lit pas `.env.local` : le
script fait le pont, sans jamais afficher la chaîne de connexion.

**Les deux essais en base** sont à part, et leur nom de fichier —
`en-base.essai.ts`, et non `.test.ts` — les exclut de `npm test` **à
dessein** : ils écrivent vraiment en base. Chaque script npm vise **un seul
fichier par son chemin** ; les lancer ensemble mélangerait deux ménages qui
n'ont rien à voir.

`forum:essai` crée un compte `essai.pouvoirs@ravenshallow.invalid`, lui
accorde et lui retire des permissions, le nomme puis le démet préfet, et
vérifie **la trace au journal** à chaque geste — plus les trois refus de la
base, éprouvés pour de bon. Il efface par l'adresse exacte.

`corbeaux:essai` Il crée deux comptes `essai.*@ravenshallow.invalid`, les fait s'écrire,
se bloquer, se chercher, puis efface ce qu'il a écrit — conversations
comprises, sans quoi celles dont les deux comptes disparaissent resteraient
orphelines. Son ménage vise `essai.*` **et** `.invalid` : la première version
n'avait que la seconde condition, et emportait les comptes de démonstration
créés à côté. Son délai est porté à vingt secondes — au défaut de cinq, le
réveil de Neon faisait échouer les premiers essais sous un « Test timed out »
qui ne disait rien de la cause.

⚠️ **La base porte maintenant de vraies conversations**, entre les comptes du
joueur. Tout script de ménage doit viser `@ravenshallow.invalid` et rien
d'autre — et surtout ne jamais commencer par un effacement large.

`.env.local` porte cinq variables : `ADMIN_PASSWORD`, `AUTH_SECRET`,
`MAIL_EXPEDITEUR`, `MAIL_APP_PASSWORD`, `DATABASE_URL`. Les mêmes existent sur
Vercel, environnement Production — avec là-bas la chaîne Neon **pooled**.

---

## Les coutures uniques

Vingt-deux endroits concentrent chacun une décision. Ne pas recopier leur
logique ailleurs, l'y ajouter.

| Fichier | Ce qu'il décide, seul |
| --- | --- |
| `lib/session/acces.ts` | qui entre dans l'école, **jusqu'où il va**, où l'on atterrit — **et les six questions qu'on a le droit de poser sur une étape** |
| `lib/ecole/menu.ts` | les routes de l'école — **l'arbre du bandeau**, la protection, les droits du suspendu comme du nouvel arrivant, et la remontée de la pastille sur un groupe |
| `lib/dossier/depot.ts` | l'accès au stockage — aiguille entre PostgreSQL et l'échafaudage JSON |
| `lib/dossier/schema.ts` | la validation, partagée mot pour mot entre le formulaire et la route |
| `lib/ceremonie/questionnaire.ts` | les cinq questions **et leur barème** — `server-only`, jamais expédié au client |
| `lib/ceremonie/repartition.ts` | le calcul de la maison et le départage, reproductibles |
| `lib/bjornstav/constantes.ts` | toute la scène de la boutique **et les vingt-cinq réactions** — `server-only` |
| `lib/ecole/baguette.ts` | les dix codes, les dix noms, et la validation de ce qu'envoie le navigateur |
| `lib/dossier/role-affiche.ts` | ce qu'on peut écrire dans le rôle particulier — **partagé mot pour mot** entre le champ de saisie et l'action serveur |
| `lib/ecole/tournoi.ts` | **qui marque pour sa maison**, et le compteur des quatre. Ne compte rien aujourd'hui : la règle est posée avant le premier total |
| `lib/corbeaux/droits.ts` | **qui peut écrire à qui**, et ce qu'un corbeau devient — `PART`, `PART_DANS_LE_VIDE`, `REFUSE` |
| `lib/corbeaux/depot.ts` | l'accès aux conversations. **Seul endroit qui compose une requête** sur les messages |
| `lib/corbeaux/schema.ts` | ce qu'un corbeau a le droit de porter — **partagé mot pour mot** entre le champ et la route |
| `lib/corbeaux/constantes.ts` | tous les textes de la Tour, **et aucun import** : c'est ce qui permet à `ecole/menu.ts` d'y prendre le nom de l'entrée sans ouvrir un cycle |
| `lib/forum/pouvoirs.ts` | **qui a le droit de quoi, et sur quelle maison.** Les cinq permissions, le staff qui passe partout, et le droit du préfet qui **dérive** de sa nomination |
| `lib/forum/depot-pouvoirs.ts` | l'accès aux permissions et aux préfets. **Seul endroit qui écrit** dans `permissions_accordees` et `prefets` — et qui journalise chaque geste dans la même transaction |
| `lib/forum/lieux.ts` | **qui lit un lieu, qui y ouvre un sujet, qui y répond.** Et la règle qu'une section ne peut que **resserrer** ce que l'espace ouvre |
| `lib/forum/longueur.ts` | ce qui fait dix lignes — **partagé mot pour mot** entre le compteur du champ et la route. On y compte des **caractères réels**, jamais des retours à la ligne ; le balisage et le hors-RP sont retirés avant comptage |
| `lib/forum/scenes.ts` | le repère de scènes simultanées, **qui n'oppose rien** |
| `lib/ecole/portrait.ts` | **l'adresse d'un portrait**, avec l'empreinte qui la rend cachable. Le seul endroit qui la compose |
| `lib/forum/suppression.ts` | **qui peut retirer quoi** — une scène, son post — et ce qu'il en reste. Pur, sans base : l'écran et la route posent la même question |
| `lib/forum/depot.ts` | l'accès au forum. Filtre en **appelant** `peutLireLeLieu`, jamais en recopiant sa condition dans un `where` |
| `lib/forum/schema.ts` | ce qu'un titre, un post et un avertissement ont le droit d'être — **partagé mot pour mot** entre le champ et la route |
| `lib/texte.ts` | le ménage sur un texte libre écrit par un joueur, **partagé** par les corbeaux et par les posts |
| `lib/forum/mise-en-forme.ts` | **ce qu'un joueur a le droit de faire à son texte** — les outils, la palette, et les classes qu'ils produisent. Les listes de classes sont **déduites** des outils |
| `lib/forum/nettoyer-html.ts` | la **liste blanche** du balisage — `server-only`, appelée à l'enregistrement et à l'affichage. Rien d'autre ne protège du HTML d'un joueur |

**L'accès se joue à deux étages**, tous deux dans `acces.ts` :

- `peutEntrerDansLEcole` — dossier accepté et accès non suspendu. Elle ouvre
  la porte du château. **Ne pas y ajouter « et réparti »** : cela fermerait le
  bureau au nouvel arrivant, donc la note qui l'envoie au Miroir.
- `aFiniLesPremiersPas` — **plus rien à faire**, et non « tout fait ». Elle
  décide jusqu'où l'on va. Le nouvel arrivant n'a que son bureau et sa fiche.
  Une étape *sans objet* est finie elle aussi : sans cette lecture, la
  directrice resterait enfermée dans son bureau, au régime exact d'un membre
  suspendu, faute d'une cérémonie qu'elle n'a pas à passer.

---

**Une case vide ne dit rien.** La maison et la baguette portent chacune un
**état** — `NON_FAIT` / `FAIT` / `SANS_OBJET` — et c'est lui qui tranche,
jamais la présence de la valeur. Deux situations opposées se ressemblaient :

| | Ce que ça veut dire | Ce que le site fait |
| --- | --- | --- |
| `NON_FAIT` | un élève accepté | l'y envoyer : to-do, adresse ouverte |
| `FAIT` | c'est passé | afficher, et compter au tournoi |
| `SANS_OBJET` | une directrice, un professeur | **surtout pas** l'y envoyer |

`SANS_OBJET` **n'efface rien** : la maison et la baguette restent écrites, et
se rétablissent intactes. C'est ce qui permet à une joueuse de Bryggeld
nommée professeure de retrouver sa maison le jour où elle quitte le poste.

**Six questions, trois par étape, et `acces.ts` est le seul endroit qui
compare un état à une valeur.** Une page qui écrirait
`etatMaison === "SANS_OBJET"` dans son coin recopierait la règle :

| | Vraie quand |
| --- | --- |
| `aUneMaison` / `aUneBaguette` | ça s'affiche, et ça compte |
| `doitPasserAuMiroir` / `doitPasserAKaldvik` | on l'y envoie |
| `estConcerneParLeMiroir` / `estConcerneParLaBoutique` | ça le concerne, d'une façon ou d'une autre |

Retirer ou rendre une étape se fait par `modifierEtatEtape`, depuis la fiche
du membre. **`RETABLIR` ne rend jamais un état choisi** : il rend celui que la
valeur commande — une maison écrite revient à `FAIT`, une case vide à
`NON_FAIT`. Aucun état bancal ne peut donc sortir de l'écran, et la base le
refuserait de toute façon.

**Le menu est un ARBRE, mais les règles portent sur ses FEUILLES.**

`MENU` est la source : cinq entrées, dont trois ouvrent un sous-menu. Un
groupe n'a **pas d'adresse** — on ne clique pas sur « Le domaine », on
l'ouvre. `ENTREES_MENU` est la liste plate des feuilles, **déduite** de
l'arbre : deux listes tenues à la main finiraient par diverger, et l'entrée
oubliée dans la seconde serait une route sans garde.

Trois fonctions, et il faut prendre la bonne :

| | Ce qu'elle rend |
| --- | --- |
| `routeAutorisee(compte, chemin)` | une adresse s'ouvre-t-elle ? |
| `liensVisibles(compte)` | les feuilles ouvertes, **à plat** |
| `menuVisible(compte)` | **l'arbre pour l'affichage** — un groupe dont toutes les feuilles sont fermées disparaît |

Un groupe vide ne se grise pas : il **disparaît**. Un chapeau qui n'ouvre sur
rien est pire qu'une absence — on clique, il se déplie, et il est vide.

**Ajouter une entrée** = une ligne dans `MENU`. Ajouter un lieu aux archives =
une ligne dans ses `liens`. **Trois drapeaux**, et l'oubli de chacun va dans le
sens de la fermeture :

- `pendantBannissement` — ouverte au membre suspendu
- `avantPremiersPas` — ouverte au nouvel arrivant
- `exigeUneMaison` — fermée à qui n'a pas de maison qui s'affiche. C'est ce qui
  fait que « Ma maison » n'existe ni pour l'élève que le Miroir attend, ni pour
  la directrice qu'il ne concerne pas. La question n'est pas posée là :
  `routeAutorisee` appelle `aUneMaison`.

**La pastille remonte sur le groupe.** `compteDe(entree, compteurs)` rend le
compte d'une feuille, ou **la somme des feuilles** d'un groupe. Elle vit dans
`ecole/menu.ts` et non dans le bandeau : c'est une règle — sans elle, un
corbeau reçu se cache derrière un sous-menu fermé et on le rate — et une règle
enfouie dans un composant ne se teste pas.

Une route de l'école **sans entrée au bandeau** se déclare dans
`ROUTES_HORS_MENU` — c'est le cas de la boutique et de la Cérémonie.
L'oublier, c'est la laisser sans garde côté middleware.

**L'année ne s'affiche jamais en direct.** Un membre peut porter un titre au
château — « Directrice », « Professeur d'alchimie » — qui **remplace** l'année
partout où elle s'affiche. Une seule fonction tranche entre les deux :

- `libellePlace(fonction, roleAffiche)` — l'année, **ou** le rôle qui la
  masque. C'est elle qu'appellent les quatre endroits d'affichage : Ma fiche,
  Mon bureau, la ligne du membre et son détail. Le rôle n'y est **pas
  facultatif** : l'oublier est une erreur de compilation, pas une page qui
  annonce tranquillement la directrice en première année.
- `libelleAnnee(fonction)` — l'année seule, sans substitution. Réservée à
  trois usages : la liste déroulante, l'« année masquée » du détail côté
  administration, et le journal. Elle sait encore relire `PROFESSEUR` et
  `DIRECTION`, retirés de l'enum mais gravés dans d'anciennes entrées.

Quand un rôle s'affiche, **le libellé suit la valeur** : « Rôle — Directrice »
et non « Année — Directrice », qui se contredirait.

**Les deux premiers pas ont chacun leur page hors bandeau**, et chacune se
referme sur son propre prédicat plutôt que sur une fermeture de route — qui
produirait une redirection en boucle :

- `/bjornstav` se referme sur `doitPasserAKaldvik` → renvoi au bureau
- `/ceremonie` se referme sur `doitPasserAuMiroir` → renvoi au bureau, **et**
  exige que la baguette ne soit plus attendue → renvoi à Kaldvik

Ces prédicats-là referment l'adresse pour **deux raisons opposées** : c'est
déjà fait, ou ça ne concerne pas le compte. Les routes d'API distinguent les
deux dans leur réponse — **409** pour un rejeu, **403** pour un compte non
concerné. Répondre « le Miroir a déjà parlé » à une directrice qu'il n'a
jamais lue serait faux, et lui laisserait croire qu'elle a une maison.

Ces deux gardes-là sont refaites **en entier** dans les routes d'API
correspondantes. Une adresse de page se contourne en la tapant ; une route
d'API se contourne en l'appelant.

---

## La Tour aux Corbeaux

La messagerie entre joueurs. **Hors RP** : aucune règle d'écriture ne s'y
applique — pas de minimum de lignes, pas d'avertissement de contenu, pas de
balise, et **aucun point**. La mise en scène tient tout entière dans le
vocabulaire : on envoie un corbeau, jamais un message.

Entrée du bandeau **« Les Corbeaux »**, titre de page **« La Tour aux
Corbeaux »**. Route `/corbeaux`, plus `/corbeaux/nouveau` et
`/corbeaux/administration`, qui n'ont pas besoin de figurer dans
`ROUTES_HORS_MENU` — `routeAutorisee` reconnaît déjà tout ce qui commence par
`/corbeaux/`.

**Elle s'ouvre à trois degrés, et `porteeDeLaTour` est seule à trancher :**

| | Ce que le compte voit |
| --- | --- |
| `TOUT` | dossier accepté, accès en règle |
| `ADMINISTRATION_SEULE` | **suspendu** : le fil du staff, et rien d'autre. Ses conversations entre joueurs l'attendent sans s'afficher |
| `RIEN` | dossier en attente, à corriger ou refusé |

L'entrée du menu porte **les deux drapeaux** — `pendantBannissement` et
`avantPremiersPas` —, et c'est une exception raisonnée à « le bureau et la
fiche, rien d'autre » : l'article 8.5 donne quinze jours pour contester une
sanction par message privé. La fermer supprimerait ce recours pour la seule
personne à qui il sert. Un drapeau de menu ne sait dire qu'ouvert ou fermé ;
la nuance vit dans `droits.ts`.

Elle ne regarde **ni la maison ni la baguette** : un nouvel arrivant écrit dès
le premier jour, et c'est le moment où il en a le plus besoin.

**Le blocage ne se voit pas de la même façon des deux côtés, et c'est tout le
dispositif :**

| | Ce qu'il voit |
| --- | --- |
| celui qui a bloqué | le fil est clos, on le lui dit |
| **celui qui est bloqué** | **rien ne change** — il écrit, son corbeau part, il le relit dans son fil |

`PART_DANS_LE_VIDE` doit rester **indiscernable de `PART`** : la route rend le
même code, les mêmes champs, le même corps. Un refus explicite déclenche
l'escalade, qui est le vrai risque — un second compte, un message ailleurs.
`route.test.ts` compare les deux réponses octet pour octet ; `droits.test.ts`
vérifie que le verdict ne porte aucun champ de plus. **Ne jamais ajouter
`|| ilMaBloque` à `conversationClosePourMoi` « par symétrie ».**

**Une seule table porte deux règles** — `messages_masques`, avec sa raison :

- `SUPPRIME_PAR_SOI` — j'ai retiré ce corbeau de **ma** vue. La copie de
  l'autre est intacte. C'est ce qui protège un membre harcelé dont l'agresseur
  voudrait effacer ses traces, et **il faut le dire au moment du geste** :
  quelqu'un qui croit avoir effacé des deux côtés se trompe.
- `BLOQUE` — le corbeau est écrit, puis masqué pour le destinataire **dans la
  même transaction**. Il ne doit exister aucun instant où il serait visible.

**Le staff ne lit aucune conversation privée.** Il n'existe aucun écran
d'administration qui affiche une boîte, aucune recherche, aucun export. Son
seul accès passe par `Signalement.contexte` — une copie figée du message visé
et d'une dizaine autour, recopiée au clic. Deux conséquences : le message
survit à sa suppression, à celle de son auteur et à celle du fil ; et **l'écran
de modération n'a aucun besoin de lire `Message`**.

`etancheite.test.ts` **relit le code source de `src/app/admin/`** et échoue si
un fichier y touche aux conversations — même procédé que `role-affiche.test.ts`.
La règle cesse d'être une intention à tenir. Vérifié : y ajouter
`prisma.message` fait tomber le test.

**Retirer une conversation se propose des deux côtés** — au bout de sa ligne
dans la liste, et dans l'en-tête du fil. Le geste existait côté serveur depuis
l'ouverture de la Tour, et la route `masquages` acceptait déjà un
`conversationId` : **aucun écran ne l'appelait**. Il ne manquait que le bouton.

`BoutonRetirerFil` porte les deux formes : une corbeille au bout d'une ligne,
un mot — « Retirer » — dans l'en-tête, à côté de « Bloquer » dont il reprend
l'usage. Le nom accessible, lui, est entier : « Retirer la conversation avec
Sigrid de ma vue » — dans une liste de trente fils, « cette conversation » ne
dit pas laquelle à qui écoute.

**La carte d'une ligne de la liste est portée par le `<li>`, plus par le
lien** : un bouton ne s'imbrique pas dans un lien, c'est invalide et le
clavier ne s'y retrouve pas.

Le retrait est proposé **même sur le fil de l'administration et sur un fil
clos**, à la différence du blocage : retirer de sa vue n'engage que soi.

**Y réécrire soi-même ramène le fil entier** — `envoyerCorbeau` remet
`masqueeLe` à nul pour l'expéditeur. « Vidé de ce qui précède » ne vaut que
pour le retour de l'AUTRE. Les deux comportements sont éprouvés en base.

**Bloquer se propose depuis la conversation**, et la liste des personnes
bloquées vit dans la Tour — `/corbeaux/bloques` —, faute de « réglages du
compte » sur ce site. Elle ira les rejoindre le jour où il y en aura : elle
n'a aucune logique propre. **Débloquer ne ramène rien** : les corbeaux partis
dans le vide ont été masqués à leur arrivée, et le restent.

**L'anti-démarchage (art. 3.6) ne pèse que sur les fils NOUVEAUX.** Répondre
n'est jamais limité, écrire à l'administration non plus — la plafonner
fermerait le recours de l'article 8.5 à celui qui en a besoin, le jour où il
en a besoin.

| | par heure | par jour |
| --- | --- | --- |
| dossier accepté depuis moins de 7 jours | **3** | **10** |
| au-delà | **10** | **40** |

L'ancienneté se compte depuis **l'acceptation du dossier** (`Eleve.decideLe`),
jamais depuis la création du compte : quelqu'un dont la candidature a mis trois
semaines à être lue est un nouveau venu le jour où on lui ouvre la porte.

**`ATTENDRE` n'est pas un refus**, et ne se range donc pas dans `RaisonRefus` :
la route répond **429**, jamais 403, et donne le délai en clair. Un corbeau
refusé ne partira jamais ; celui-ci partira dans un quart d'heure. Confondre
les deux ferait lire « vous n'avez pas le droit » là où il faut lire « pas si
vite » — et le joueur écrirait à l'administration pour comprendre ce qu'il a
cassé. Deux plafonds qui bloquent ensemble : c'est **le plus long** qui vaut.

Le calcul est **pur** (`etatDuPlafond`, dans `droits.ts`) : il reçoit les
ouvertures et l'instant, ne lit ni horloge ni base, et se teste donc sur une
journée entière sans attendre. Deux ouvertures simultanées peuvent passer
toutes les deux — assumé : ce plafond ralentit un démarcheur, il ne garde pas
une porte.

**Aucune fonction ne répond à « qui m'a bloqué ? »**, et il ne faut jamais en
écrire une. `listerBlocages` ne va que dans un sens ; `blocages/route.test.ts`
relit le code source du dépôt et échoue si une requête sur les blocages part
de `bloqueId`. Vérifié : y ajouter un `quiMaBloque` fait tomber le test.

**Un personnage peut être de n'importe quel genre, et `Correspondant` ne le
porte pas.** Les textes qui parlent de quelqu'un passent donc par **« cette
personne »** — féminin en français — plutôt que d'accorder au jugé : « cette
personne ne pourra plus vous écrire », et non « elle ne pourra plus ». Un
accord posé en dur est faux une fois sur deux.

**Une date ne se colle pas dans une phrase.** `journeeDe` rend « Aujourd'hui »,
titre d'un groupe de corbeaux ; `quandDansUnePhrase` rend « aujourd'hui » ou
« le 12 août », avec la préposition quand il en faut une. Le premier donnait
« Blocage posé le Aujourd'hui ».

**Un fil dont AUCUN corbeau ne m'est visible ne figure pas dans ma liste**, et
cette condition n'est pas décorative. Une personne bloquée qui ouvre un fil
**neuf** voit bien son corbeau masqué à l'arrivée — mais la conversation, elle,
est créée, avec une participation pour le bloqueur. Sans ce filtre, il voyait
surgir dans sa liste un fil vide au nom de quelqu'un qu'il venait de bloquer :
exactement ce qu'il avait demandé à ne plus voir. Le cas ne saute pas aux yeux
et n'a été trouvé qu'en le jouant sur la vraie base.

**Retirer ne retire que de SA vue.** Un corbeau, un fil entier : la copie de
l'autre reste intacte, et l'interface le dit **au moment du geste**. La route
s'appelle `masquages` et répond à un `POST`, jamais à un `DELETE` — un verbe
qui promettrait une suppression mentirait sur ce qui se passe.

**Le signalement se fait en un clic**, motif facultatif. Un champ vide, absent
ou fait d'espaces vaut `null`, jamais une erreur : quelqu'un qui subit des
messages pénibles n'a pas à rédiger un dossier pour être entendu.

Le contexte est recopié **au moment du clic**, tel que le signalant le voit —
cinq corbeaux avant, celui qui est visé, cinq après. Ce qu'il a retiré de sa
vue n'y figure pas : c'est lui qui transmet, il ne transmet que ce qu'il voit.
Les corbeaux **postérieurs** voyagent aussi, et ce n'est pas un détail : une
plaisanterie entre amis et une menace se ressemblent, hors de leur suite.

La copie ne porte **ni identifiant de fil ni identifiant de corbeau**. La
modération n'a pas le droit d'ouvrir la conversation ; elle n'en a pas non
plus le moyen.

**`lib/corbeaux/moderation.ts` est séparé de `depot.ts`, et cette séparation
est la mesure elle-même.** Il ne nomme qu'une table — `signalement` — et
n'emprunte à l'autre qu'un **type**, effacé à la compilation. Il n'existe donc
aucun chemin de `/admin` vers une conversation : pas une requête qu'on
s'interdirait d'écrire, un chemin qui n'existe pas.

`etancheite.test.ts` le vérifie de trois façons : la zone d'administration ne
nomme aucune table interdite, `moderation.ts` ne nomme que `signalement`, et
son import du dépôt est bien un `import type`. **Les trois ont été éprouvés en
introduisant la faute** — chacun tombe.

Si un besoin d'accès plus large se présente un jour, **c'est une décision du
joueur**, pas un ajout de commodité. Le dire au lieu de l'écrire.

**Le courrier du château a son propre écran**, `/admin/courrier`, séparé des
signalements — ce ne sont pas les mêmes gestes, et mélanger une question
anodine avec un signalement de harcèlement dans la même file est le meilleur
moyen de traiter les deux mal.

Il fallait le construire : la règle « le staff ne lit pas les conversations
privées » avait été appliquée si strictement qu'elle bloquait aussi **le fil
qui lui est explicitement adressé**. Un membre écrivait, son corbeau partait
en base, et personne ne pouvait le lire ni y répondre.

`lib/corbeaux/courrier.ts` touche donc bien aux conversations et aux messages
— il le faut. Ce qui l'empêche de déborder n'est pas l'absence de requête mais
le filtre : **chaque lecture écrit `AVEC_ADMINISTRATION` en toutes lettres**,
jamais factorisé dans une constante, parce que le sortir des `where` le
rendrait invisible. `etancheite.test.ts` découpe le fichier requête par requête
et échoue si une seule l'oublie ; un essai en base vérifie qu'on ne peut ni
ouvrir ni écrire dans un fil entre joueurs en lui passant son identifiant.

**Une réponse du château n'a pas d'auteur**, et c'est ce qui la signe : la zone
d'administration n'a pas de comptes distincts, il n'y a personne à nommer.
Dans un fil de courrier il n'y a que deux interlocuteurs — un corbeau sans
auteur ne peut venir que du second. Ailleurs, le même `auteurId` nul veut dire
« un membre qui n'est plus là » : le fil décide du libellé, jamais la colonne
seule.

**Le compteur du bandeau vit par lui-même, et il le faut.** Un layout d'App
Router n'est pas rendu à nouveau quand on navigue entre deux pages du même
segment — c'est ce qui le rend rapide, et c'est aussi ce qui figeait la
pastille sur la valeur du premier chargement : on lisait ses corbeaux, elle
restait là. `useNonLus` la tient à jour de deux façons — l'**événement**
`ravenshallow:corbeaux-lus`, pour l'immédiat, et l'interrogation périodique,
pour ce qui arrive. Un événement de fenêtre plutôt qu'un contexte React :
le bandeau vit dans un layout, les fils dans des pages, et les deux ne
partagent aucun arbre où poser un fournisseur.

`/api/corbeaux/non-lus` existe pour ça, à côté de `/api/corbeaux` qui rend le
même nombre : celle-là rend aussi les extraits de trente fils, et le bandeau
est sur **toutes** les pages. Des fragments de conversations n'ont pas à
traverser le réseau pour afficher un chiffre.

**Le compteur ne promet que ce qui est ouvrable.** `compterNonLus` filtre sur
la portée, comme `listerConversations` : un membre suspendu qui verrait « 3 »
sans rien trouver derrière serait plus mal servi que sans pastille du tout.
Les deux requêtes doivent s'accorder — sinon le bandeau et la page se
contredisent à l'écran.

**Le rafraîchissement est une interrogation périodique, et rien d'autre.**
`useRafraichissement` : quinze secondes, **arrêt quand l'onglet est caché**,
rattrapage au retour, jamais deux appels en même temps. Pas de WebSocket —
et le jour où il en faudrait un, c'est ce fichier-là qui changerait, seul.

---

## Les pouvoirs

Les droits d'un membre viennent de **trois sources qui ne se recouvrent
jamais**, et les confondre est l'erreur à ne pas commettre :

| | Ce que c'est | Ce que ça ouvre |
| --- | --- | --- |
| `Utilisateur.statutAcces` | l'accès au site | l'école, ou le cul-de-sac |
| `Utilisateur.role` | le rôle technique | le staff **intervient partout** sur le forum |
| `permissions_accordees` + `prefets` | des charges à la carte | une permission précise, sur une maison ou sur tout le forum |
| `Eleve.roleAffiche` | **rien du tout** | un libellé à l'écran, et c'est tout |

`role` dormait depuis la première migration — déclaré, jamais lu nulle part.
Le lot des pouvoirs l'a branché : `MODERATEUR` et `ADMIN` sont le staff.
`ROLE_MODIFIE` est **son propre événement de journal**, distinct de
`ACCES_MODIFIE` : suspendre un compte et le faire modérateur ne se lisent pas
de la même façon, et le journal affichait sinon « Accès modifié : MODERATEUR ».

**Cinq permissions, et la sixième n'existe pas.** Deux portent sur une maison
— écrire ses annonces, lire ses espaces réservés —, trois sur tout le forum :
clore une scène, épingler un sujet, verrouiller une section.

**Aucune ne touche à la Tour aux Corbeaux**, sous aucune forme, pas même
désactivée. `pouvoirs.test.ts` compte les valeurs de la liste et relit le code
source de `lib/corbeaux/` : la messagerie ne sait pas ce qu'est une permission,
et il n'existe aucun chemin de l'une vers l'autre. **Aucune ne permet non plus
d'en attribuer** — seule la zone d'administration accorde, et un test relit
`src/app/` pour s'en assurer. Sans lui, il suffirait d'un jour de commodité
pour qu'un professeur se promeuve lui-même.

**Une ligne par maison, jamais un `null` qui voudrait dire « toutes ».** Les
quatre maisons, c'est quatre lignes, posées ensemble et retirées ensemble. Le
raccourci inverse ferait porter deux sens à la même case, et c'est exactement
ce que `EtatEtape` a été inventé pour éviter.

**Le droit du préfet DÉRIVE de sa nomination**, et ne crée aucune ligne de
permission. C'est ce qui fait que le démettre reprend tout (art. 13.5) : une
permission posée à la nomination lui survivrait, et personne ne verrait
pourquoi il écrit encore. Plusieurs préfets par maison ; **la maison n'est pas
contrainte à être la sienne** — décision du joueur, non un oubli.

**Chaque geste laisse sa trace au journal du membre, dans la même
transaction.** C'est indispensable : le retrait efface la ligne, et sans le
journal il ne resterait rien du tout. `valeurApres` porte
`ANNONCES_MAISON:KALDRAFN` — la permission **et** la maison : « pouvoir
retiré » sans la maison ne se relit pas six mois plus tard.

**Reposer un pouvoir déjà détenu n'est pas un événement** : ni ligne, ni entrée
au journal. `accorderPermission` compare avant d'écrire plutôt que de deviner
après coup ce que l'insertion a posé — dans une transaction, toutes les lignes
portent le même instant, et un tri par date ne les départage pas.

`/admin/pouvoirs` répond à « qui peut clore une scène ? », la fiche du membre à
« que peut Sigrid ? ». Les deux existent parce que ce ne sont pas la même
question, et qu'une permission accordée en juin et oubliée en décembre ne se
voit que sur la première.

---

## Le forum

```
espace  →  section  →  section (facultative)  →  sujet  →  post
```

**Une seule table pour les sections et les sous-sections.** « L'école » a
besoin de trois étages — l'aile, la pièce, le sujet ; « Le monde des non-mages »
de deux. La base tient les deux niveaux et refuse le troisième.

**Trois espaces, un seul moteur.** Ce qui les distingue tient dans des
colonnes, jamais dans du code : construire trois fois le même forum serait le
meilleur moyen d'en avoir trois qui divergent.

| | `domaine` | `non-mages` | `maison` |
| --- | --- | --- | --- |
| lignes minimum | **10** (art. 12.2) | aucune | aucune |
| qui ouvre un sujet | tout membre | tout membre | préfets et permission |
| qui répond | tout membre | tout membre | membres de la maison |
| points | **oui** | non | non |
| compte les scènes | **oui** | non | non |
| visibilité | tous | tous | **sa maison** |

**Une section ne peut que RESSERRER ce que l'espace ouvre.** L'année, la
visibilité et l'ouverture se résolvent en prenant la **plus stricte** des deux
valeurs — jamais celle de la section aveuglément. Une surcharge qui ouvrirait
une porte que l'espace ferme serait une porte dérobée, invisible à qui lit
l'espace.

**Lire et écrire ne se décident pas de la même façon**, et c'est le principe :

- **presque tout est lisible.** Un première année lit ce qui se joue dans les
  souterrains, un Bryggeld lit le dortoir de Nattorm, un lieu définitivement
  clos garde ses scènes visibles. Seule la visibilité `MAISON` referme.
- **l'écriture porte les verrous** : l'année atteinte, la maison du lieu, la
  permission d'annonce, le lieu ouvert.

**L'année d'un sujet est figée à son ouverture, et répondre la relit — pas
celle du lieu.** C'est toute la promesse « une scène en cours ne se ferme pas
si les règles changent ». Relire la règle du lieu dans `peutRepondre`
refermerait les scènes en cours le jour où l'on durcit un couloir.

**Le redoublant ne perd rien**, et il n'y a rien à écrire pour l'obtenir : son
année ne bouge pas (art. 18.5), donc son rang non plus. `rangAnnee` dans
`dossier/etats.ts` est le seul endroit qui compare deux années.

### « Sur convocation » est une règle de PIÈCE

`quiOuvreUnSujet` vit sur l'espace **et** sur la section. Le manque n'est
apparu qu'en posant le contenu — c'est exactement pour ça que le contenu vient
après le moteur.

`STAFF_SEULEMENT` dit « sur convocation » en toutes lettres : le staff ouvre,
**l'élève convoqué répond**. Ne pas le confondre avec `ouverte: false`, qui
ferme le lieu à tout le monde et ferait taire le convoqué. Et ne pas détourner
`DETENTEUR_PERMISSION` sans maison : le refus annoncerait « il faut une
permission » sans pouvoir dire laquelle.

### L'école : cinq sections, vingt pièces

Posées par `20260826130000_ecole`. **Les lieux vivent en base**, jamais dans
le code : une description se corrige sans toucher au moteur — par une
migration tout de même, sinon la correction est vraie aujourd'hui et perdue
le jour où la base serait reconstruite.

**Ces vingt textes ne sont pas du décor : ils sont le plan intérieur du
château.** La bible le dit deux fois, et il a fallu les rapprocher —
« inventer une aile du château […] exige l'accord d'un administrateur »
(art. 12.4), et, parmi ses points à approfondir, « plan intérieur du château,
aile par aile ». La relecture que le joueur en fait, aile par aile, **est
l'accord que sa propre bible réclame**, et elle comble l'un de ses manques.
Ce qui en sort fait autorité pour le RP.

D'où la méthode : une aile à la fois, chaque texte confronté à la bible avant
d'être montré, et **une migration par correction**. **La relecture des cinq
ailes est terminée le 27 août 2026** — cinq corrections, toutes du même
genre : un texte qui affirme quelque chose que la source contredit, ou qui
invente sans le dire.

| | Ce qui n'allait pas |
| --- | --- |
| La Salle de Banquet | contredisait la Cérémonie du Miroir, déjà en ligne |
| La galerie des vents | posait l'interdit sans sa raison — les Draugr |
| La Réserve | affirmait que rien d'interdit n'y dort, alors que la bible y place **l'un des trois seuls signes de la magie noire** (art. 13.3) |
| Les souterrains | récitaient l'article 13.1, **et désignaient ainsi l'endroit** |
| L'aile nord | regardait le massif « par-dessus la forêt » — la carte dit **le lac** |

**Celle de l'aile nord est la plus instructive : elle ne se voyait pas en
lisant.** Il fallait ouvrir la carte. L'article 12.4 dit que « toute
description de lieu en RP doit s'y conformer », et la seule façon de le
vérifier est de **la regarder** — `public/crests/carte.jpg` —, jamais de se
fier au nom des lieux. Sa rose des vents met le nord en haut, le château à
l'est sur la falaise, la Forêt Sombre à l'ouest, le Lac entre le château et
les Hauts Plateaux de Givre, et Kaldvik au sud-ouest au pied du chemin
escarpé.

**Trois contrôles à refaire après toute écriture de lieu**, et ils sont
mécaniques : aucun texte ne nomme la grotte ni le sceau ; les couleurs des
quatre dortoirs sont celles de la bible, mot pour mot ; aucun texte ne
s'adresse au joueur plutôt qu'au monde. Au 27 août 2026 : 0, conformes, et un
seul écart — **la salle de duel**, dont la dernière phrase est un conseil au
joueur. Signalé, **gardé tel quel par le joueur**. Ne pas le « corriger » de
sa propre initiative.

**Ne jamais nommer la chose dans une description de lieu.** Les Draugr, ce que
le sceau retient, l'ouvrage qui ne devrait pas être là : une description est
un document que les élèves lisent. Elle donne ce qu'un élève voit — des
lumières basses, un mot posé seul en fin de phrase —, jamais le nom.

Trois choses arbitrées avant de les écrire, et inscrites dans la migration :

- **« La Grande Salle » n'existe pas, et ne doit pas revenir.** J'avais proposé
  ce nom pour la pièce ; le joueur l'a retiré le 26 août 2026 — « la grande
  salle c'est Harry Potter ». La bible range la ressemblance avec les univers
  de magie existants parmi les **interdits** (§13), et le vocabulaire suit la
  même règle que les visuels. La pièce s'appelle **La Salle de Banquet**, et
  ce nom ne se confond avec rien. **Le nom, lui, ne bouge plus.**

  Sa description, en revanche, est revenue en arrière le 27 août 2026
  (`20260827100000_salle_de_banquet_accordee`). Elle avait perdu « Quatre
  longues tables » comme étant l'image qu'on fuit — mais le motif visait à
  côté : **le texte de la Cérémonie du Miroir contient déjà les quatre tables
  et le ciel au plafond**, et il est en ligne depuis des semaines. Seule la
  description de la pièce les évitait, si bien que la salle décrite n'était
  pas celle qu'on traverse le soir du Miroir. Décision du joueur : aligner la
  pièce sur la Cérémonie, qui ne bouge pas d'une virgule. **Deux textes qui se
  contredisent coûtent plus cher qu'une image reconnaissable.**

  Le ciel y reste **exceptionnel** — une nuit par an —, et ce n'est pas un
  adoucissement : la Cérémonie le dit elle-même, « ce n'est pas le ciel du
  dehors, c'est celui que le château a décidé de vous montrer ce soir ». Une
  description permanente qui l'annoncerait tous les jours la contredirait.

  Au passage, « la veillée des braises » a disparu : je l'avais inventée, elle
  n'est nulle part dans la bible. **Une invention glissée dans une description
  de lieu devient du lore par la porte de service** — c'est le risque de ces
  vingt textes, et la raison pour laquelle le joueur les relit un par un.
- **Les ailes est et ouest ont été inversées** par rapport à la première
  liste : la carte fait autorité (bible §2, art. 12.4), et sa rose des vents
  met la mer à l'**est**, la forêt à l'**ouest**. Les appariements maison/vue
  étaient justes et n'ont pas bougé.
- **Les salles de cours n'y sont pas**, à dessein : chantier à part.

Deux descriptions demandent de la prudence :

- **Les souterrains ne nomment plus rien du tout.** Ils rappelaient l'article
  13.1 en toutes lettres ; le joueur l'a retiré le 27 août 2026, et sa
  décision vaut pour les vingt-cinq textes : **une description de lieu ne
  nomme ni la grotte ni le sceau, pas même pour en interdire l'approche.**

  Deux raisons, et la seconde est la vraie. Le texte n'était plus une pièce
  mais un panneau d'interdiction, quand les seize autres décrivent un lieu. Et
  surtout il **désignait l'endroit** : rappeler la règle dans cette pièce-là,
  c'est dire où elle s'applique, donc où regarder. **Un interdit posé sur une
  porte est une flèche.**

  La règle n'en est pas affaiblie : l'article 13.1 vit dans le règlement,
  approuvé à l'inscription, et oblige sans avoir besoin d'être répété. Le
  remède retenu n'est pas le mystère mais **l'ennui** — des casiers vides, de
  la poussière, rien à y chercher. Une pièce intrigante appelle ; une pièce
  terne est le meilleur des verrous.

  Vérifié le 27 août 2026 : **zéro des vingt-cinq textes** ne nomme l'un ou
  l'autre. Le vérifier de nouveau après toute écriture de lieu.
- **La Tour aux Corbeaux** est ce lieu-ci **et** le nom de la messagerie.
  C'est voulu. Sa description reste dans le monde : elle dit que tout le monde
  y monte, elle ne parle pas du site.

**Un lieu verrouillé s'affiche, avec sa condition écrite** — jamais caché,
jamais signalé par la seule couleur : `CartouchePiece` rend la raison en
toutes lettres, précédée hors écran de « Écriture verrouillée : », et rappelle
à chaque fois que **la lecture reste ouverte**.

### Écrire : ce que la route refait, et pourquoi

**Le dépôt appelle la couture lui-même.** `ouvrirSujet` et `repondre` relisent
le lieu, résolvent ses règles, interrogent `lieux.ts`, puis valident le texte
contre le minimum de l'espace — la route ne fait que traduire le résultat en
code HTTP. Une seule porte, qu'aucune route ne contourne : c'est le parti pris
d'`envoyerCorbeau`.

**403 et 422 ne disent pas la même chose**, et les confondre ferait lire
« vous n'avez pas le droit » à quelqu'un qui a seulement écrit trois lignes :

| | Ce que ça veut dire |
| --- | --- |
| **403** | le lieu se refuse à ce compte — année, maison, convocation, fermé |
| **422** | il a le droit, mais pas comme ça — titre vide, post trop court |
| **404** | le lieu ou la scène n'existent pas, **ou** ne sont pas lisibles par lui |

Le 404 couvre les deux derniers cas exprès : « il existe mais pas pour vous »
se lit comme une confirmation. Même choix que dans la Tour.

**Le compteur de lignes lit le même fichier que la route.** `forum/longueur.ts`
est appelé par le champ à chaque frappe et par le dépôt avant d'écrire : deux
comptages qui divergent, c'est un joueur qui voit « 10 » à l'écran et se fait
refuser son post. Le hors-RP `[HRP]` est retiré **avant** comptage des deux
côtés — et **conservé** dans le texte : on ne compte pas avec, on ne l'efface
pas pour autant.

**On y compte des caractères réels, et l'on affiche des lignes.** Le comptage
par retours à la ligne se trompait **dans les deux sens**, et le second défaut
était le pire :

| Ce qu'un joueur écrivait | L'ancien compteur |
| --- | --- |
| « a » puis un retour, dix fois | **dix lignes, accepté** — l'unique post en base en était un : dix lignes, vingt-six signes |
| un post de deux mille signes en **trois paragraphes** | **trois lignes, refusé** |

La règle **punissait la prose** et récompensait le retour chariot. Depuis le
27 août 2026 : `texteQuiCompte` retire le balisage, décode les entités, retire
le hors-RP, réduit les blancs — et l'on compte ce qui reste.

- **Une ligne vaut 80 caractères**, donc dix lignes valent 800. Ce nombre-là
  vit dans `config/ecriture.json`, **pas dans le code** : il faudra l'ajuster
  après avoir vu de vrais posts. Le **nombre de lignes**, lui, reste dans le
  code — c'est l'article 12.2, une règle du joueur et non un réglage.
- **Le joueur ne lit jamais un nombre de signes.** « 6 lignes sur 10 », comme
  le règlement le dit. L'affichage arrondit **vers le bas** et le décompte de
  ce qui manque **vers le haut** : jamais « 10 lignes » sur un post qui va
  être refusé, jamais « 0 ligne à écrire » sur un post encore trop court.
- **Le verdict ne passe pas par l'arrondi.** `respecteLeMinimum` compare des
  caractères ; comparer les lignes affichées ferait refuser un post à 800
  signes pile le jour où l'on changerait la largeur d'une ligne.
- **Une barre a été ajoutée sous le compteur**, et ce n'est pas décoratif : la
  phrase ne change plus que toutes les quatre-vingts frappes, et sans elle un
  joueur qui écrit croirait le compteur bloqué. Elle est `aria-hidden` — la
  phrase dit déjà tout à qui écoute.

⚠️ **`texteQuiCompte` ne protège de rien.** Retirer des balises pour compter
n'est pas nettoyer. Ne jamais s'en servir pour rendre un texte sûr.

**Un post masqué n'est pas supprimé** (art. 19.3). Trois vues, et les trois
comptent : son auteur voit le texte, le motif et la date limite — c'est lui
qui corrige ; le staff voit le texte et le motif ; les autres voient une
ligne. Montrer le texte à tous viderait la mesure de son sens, le cacher à son
auteur l'empêcherait de le reprendre.

**Le joueur est prévenu par un corbeau du château**, et il fallait pour cela
que le château sache écrire le premier : `ecrireAuMembre` crée le fil
`AVEC_ADMINISTRATION` s'il n'existe pas, **avec sa participation dans la même
écriture** — sans elle, la lettre n'arriverait dans aucune boîte. Le corbeau
n'a pas d'auteur, et c'est ce qui le signe. Un envoi raté ne défait pas le
masquage : il est rapporté, comme pour les courriels.

**Masquer relève du staff, et d'aucune permission attribuable.** Ce n'est pas
un pouvoir qu'on accorde à la carte — ne pas l'ajouter à `Permission`.

### L'avatar dans les scènes

Chaque post porte **le portrait de son auteur et le blason de sa maison** — le
premier dit qui parle, le second rend une scène à quatre lisible d'un coup
d'œil. Décision du joueur, 27 août 2026 : les deux, jamais l'un sans l'autre.

⚠️ **Les portraits sont stockés en base, en texte encodé** — celui de la
directrice pèse 207 Ko. Le schéma prétend le contraire (« stockée sur Vercel
Blob ») : **c'est faux**, et ça ne l'a jamais été. Tant qu'un portrait ne
s'affichait que sur sa propre fiche, cela ne se voyait pas.

Dans une scène, cela devenait un demi-méga recopié **dans chaque page, à
chaque chargement**, sans que le navigateur puisse rien garder. D'où
`/api/portraits/[id]` : le portrait redevient une adresse, téléchargée une
fois par personne et gardée un an.

- **L'adresse porte une empreinte** — `?v=<majLe>` — composée par
  `adressePortrait`, seul endroit qui la connaisse. Une fiche modifiée change
  d'adresse : le cache d'hier ne peut pas resservir un portrait d'avant, et
  c'est ce qui permet de le déclarer `immutable` sans jamais mentir.
- **Un `<img>` ordinaire, pas `next/image`.** L'optimiseur va chercher la
  source **depuis le serveur, sans les cookies du lecteur**, et se ferait
  refuser par une route qui exige une session. Ne pas le « corriger ».
- **La route est le premier pas vers un stockage externe.** Le jour où les
  portraits partiront sur Vercel Blob, ce fichier et `portrait.ts` changeront
  — et rien d'autre.

---

### Reprendre son post — art. 6.4

**Sans limite de temps**, décision du joueur du 27 août 2026. Ce qu'un joueur
a écrit est à lui, et une coquille se corrige six mois plus tard. Ce qui
protège les autres n'est pas un délai mais **la marque « modifié le »**,
visible de tous : on voit qu'un texte a bougé depuis qu'on y a répondu.

La colonne `modifieLe` existait depuis la première migration du forum, déjà
transportée jusqu'à l'écran — **rien ne l'écrivait ni ne l'affichait**.

- **Le champ de reprise est le même que celui de la publication** —
  `ChampPost`, donc le même éditeur, la même barre, le même compteur. Deux
  champs qui divergeraient accepteraient deux textes différents, et la route
  trancherait trop tard.
- **Le texte repasse par `validerPost`** : même nettoyage, même minimum de
  lignes, relu sur le lieu. Une reprise ne peut ni passer sous le seuil, ni
  glisser ce que la publication aurait refusé.
- ⚠️ **Modifier ne démasque pas.** Un post masqué pour correction (art. 19.3)
  le reste après correction : c'est le staff qui rouvre, après avoir relu.
  Sinon il suffirait de changer une virgule pour annuler la mesure.
- **Le staff ne modifie rien.** Il masque, et c'est l'auteur qui reprend.
  Réécrire le texte d'un joueur à sa place serait lui faire dire ce qu'il n'a
  pas dit.

---

### Retirer une scène, retirer son post — art. 2.4 et 6.4

**Rien n'est effacé, jamais.** Une scène retirée sort des listes et rend son
adresse introuvable — la page « Ce couloir ne mène nulle part » —, et reste
entière en base. Vaut pour l'auteur comme pour le staff : décision du joueur,
27 août 2026. Un clic malheureux se rattrape, et il n'y a qu'un chemin de code
à vérifier. Le joueur, lui, ne voit aucune différence : pour lui, c'est
supprimé, et le vocabulaire de l'écran le dit ainsi.

**La règle vient du règlement**, et concilie deux articles : le 2.4 conserve
les écrits partagés « pour ne pas mutiler les histoires des autres », le 6.4
laisse chacun propriétaire de ses textes. D'où : **on retire ce qui n'est qu'à
soi ; dès qu'un autre a écrit, on ne peut plus que clore.**

| Qui | Quand | Ce qu'il peut |
| --- | --- | --- |
| L'auteur de la scène | seul à y avoir écrit | **retirer** |
| L'auteur de la scène | un autre a écrit | **clore**, et plus rien d'autre |
| L'auteur d'un post | rien après lui | **retirer**, sans laisser de vide |
| L'auteur d'un post | on a répondu après | **retirer**, sa place reste |
| Le staff | toujours | **retirer**, motif obligatoire, trace au journal, corbeau à ceux qui y ont écrit |

**L'auteur clôt la sienne sans permission** — `changerLaCloture` accepte son
`eleveId` et vérifie que la scène est bien à lui. C'est la contrepartie du
retrait : sans cela, quelqu'un dont la scène s'enlise n'aurait aucun geste.

**L'écran propose la clôture d'abord** dès qu'un autre a écrit —
`mieuxVautClore`. Pour l'auteur c'est le seul geste qui lui reste ; pour le
staff, c'est presque toujours le bon.

**Le motif est obligatoire pour le staff, même sur une scène vide** : c'est
tout ce qui restera au journal, et « scène supprimée » sans le pourquoi ne se
relit pas six mois plus tard. Un auteur chez lui n'a personne à qui se
justifier — **la base ne l'exige donc pas**, c'est le dépôt qui fait la
différence.

**Tous ceux qui ont écrit reçoivent le corbeau**, l'auteur de la scène compris,
chacun une fois quel que soit son nombre de posts — et jamais celui qui
retire. Décision du joueur : quelqu'un dont la scène disparaît sans un mot le
vivra mal, surtout si la faute vient d'un autre. Un envoi raté **ne défait pas
le retrait**, il est compté à part.

⚠️ **`placeConservee` se tranche au moment du geste et se garde en base.** La
recalculer donnerait une autre réponse le jour où quelqu'un écrit après coup,
et un post retiré reparaîtrait sous une autre forme sans que personne l'ait
demandé. Même principe que `anneeRequiseALOuverture`.

**Le texte d'un post retiré ne quitte plus le serveur** — `corps` part vide.
L'écran n'en montrerait rien, mais il serait dans la page, et une page se lit.

**Retirer son post n'est pas masquer celui d'un autre.** Masquer est une
mesure du staff qui laisse le texte lisible à son auteur pour qu'il le
reprenne (art. 19.3) ; retirer est le geste de l'auteur, et le texte n'est
plus lu de personne. Deux colonnes distinctes, deux chemins distincts, et
`retirerSonPost` ne regarde **aucun pouvoir**.

⚠️ **Le corbeau du château crée un fil, qui survit au compte.** Une
conversation dont tous les participants sont supprimés reste en base — la
limite connue du projet. L'essai en base emporte donc le sien en partant, et
**vérifie qu'il n'en reste aucune** : sans cela, chaque passage en fabriquait
deux.

---

### Deux règles qui NE SONT PAS dans le code, et c'est une décision

Le joueur a tranché le 26 août 2026, deux fois, dans le même sens : **ce qui se
règle entre joueurs reste à la bonne foi ; ce qui est une règle du monde reste
un verrou.**

- **Le mode de participation** — libre, sur invitation, réservé — s'écrit
  **dans le titre du sujet** : « Le vent sur la galerie (RÉSERVÉ Sigrid) ». Il
  n'y a **aucune colonne `mode`**, et il ne faut pas en ajouter une : une
  colonne qui ne décide de rien finit par décider de quelque chose. Un intrus
  se règle en privé, ou par un corbeau à l'administration.
- **La limite de scènes simultanées** (art. 17.3, trois puis cinq) est
  **affichée, jamais opposée**. `forum/scenes.ts` ne sait que constater. Le
  compte donne au modérateur le fait dont il a besoin le jour de la
  remontrance — sans lui, elle tomberait de nulle part.

Les **dix lignes**, elles, restent bloquantes : ça ne concerne que celui qui
écrit, et ça se vérifie sans rien interpréter. Le hors-RP est retiré **avant**
comptage (art. 12.3) — sinon on atteindrait dix lignes sans écrire une ligne de
jeu, et la règle ne dirait plus rien.

---

## Les transactions

**Toute transaction interactive passe par `transaction()`**, dans
`lib/base/transaction.ts`, et c'est le seul endroit qui fixe ses délais.

Prisma abandonne une transaction interactive au bout de **cinq secondes**, et
n'attend que **deux secondes** pour obtenir une connexion. Neon s'endort après
cinq minutes ; son réveil dépasse largement les deux. Le résultat n'est pas
une lenteur mais une **erreur 500** — `P2028`, « Transaction not found ».
Rencontré pour de bon le 27 août 2026 en envoyant un corbeau, le second essai
passant sans rien changer. Pour un joueur, cela se voit comme une panne : il
écrit, il reçoit une erreur, et il ne sait pas si son message est parti — ou
s'il est parti deux fois.

C'est **le cousin exact de `connect_timeout`** : la même cause, un autre
délai, et il n'était pas couvert.

**Une fonction plutôt qu'un objet d'options passé neuf fois.** Le second
marcherait aujourd'hui et se perdrait au dixième. Ici, écrire une transaction
sans délai demande de contourner la couture, et `transaction.test.ts` relit le
code source pour refuser tout `prisma.$transaction(async …)` ailleurs —
éprouvé en le réintroduisant, il tombe et nomme le fichier.

⚠️ **La forme en tableau — `$transaction([…])` — n'est pas concernée** :
Prisma ne lui laisse régler que le niveau d'isolation. Elle part en un seul
aller-retour, ce qui l'expose moins. Un essai le rappelle, pour qu'on ne
croie pas l'avoir oubliée.

---

## La sauvegarde

**Le filet de Neon fait six heures.** Formule gratuite, curseur « History
window » déjà au maximum — constaté dans la console le 27 août 2026. Passé ce
délai, une donnée perdue l'est pour de bon ; Neon ne va au-delà (30 jours) que
sur une formule payante.

`npm run base:sauvegarder` est la réponse gratuite : il recopie **toute** la
base dans un fichier daté, rangé dans `Perso/Ravenshallow/Sauvegardes/` — hors
du dépôt, et que Dropbox versionne à son tour. 0,35 Mo au 27 août 2026.

Trois décisions y sont inscrites, et aucune ne se devine :

- **La liste des tables n'est pas écrite à la main**, elle est déduite du
  schéma Prisma. Une table ajoutée demain serait sinon oubliée en silence — et
  une sauvegarde incomplète est pire qu'aucune, parce qu'on lui fait confiance.
- **Le fichier sort du dépôt**, qui est *public* : cette copie porte des
  adresses, des portraits et des conversations privées. Ne jamais la déplacer
  dedans, ni la joindre à un message.
- **L'écriture est atomique** — fichier temporaire puis renommage —, seule
  forme qui tienne dans un dossier Dropbox.

L'état des migrations voyage avec les données : sans lui, on ne saurait pas
sur quel schéma les réinjecter.

⚠️ **Elle ne se lance pas toute seule.** La lancer avant toute opération
risquée en base, et reposer la question de payer Neon le jour où des joueurs
auront écrit des choses irremplaçables.

**Scale to zero : 5 minutes, non modifiable en formule gratuite.** C'est ce
qui rend le `connect_timeout` obligatoire plutôt que confortable : on ne peut
pas empêcher la base de s'endormir.

---

## Les deux pages qu'on ne cherche jamais à voir

`app/not-found.tsx` et `app/error.tsx`, leurs textes dans `lib/content.ts`.
Sans elles, Next sert les siennes : fond blanc, anglais, « This page could not
be found ». Un joueur n'en conclut pas qu'il s'est trompé d'adresse, il en
conclut que le château est cassé.

Elles restent **hors du bandeau et hors de la navigation** : elles répondent
aussi bien pour une adresse de la vitrine que pour une salle de l'école qui
n'existe pas, et un menu emprunté à l'un serait faux dans l'autre.

`error.tsx` est **cliente** par obligation — Next lui passe un `reset` qui
rejoue le rendu sans recharger la page. C'est tout l'intérêt du bouton : la
cause la plus fréquente est une base endormie, et la seconde tentative tombe
sur une base réveillée. `error.digest` n'est pas affiché : c'est une empreinte
pour les journaux de Vercel, illisible pour un joueur.

**`robots.ts` ferme tout et rouvre trois pages.** L'inverse de l'habituel, et
pour la même raison que les drapeaux du menu : l'oubli doit aller dans le sens
de la fermeture. Une liste d'interdits demanderait d'y penser à chaque route
nouvelle, et l'oubli livrerait une page privée au cache de Google, qui survit
à la correction. Les adresses privées n'y sont pas *citées* : les nommer dans
un fichier public dirait où se trouve l'administration.

L'icône d'onglet est le sceau de l'école — `app/icon.png` (192 px) et
`app/apple-icon.png` (180 px), tirés de `public/crests/ravenshallow.webp`
rendu carré sur le fond `void`.

---

## Les deux pages que la loi réclame

`/mentions-legales` et `/confidentialite`, leurs textes dans `lib/legal.ts`,
rendues par un gabarit unique — `components/PageLegale.tsx`. Deux mises en
forme qui divergeraient finiraient par se contredire à l'œil.

**Rien n'y est inventé.** L'essentiel découle du règlement écrit par le joueur
— l'âge d'entrée (art. 2.2), le sort des écrits d'un partant (art. 2.5), le
format des avatars (art. 6.2) — et de ce que le code fait réellement, vérifié
fichier par fichier le 27 août 2026. **Ne jamais y ajouter une promesse que le
site ne tient pas** : une politique de confidentialité fausse est pire
qu'absente.

Ce que ces pages affirment, et qui doit rester vrai :

| Ce qui est écrit | Ce qui le garantit |
| --- | --- |
| l'âge réel n'est pas conservé | seul `majeur16` survit (art. 2.3) |
| l'IP n'est pas conservée | `connexion/tentatives.ts` n'écrit qu'un HMAC, effacé au bout d'une heure |
| aucun mouchard, **donc aucun bandeau de cookies** | aucune dépendance d'analytique ; le seul cookie est celui de session, dispensé de consentement |
| l'avatar n'est pas le visage du joueur | art. 6.2 — célébrité majeure, IA ou illustration |
| le staff ne lit pas les conversations privées | `etancheite.test.ts` |

**Deux décisions du joueur, prises le 27 août 2026 :** le site est publié
**sous pseudonyme** — permis à un éditeur non professionnel dont l'hébergeur
connaît l'identité, et c'est le cas —, et un compte est effacé après **trois
ans sans connexion**, précédé d'un courriel et d'un mois de délai. Ne pas
changer ces deux valeurs sans lui.

**L'information est donnée au moment de la saisie**, pas seulement dans une
page qu'il faudrait penser à ouvrir : `DossierForm` porte la mention et le
lien juste au-dessus du bouton d'envoi. C'est là que la loi la veut.

`robots.ts` ouvre les deux pages : une politique de confidentialité
introuvable ne vaut rien.

⚠️ **Une promesse est écrite et n'est pas encore tenue par le code** :
l'effacement d'un compte après trois ans sans connexion, courriel
d'avertissement puis un mois de délai. Rien ne le déclenche aujourd'hui —
aucune tâche planifiée, aucun écran. Le premier compte concerné ne le sera
pas avant août 2029, mais **c'est un engagement écrit** : soit on l'outille
avant, soit on relit la date à la main. Le signaler au joueur plutôt que de
laisser la page mentir. Les deux autres durées, elles, sont tenues par le
code : les empreintes de connexion s'effacent d'elles-mêmes au fil des
connexions, et la copie d'un signalement est protégée par un déclencheur.

**L'adresse de l'hébergeur est vérifiée, non écrite de mémoire** — Vercel
Inc., 440 N Barranca Ave #4133, Covina, CA 91723, relevée sur leurs conditions
le 27 août 2026. Neon (Francfort) et Gmail sont cités dans la politique de
confidentialité comme sous-traitants, pas dans les mentions légales : l'hébergeur
du *site* est Vercel.

---

## La mise en forme des posts

Posée le 27 août 2026, sur le forum et chez les non-mages. **La Tour aux
Corbeaux reste en texte brut** — décision du joueur : c'est le seul endroit
que le staff ne relit pas, et y laisser passer du balisage ouvrirait une
surface là où personne ne regarde.

**Le corps d'un post est désormais du HTML.** C'était du texte échappé par
React et mis en paragraphes par `whitespace-pre-wrap` ; la migration
`20260827150000_posts_en_balisage` a converti l'existant. Le seul
`dangerouslySetInnerHTML` du projet est dans `Post.tsx`, et il ne reçoit
jamais que la sortie de `nettoyerHtml`.

**Trois principes, et aucun n'est négociable :**

- **Liste blanche, jamais liste noire.** Dix balises, quatre attributs, trois
  schémas d'adresse. Tout le reste tombe, y compris ce qui n'existe pas
  encore. Même parti pris que `robots.ts`.
- **Le serveur ne fait jamais confiance au navigateur.** La barre ne produit
  que du permis, mais elle se contourne en appelant la route à la main.
- **On nettoie à l'enregistrement ET à l'affichage.** Le premier passage
  protège la base, le second protège l'écran de tout ce qui aurait pu entrer
  autrement. Un essai vérifie que **nettoyer deux fois ne change rien**, sans
  quoi un post se réécrirait à chaque lecture.

**`validerPost` est la seule porte**, et c'est pour cela que `forum/schema.ts`
est devenu `server-only` : le nettoyage s'y fait, donc aucune route ne peut
l'oublier. Ce que le champ partage encore avec le serveur — le comptage — vit
dans `longueur.ts`, et les plafonds dans `limites.ts` : ces deux-là restent
lisibles des deux côtés.

**Ni styles, ni nuancier — et l'éditeur ne sait pas en produire.** Les
extensions officielles de Tiptap posent `style="color:…"` ; les nôtres posent
une classe prise dans la palette, et rien d'autre. Idem pour l'alignement,
réécrit pour la même raison. **Ne pas les remplacer par les extensions
officielles** : ce serait rouvrir l'attribut `style`.

**Sept couleurs, toutes mesurées.** Les quatre couleurs de maison de la
palette **ne sont pas** celles des blasons : Kaldrafn tombait à 4,35:1 et
Nattorm à 4,17:1 comme texte, sous le seuil de 4,5. Les variantes retenues
tiennent **5,05:1 au minimum sur les quatre fonds du site**.
`mise-en-forme.test.ts` **relit `globals.css`** et refait le calcul — éprouvé
en y remettant la couleur du blason, il tombe. Il vérifie aussi que chaque
classe permise est bien stylée : une classe acceptée mais sans effet serait un
piège silencieux.

**Ce que l'éditeur ne propose pas, la liste blanche ne l'accepte pas.** Ni
titres, ni listes, ni code : ils ne figurent pas dans les outils demandés, et
les laisser accessibles au clavier — `#`, `- ` — ferait disparaître le travail
du joueur à la publication.

### Les images d'un post

**Par adresse extérieure, en `https` seulement** — décision du joueur,
27 août 2026. Rien n'est envoyé sur le site : l'image reste chez son
hébergeur, et disparaît du post si celui-ci ferme. L'envoi de fichiers
viendra avec le stockage qui servira aussi aux portraits.

**Trois attributs sont reposés d'office par le nettoyage, jamais laissés au
joueur :**

- `referrerpolicy="no-referrer"` — **le seul qui protège quelqu'un.** Sans
  lui, l'hébergeur de l'image apprend quelle page du château est en train
  d'être lue. Le site ne dépose aucun mouchard ; il n'a pas à en laisser
  poser un par la bande. Il ne peut pas empêcher l'hébergeur de voir l'adresse
  IP du lecteur — **et la politique de confidentialité le dit**.
- `loading="lazy"` et `decoding="async"` — une scène de trente posts illustrés
  ne se télécharge pas d'un coup, et le décodage ne retarde pas le texte.

`srcset` n'est **pas** permis : il porte une liste d'adresses, et une liste
d'adresses est une liste de choses à filtrer qu'on filtrerait moins bien.

**Trois largeurs, jamais un curseur** — `petite`, `moyenne`, `pleine`, en
classes comme les couleurs. Une image de trois mille pixels posée à sa taille
casse la mise en page de tout le monde sur téléphone, et son auteur ne s'en
aperçoit pas : il l'a vue sur son écran à lui. `max-width: 100%` est posé sous
les trois, pour que même la pleine largeur ne sorte jamais du cadre.

⚠️ **Une image est du contenu, jamais des lignes.** `porteQuelqueChose` et
`respecteLeMinimum` répondent à deux questions différentes : « y a-t-il de
quoi publier ? » — une image suffit — et « y a-t-il dix lignes ? » — une image
n'y contribue pas. Les confondre refuserait une illustration chez les
non-mages, ou laisserait une image tenir lieu de scène dans le domaine.

⚠️ **`onMouseDown` refuse son effet par défaut sur chaque bouton de la barre**,
et ce n'est pas un détail de style : sans lui, le clic donne le focus au
bouton, la sélection est perdue, la commande s'applique à côté et la frappe
suivante part dans le bouton. Constaté à l'écran — une phrase entière
disparaissait. Le clic naît du relâchement, il se déclenche quand même.

La barre est un vrai `role="toolbar"` à **tabindex glissant** : une seule
étape à la tabulation, les flèches circulent dedans. Vingt-trois arrêts entre
le champ et le bouton « Publier » rendraient l'écriture au clavier
insupportable. Chaque bouton porte un nom d'action en toutes lettres —
« Mettre en gras », jamais « B » — et les bascules annoncent `aria-pressed`.

**Les pastilles de couleur de la barre prennent leur teinte dans la variable
CSS**, pas dans la classe : celle-ci est bornée à `.post-rendu`, ce qui
l'empêche de peindre le reste de la page — et la barre n'en fait pas partie.
Elles étaient toutes grises avant qu'on s'en aperçoive.

**Coût** : Tiptap fait passer les deux pages du forum de 100 à 235 Ko.

---

## Authentification

Trois mécanismes distincts, à ne pas confondre :

- **Session joueur** — cookie signé HMAC (`lib/session/session.ts`), sans état.
  Il dit *qui c'est*, jamais *ce qu'il a le droit de faire* : `garde.ts` relit
  l'état du dossier en base à chaque page protégée.
- **Zone admin** — un mot de passe unique partagé (`lib/admin-auth.ts`), pas un
  compte. Le cookie porte un HMAC dérivé du mot de passe lui-même : le changer
  ferme toutes les sessions.
- **Jeton de dossier** — lien envoyé par courriel (`lib/dossier/jeton.ts`),
  signé, 30 jours, pour reprendre sa fiche sans se connecter.

Deux compteurs de version sur le compte, incrémentés au changement de mot de
passe : `sessionVersion` ferme les sessions, `jetonVersion` périme les liens.

**Le middleware tourne en runtime Edge** : il ne peut vérifier qu'une
signature, jamais joindre la base. Toute décision qui dépend de l'état du
compte appartient à `garde.ts`, côté serveur.

Mots de passe : **argon2id**, via `@node-rs/argon2`.

---

## Courriels

**nodemailer + SMTP Gmail**, expédiant depuis `ravenshallow.rp@gmail.com`.
Aucun service tiers — et ne pas en ajouter.

- `lib/mail/envoyer.ts` — transport et fonctions d'envoi
- `lib/mail/messages.ts` — gabarits, versions texte et HTML

Un envoi raté ne fait jamais échouer l'action en cours : tout renvoie un
`ResultatEnvoi`, et le sort de l'envoi est inscrit au journal du membre.

---

## Conventions

**Français partout**, y compris les identifiants du code métier, les messages
d'erreur et les courriels. **Apostrophes typographiques (’)** dans tout texte
affiché.

**Aucun texte en dur dans un composant.** Les libellés vivent dans :
`lib/dossier/constantes.ts`, `lib/dossier/etats.ts`, `lib/connexion/constantes.ts`,
`lib/ecole/constantes.ts`, `lib/ceremonie/constantes.ts`, `lib/content.ts`
(site vitrine).

Le barème de la cérémonie fait exception : il vit dans
`lib/ceremonie/questionnaire.ts`, avec les énoncés, **et ce fichier est
`server-only`**. Séparer les textes des poids obligerait à les tenir
synchronisés à la main.

**Trois polices**, chargées par `next/font` (aucune requête extérieure) :
Cinzel pour les titres et les capitales, EB Garamond pour le corps, et **Kalam
pour la seule note manuscrite du bureau**. Ne pas en ajouter une quatrième.

**Accessibilité** : le focus visible (`:focus-visible`) et
`prefers-reduced-motion` sont déjà traités globalement dans `globals.css` — ne
pas les refaire. Un état ne se signale jamais par la seule couleur.

**Sur un choix définitif, les flèches ne choisissent pas.** Dans un groupe de
boutons radio ordinaire, une flèche sélectionne en même temps qu'elle déplace :
un joueur au clavier verrouillerait son bois à la première touche, sans avoir
lu les autres cartes. `bjornstav/EtapeChoix.tsx` sépare les deux gestes — les
flèches parcourent, Espace ou Entrée décide. **La Cérémonie du Miroir n'a pas
encore ce traitement**, et c'est le seul écart connu entre les deux scènes.

**Composants réutilisables** : `dossier/Champ.tsx` (libellé lié, message en
`role="alert"`, hauteur réservée), `dossier/ReglesMotDePasse.tsx`,
`dossier/EcranEtat.tsx`, `ecole/Panneau.tsx`, `corbeaux/ChampCorbeau.tsx`
(validation partagée, Entrée va à la ligne, Ctrl/⌘+Entrée envoie),
`corbeaux/BlasonCorrespondant.tsx`.

**Le texte d'un corbeau est rendu par React, donc échappé d'office.** Les
retours à la ligne sont conservés par `whitespace-pre-wrap`, jamais par une
conversion en `<br>` — qui obligerait à assembler du HTML à la main,
c'est-à-dire exactement ce qu'on veut éviter. Les liens ne sont pas rendus
cliquables.

---

## Règles posées par le joueur — non négociables

- **L'âge réel saisi n'est jamais conservé.** Seul le booléen `majeur16`
  survit à l'inscription (art. 2.3).
- **`ADMIN_PASSWORD` n'est jamais exposé au client** — lu côté serveur seul.
- **L'école n'est accessible qu'aux dossiers acceptés.** Un compte en attente
  se connecte, mais n'atteint qu'un cul-de-sac.
- **Un membre banni garde son bureau et sa fiche**, rien d'autre — y compris
  les menus créés plus tard.
- **Message d'échec unique et neutre** à la connexion, et réponse identique au
  formulaire « mot de passe oublié », adresse connue ou non.
- **La maison se calcule côté serveur, et la cérémonie ne se joue qu'une
  fois** (art. 11.2). Le barème ne quitte jamais le serveur ; la route ne
  renvoie que le code de la maison, ni les points ni le départage. Le verrou
  contre le rejeu est en base : `updateMany` conditionné à `maison: null`.
- **La ligne de Nattorm affichée à la révélation parle du silence, pas de la
  malédiction** (art. 11.4). Ne pas la réécrire en « maison maudite ».
- **La baguette n'a aucun effet mécanique.** Pas de bonus, pas de statistique,
  aucun avantage en duel ni en cours : la magie courante n'a ni coût ni risque
  dans ce lore, un sort marche ou rate. Si un bois avantageait, tout le monde
  prendrait le même et le choix mourrait. Aucun texte ne doit laisser croire
  le contraire — `reaction.test.ts` interdit le vocabulaire d'équipement.
- **La boutique et le Miroir sont indépendants.** Aucun texte de Bjornstav ne
  nomme une maison, ni la répartition — un test le vérifie sur l'ensemble de
  la scène. La bible du lore (§5) évoque un « indice discret sur sa future
  maison » : c'est le joueur qui a tranché contre, et c'est lui qui prime.
- **Le rôle particulier est décoratif, et ne donne aucun droit. Jamais.** Il
  ne remplace que l'année à l'écran. Aucun contrôle d'accès, aucune condition
  d'affichage, aucune permission ne le lit — les droits viennent des rôles
  techniques et de `statutAcces`, jamais d'un libellé affiché. Écrire
  « Administratrice » dans ce champ ne doit strictement rien ouvrir.
  `EtatAcces` ne porte pas ce champ, et `role-affiche.test.ts` le vérifie de
  trois façons : par comparaison sur tous les chemins, par lecture du code
  source des quatre fichiers qui décident d'un accès, et par une directive
  `@ts-expect-error` qui casse la compilation le jour où le champ entrerait
  dans `EtatAcces`. **Ne jamais y toucher pour « simplifier ».**
- **Rien n'est jamais effacé pour marquer « sans objet ».** La maison et la
  baguette restent en base sous `SANS_OBJET`, et se rétablissent à
  l'identique. Un joueur de Bryggeld nommé professeur les garde au chaud.
- **Un compte sans maison ne rapporte aucun point à son ancienne maison.**
  C'est le piège du lot : la colonne `maison` est toujours écrite, et toute
  somme naïve la ramasserait. `lib/ecole/tournoi.ts` est le seul endroit qui
  répond à « pour qui ce compte marque-t-il ? », et `totauxParMaison` prend la
  liste **brute** pour faire le tri lui-même — une liste pré-filtrée
  reposerait sur l'appelant, et c'est ce qu'on veut lui retirer.
- **Les deux commandes — retirer la maison, retirer la baguette — sont
  indépendantes l'une de l'autre et du rôle affiché.** Aucune ne déclenche
  l'autre.
- **L'année reste stockée et modifiable même sous un rôle** — masquée, pas
  effacée. Effacer le rôle la fait réapparaître, et l'administration la voit
  en permanence dans le détail du membre.
- **Le choix de la baguette est définitif**, comme la maison. Deux verrous
  applicatifs (`updateMany` conditionné, garde de page et de route) **et**
  deux verrous en base — voir ci-dessous.
- **Une personne bloquée n'apprend jamais qu'elle l'est.** Son corbeau part,
  s'affiche chez elle, et n'arrive pas. La réponse de la route est identique à
  celle d'un envoi ordinaire — même code, mêmes champs. **C'est la mesure de
  protection elle-même** : un refus explicite déclenche l'escalade.
- **Aucun membre du staff ne lit les conversations privées**, quel que soit
  son rôle. Le seul accès passe par un signalement, et se limite au contexte
  transmis avec lui. Si un chemin de contournement apparaît, **le signaler au
  joueur plutôt que de l'implémenter**.
- **Supprimer ne retire un corbeau que de sa propre vue.** Personne ne peut
  effacer ce qu'il a écrit chez autrui — c'est ce qui protège un membre
  harcelé. **L'interface doit le dire au moment du geste.**
- **Un signalement conserve le message même si son auteur le supprime
  ensuite**, et sa copie ne se réécrit pas — un déclencheur le refuse. Une
  preuve qui se retouche n'en est pas une.
- **Signaler et bloquer sont deux gestes distincts**, proposés côte à côte.
  L'un ne déclenche jamais l'autre. Les signalements sont confidentiels
  (art. 8.6) : la personne visée ne sait pas qui l'a signalée.

---

## Pièges déjà rencontrés

**Tailwind** — la palette est déclarée **en hexadécimal** dans
`tailwind.config.ts` et **dupliquée** en variables CSS dans `globals.css`. Ce
n'est pas une négligence : Tailwind 3 ne sait pas injecter d'alpha dans un
`var()`, et `bg-mist/60` cesserait silencieusement de fonctionner. Garder les
deux listes synchronisées.

**Une couleur en variable CSS se déclare en composantes séparées par des
ESPACES.** `--brume-teinte: 214 228 242`, jamais `214, 228, 242` : la forme
moderne `rgb(var(--x) / 0.62)` n'accepte que la première. Avec des virgules, la
déclaration devient invalide et le navigateur la jette **en silence** — la
brume s'est peinte en transparent une bonne demi-heure avant qu'on comprenne.

**Prisma CLI lit `.env`, pas `.env.local`.** Passer `DATABASE_URL` en variable
d'environnement à la commande.

**Vingt-deux règles de la base ne sont pas dans `schema.prisma`** et ne s'en
déduiraient jamais. Régénérer le schéma depuis Prisma seul les perdrait.

Dans `20260825200000_baguette_definitive` : la cohérence des trois colonnes de
la baguette (contrainte `CHECK`) et son immuabilité une fois posée
(déclencheur). Pour corriger une baguette écrite par erreur, il faut lever le
déclencheur explicitement — la commande est en commentaire dans la migration.

Dans `20260825210000_role_affiche` : la cohérence des trois colonnes du rôle
(titre, date, auteur — ensemble ou pas du tout) et la propreté de son texte
(40 signes, rogné, sans espaces doublés, sans chevron, sans caractère de
contrôle). Ce second `CHECK` est **volontairement plus grossier** que le
schéma Zod : le format fin — lettres, espaces, apostrophes, tirets, points —
vit dans `lib/dossier/role-affiche.ts`, seule source de vérité. La base
n'arrête que ce qui casserait l'affichage, et le fait pour tous les chemins :
le site, un script, une commande tapée à la main.

Dans `20260825220000_etat_maison_baguette` : l'accord entre chaque état et sa
valeur — `NON_FAIT` exige une case vide, `FAIT` exige une valeur,
`SANS_OBJET` n'exige rien, et c'est ce troisième cas qui garde Tideål au
chaud. Plus une ligne ajoutée au déclencheur de la baguette : **on n'en
inscrit pas une à un compte marqué sans objet**. Sans elle, un professeur venu
de l'extérieur — colonnes vides, comme un nouvel élève — restait écrivable par
une requête forgée.

Dans `20260826100000_tour_aux_corbeaux` : l'accord entre le type d'une
conversation et sa clé (`administration:<id>` d'un côté, `idA:idB` de
l'autre), **le type qui ne change jamais** — sans quoi une conversation privée
pourrait se déguiser en fil du staff, qui la lirait —, le corps d'un message
ni vide ni démesuré, l'interdiction de se bloquer soi-même, et la copie figée
d'un signalement, qui ne se réécrit pas. Le déclencheur du signalement laisse
**effacer** la personne visée sans jamais la **remplacer** : refuser aussi
l'effacement rendrait un compte indestructible, un vieux signalement empêchant
pour toujours de le fermer.

Dans `20260826110000_pouvoirs` : l'accord entre une permission et sa portée —
une permission de maison porte une maison, une permission globale n'en porte
aucune, **et la vérification se fait dans les deux sens** —, plus les **deux
index uniques partiels** de `permissions_accordees`.

**Ces deux index-là sont le piège du lot, et il ne se voit pas.** Dans un
index unique, Postgres tient deux `NULL` pour **distincts**. Un `@@unique`
ordinaire sur `("utilisateurId", permission, maison)` laisserait donc accorder
`CLORE_SCENE` dix fois au même compte — et la retirer une fois n'en retirerait
qu'une : le pouvoir survivrait au retrait, sans que rien ne le signale. D'où
deux index partiels qui se partagent la table sans se recouvrir,
`WHERE maison IS NULL` et `WHERE maison IS NOT NULL`. Prisma ne sait pas les
exprimer : ils vivent en SQL, et seulement là. C'est le cousin exact du piège
des trois valeurs déjà rencontré avec `not` dans la Tour.

Les neuf garanties de cette migration ont été **éprouvées sur la vraie base**,
dans une transaction annulée : chacune refuse bien ce qu'elle doit refuser, et
rien n'est resté écrit.

Dans `20260826120000_forum` : **deux niveaux de sections et jamais trois**,
**l'année exigée à l'ouverture d'un sujet qui ne se réécrit jamais**, un titre
et un corps ni vides ni démesurés, une clôture complète ou absente, et les
quatre colonnes d'un masquage qui vont ensemble.

Le déclencheur des deux niveaux regarde **les deux bouts** : le parent ne doit
pas avoir de parent, **et** la section ne doit pas déjà avoir d'enfants. Sans
la seconde condition, on fabrique trois niveaux d'un seul `UPDATE`, par
l'autre côté.

Celui de l'année figée est ce qui fait tenir « le verrouillage n'est pas
rétroactif » : sans lui, un script de reprise refermerait des scènes en cours
sans que personne le voie. Même procédé que le type d'une conversation.

**Les deux verrous anti-rejeu portent sur l'ÉTAT, pas sur la case vide.**
`enregistrerRepartition` et `inscrireBaguette` conditionnent leur `updateMany`
à `NON_FAIT`, et écrivent l'état dans la même requête — la base refuserait une
maison posée sous un état « attendu ». Revenir à `where: { maison: null }`
rouvrirait la porte à tout compte sans objet qui n'a jamais eu de maison.

**`Fonction` ne porte plus que les sept années.** `PROFESSEUR` et `DIRECTION`
en ont été retirés par cette même migration — Postgres ne sachant pas ôter une
valeur d'un enum, il a fallu recréer le type. Les rôles au château se saisissent
maintenant en toutes lettres. Ne pas les réintroduire dans la liste : deux
façons d'écrire « directrice » finiraient par se contredire.

**`btrim` de Postgres ne retire que les ESPACES.** Pas les retours à la ligne,
pas les tabulations. `length(btrim(corps)) > 0` laissait donc passer un message
de six lignes vides, qui s'affichait comme une bulle vide dans le fil. La
contrainte s'écrit `corps ~ '[^[:space:]]'` — au moins un signe qui ne soit pas
un blanc. Corrigé par `20260826101000_corbeau_vraiment_non_vide`.

**Une colonne de grille vaut `auto`, un élément de liste `min-width: auto`.**
Un `<ul class="grid gap-2">` dont les `<li>` portent du texte long s'élargit
au-delà de l'écran, et sur téléphone la date et la pastille des non-lus
sortaient du cadre. **Il faut les deux** : `grid-cols-1` — qui vaut
`minmax(0, 1fr)` — sur la liste, et `min-w-0` sur l'élément. Un `truncate` ne
peut rien tant que rien ne borne la largeur.

**L'heure d'un corbeau dépend du fuseau de qui l'affiche.** Le serveur de
Vercel vit en UTC, le joueur non : le même instant s'écrit « 23:40 hier » d'un
côté et « 01:40 aujourd'hui » de l'autre. Tout ce qui affiche une date porte
donc `<time dateTime={iso}>` et `suppressHydrationWarning` — l'instant voyage
en ISO, et c'est la mise en forme du navigateur qui gagne, la seule juste pour
la personne qui lit.

**Un libellé de bandeau sur deux lignes se cale à gauche par défaut.** « MON /
BUREAU », « LES / CORBEAUX » : il faut `text-center` sur le libellé pour que
les deux mots s'alignent l'un sous l'autre. Le déroulé de téléphone, lui, est
une liste verticale et reste au fer à gauche.

**`hidden` ne suffit pas quand une classe pose un `display`.** L'attribut
`hidden` vaut `display: none` — mais une classe utilitaire comme `flex` le
**remplace en silence**, et le sous-menu reste ouvert en permanence. Le défaut
ne se voyait pas sur écran large, où le déroulant n'a pas de classe de
`display` : seul l'accordéon de téléphone était touché. Les deux portent
désormais la même décision dans la classe **et** dans l'attribut.

**Cinq entrées ne tiennent pas sur une ligne de parchemin.** « Le monde des
non-mages » en toutes lettres se cassait en quatre lignes et poussait la
déconnexion hors du cadre. Trois remèdes, tous nécessaires :

- **le libellé du bandeau est court** — « Les non‑mages » —, le nom complet
  reste sur la page. C'est le procédé de la Tour (`NOM_COURT` / `NOM_LONG`) ;
- son **trait d'union est insécable** (U+2011). Avec un tiret ordinaire, le
  mot se coupe en « NON- / MAGES » et l'entrée retombe sur trois lignes ;
- le bandeau passe au déroulé **sous `lg`** et non sous `md`, et le mot
  « Ravenshallow » à côté du sceau ne revient qu'au-delà de `2xl` — il coûte
  130 px, et le sceau dit déjà où l'on est.

Ne pas ajouter `shrink-0` sur les entrées pour « régler » le problème : elles
cessent alors de se comprimer et débordent sur le nom du membre.

**`not` de Prisma exclut les valeurs nulles**, là où le `IS DISTINCT FROM` du
SQL les garde. `auteurId: { not: moi }` laissait donc tomber tous les corbeaux
**sans auteur** — c'est-à-dire les réponses de l'administration. Le bandeau les
comptait (SQL brut), la liste non (Prisma) : les deux se contredisaient à
l'écran, et une lettre du château n'apparaissait jamais comme non lue. Le
filtre s'écrit maintenant `OR: [{ auteurId: null }, { auteurId: { not: moi } }]`.
C'est le piège des trois valeurs, et il ne se voit pas.

**La lettrine se recopie sur tous les blocs si on l'y laisse.** La règle est
écrite `.recit > .recit__narration:first-of-type::first-letter` : sans le
`>`, elle attrape le premier paragraphe de n'importe quel conteneur, et chaque
suite du récit de Bjornstav en gagnait une.

**Modules natifs** — `@node-rs/argon2` et `@prisma/client` sont déclarés dans
`serverComponentsExternalPackages` : empaquetés par webpack, ils cherchent
leur binaire au mauvais endroit et échouent à l'exécution.

**La base locale est la base de production.** Il n'existe pas encore de branche
d'essai. Un compte de test s'appelle `quelquechose@ravenshallow.invalid`,
jamais une adresse réelle du projet, et aucun script ne commence par un
effacement à l'aveugle.

**Le dépôt vit dans Dropbox**, et c'est la source de la moitié des pannes de
ce fichier : cache webpack corrompu, `.next` qui se recrée pendant qu'on
l'efface, `npm run build` qui échoue sous des messages qui n'y font pas penser.
Le 26 août 2026, une compilation est restée bloquée sur « Compiling / … »
pendant plus de deux minutes — Dropbox indexait les milliers de fichiers que
webpack venait d'écrire.

**Le remède est posé, et il vaut pour toutes ces pannes à la fois :**

```bash
xattr -w com.dropbox.ignored 1 .next
xattr -w com.dropbox.ignored 1 node_modules
```

Dropbox cesse de suivre ces deux dossiers. Après quoi la page d'accueil est
rendue en **30 ms** au lieu de ne jamais répondre.

⚠️ **L'attribut vit sur le DOSSIER, pas sur son nom.** Effacer `.next` l'emporte
avec lui, et le suivant repart synchronisé. Le bon geste après un effacement :

```bash
mkdir -p .next && xattr -w com.dropbox.ignored 1 .next
```

Vérifier d'un coup d'œil : `xattr -p com.dropbox.ignored .next` doit répondre
`1`. Et pour effacer le cache, toujours **déplacer plutôt qu'effacer** — voir
plus bas.

Le même mécanisme **fait échouer `npm run build`**, et sous des messages qui
n'y font pas penser : `Cannot find module for page: /_document`, ou
`ENOENT … .next/server/pages-manifest.json`. La construction compile, puis ne
retrouve plus les fichiers qu'elle vient d'écrire — Dropbox les a déplacés
entre-temps. Le signe qui ne trompe pas : `rm -rf .next` répond
`Directory not empty`, parce que la synchronisation en recrée pendant
l'effacement. **Ce n'est pas une erreur de code** : effacer `.next`, laisser
quelques secondes, recommencer. Deuxième ou troisième essai, ça passe.

**La base Neon se met en veille.** Après quelques minutes sans requête, la
formule gratuite suspend le calcul. La visite suivante doit le réveiller, et si
le réveil dépasse le délai d'attente de Prisma (5 s par défaut), la page tombe
sur `Can't reach database server at ep-….neon.tech:5432`. Ce n'est pas une
panne — mais c'est arrivé assez souvent pour être corrigé.

**`connect_timeout=15` est maintenant posé par le code**, dans
`lib/base/adresse.ts`, appelé par `lib/prisma.ts` — le seul endroit qui ouvre
une connexion. Prisma patiente au lieu d'abandonner, **partout à la fois** :
le poste de développement, Vercel, et tout environnement à venir.

Il est posé aussi dans `.env.local` depuis le 26 août 2026, et **c'est la
valeur écrite à la main qui gagne** : `adresseAvecDelaiDeConnexion` ne touche
pas une adresse qui porte déjà un délai, quelle qu'en soit la valeur.

**L'adresse n'est jamais réécrite, seulement allongée.** Ne pas « simplifier »
en la reconstruisant avec la classe `URL` : un mot de passe fait de signes
inhabituels en ressortirait ré-encodé, et la connexion échouerait sans que
rien n'indique pourquoi. Seule la partie après le `?` est relue, par
`URLSearchParams`, pour savoir si le délai s'y trouve déjà. Un essai fige ce
choix.

**Pourquoi le code plutôt que le tableau de bord Vercel** : la variable y est
de type *Secret*, donc en **écriture seule**. Elle ne se relit plus une fois
enregistrée, et l'allonger de quinze caractères obligerait à retaper l'adresse
entière — mot de passe compris, recopié de Neon à la main, une faute de frappe
suffisant à faire tomber le site. Constaté à l'écran le 27 août 2026.

`scripts/importer-dossiers.mjs` ouvre son propre client et n'en bénéficie
pas : c'est un script local lancé à la main, où l'échec est visible et se
relance. Ne pas y voir un oubli.

**Ne jamais lancer `npm run build` pendant que `npm run dev` tourne.** Les deux
écrivent dans `.next` : le build périme le manifeste du serveur de
développement, `main-app.js` part en 404 et **React cesse d'hydrater toute la
page** — sans la moindre erreur explicite. Arrêter le serveur, construire,
supprimer `.next`, relancer.

Le fait le 26 août 2026 a donné pire encore : un `Cannot find module
'./9161.js'` sur **toutes** les pages, y compris `/connexion`, et il a survécu
à trois `rm -rf .next` suivis d'un redémarrage. Dropbox rematérialise des
fichiers pendant l'effacement, et le nouveau serveur repart sur un cache
à moitié ancien.

**Le remède qui marche à tous les coups : déplacer plutôt qu'effacer.** Un
renommage est atomique — la synchronisation ne peut pas courir après :

```bash
mv .next /private/tmp/next-mort && rm -rf /private/tmp/next-mort &
```

Puis relancer. Le `&` renvoie l'effacement en arrière-plan : il peut prendre
du temps, mais il ne se passe plus dans le dépôt.

**Images** — les blasons de `public/crests/` sont en **WebP** : les PNG
d'origine pesaient ~1 Mo pièce (5,2 Mo), ils font 767 Ko à eux cinq (−86 %),
même définition, encodés une fois pour toutes à `quality: 85`. Écart invisible,
vérifié à 3× de zoom sur fond sombre. L'image du bureau a été convertie en JPEG
(2,9 Mo → 573 Ko) ; `public/ceremonie/` (232 Ko) et `public/bjornstav/`
(224 Ko) étaient déjà à la cible. **La carte reste en JPEG** : elle s'affiche
à 1088 px, c'est la seule qui a besoin de sa taille.

**Un blason sans `sizes` réclame la pleine largeur pour trente pixels.** C'était
le vrai gâchis, et il ne se voyait pas dans le poids des fichiers : `next/image`
sans attribut `sizes` fabrique un `srcset` de deux entrées — la largeur
naturelle et son double — et un écran retina prend la plus grande. Le bandeau
téléchargeait donc **109 Ko** pour un écu de 32 px de large ; avec
`sizes="32px"`, il en télécharge **7 Ko**. Les cinq usages de l'école le
déclarent maintenant (bandeau ×3, `BlasonCorrespondant`, Ma fiche) ;
`HouseCard` et `FoundingSection`, côté vitrine, l'avaient déjà. Les dimensions
de `lib/ecole/blasons.ts` sont les dimensions **naturelles** du fichier — elles
ne donnent que le rapport, jamais la taille d'affichage. En ajouter un nouveau
sans `sizes`, c'est refaire le trou.

Le fond de Bjornstav a été **aplani, assombri et refroidi** avant d'entrer
dans le dépôt : c'est ce qui permet au texte de rester lisible pendant tout le
défilement. Ne pas le retraiter. Les réglages des couches (opacités,
positions, durées) viennent de la maquette et ont été équilibrés à l'écran —
les remplacer par « ce qui semble juste » fait repasser le mur devant le
texte.

---

## Ce qui existe, ce qui manque

**Fait** : site vitrine, règlement (87 points), dossier d'admission complet
(recadrage 9:16, registre des visages, courriel de confirmation), zone
d'administration (lecture des dossiers, liste des membres avec son **rôle
particulier**, journal),
connexion, mot de passe oublié, protection des routes, bandeau-parchemin,
Ma fiche, Mon bureau, la note des premiers pas, **la boutique Bjornstav**
(récit, mur d'étagères, bois, cœur, réaction assemblée côté serveur,
enregistrement définitif) et **la Cérémonie du Miroir** (récit, brume,
questionnaire, révélation, enregistrement), et **la Tour aux Corbeaux** —
envoi, lecture, fil de l'administration, recherche de personnage, non-lus au
bandeau et au bureau, blocage et déblocage, anti-démarchage, retrait de sa
vue, signalement et écran de modération, **et le courrier du château, que le
staff lit et auquel il répond**.

Le panneau « Mon courrier » du bureau est **le premier à cesser d'être vide** :
`courrierNonLu` lit vraiment la base. Le panneau n'a pas eu à bouger, ce qui
était le plan depuis le lot du bureau.

**Les deux premiers pas sont dans l'ordre** : la baguette d'abord, le Miroir
ensuite, et le second est fermé côté serveur tant que le premier n'est pas
fait.

Les comptes qui ne sont pas des élèves — directrice, professeurs — se
déclarent depuis la fiche du membre : **maison et baguette retirées, sans rien
effacer**, chacune réversible et tracée au journal.

**Le menu regroupé est en place** : cinq entrées, dont trois ouvrent un
sous-menu, la pastille des corbeaux remontée sur « Mon personnage », un
accordéon par groupe sur téléphone, et le sous-menu atteignable au clavier —
Entrée ou Espace l'ouvre, Échap le referme en rendant le focus au bouton, et
sortir du groupe par Tab le referme seul.

Sept adresses nouvelles, dont six sont des **pages « à venir »** partageant un
gabarit unique (`ecole/PageAVenir.tsx`) : `/ecole`, `/cours`, `/alentours`,
`/maison`, `/non-mages`, `/archives/histoire`. La septième porte vraiment
quelque chose : `/archives/reglement` rend le règlement sous le bandeau, **à
partir de la même source** que la page publique — recopier les 87 points pour
les mettre sous le parchemin, ce serait en avoir deux versions dont une fausse.

**Les pouvoirs sont posés** : cinq permissions attribuables à n'importe quel
membre, les préfets, la traçabilité au journal et la page d'ensemble
`/admin/pouvoirs`. Aucun préfet n'est nommé ; les onze permissions sont posées sur
les **deux comptes d'administration**, qui passent de toute façon partout —
elles n'ouvrent donc rien de plus, et se retirent sans conséquence. Aucun
compte de joueur n'en porte : le staff écrit les annonces en attendant, et le
jour où le joueur nomme un préfet, il n'y a rien à développer.

**Le moteur du forum est posé, et L'école est meublée** : quatre tables, les
trois espaces avec leur paramétrage, **cinq sections et vingt pièces** en base,
la couture qui dit qui lit et qui écrit, les dix lignes, le repère de scènes,
et deux écrans — `/ecole` et `/ecole/<pièce>` — qui se parcourent déjà. Les
espaces `non-mages` et `maison` existent, vides : on les remplira quand on
aura de quoi.

**On écrit dedans.** Ouvrir une scène, répondre, le compteur de dix lignes
pendant la frappe, les balises `[HRP]`, l'avertissement de contenu proposé au
moment de publier, clore et épingler pour qui en a la permission, et le post
masqué sept jours pour correction — avec le corbeau du château qui prévient.

Le panneau **« Mes scènes en cours »** du bureau est le deuxième à cesser
d'être vide, et il n'a pas eu à bouger.

**Les deux pages légales sont posées** — mentions légales et politique de
confidentialité —, liées au pied de page et au moment de la saisie du dossier.

**Pas encore** : les points, les cours, les annonces du Grand Hall, le Registre
magique, et le contenu des espaces `non-mages` et `maison`. Le point
d'accroche des points est un booléen sur l'espace — `comptePourLesPoints` — et
le jour venu il se branchera sur `maisonQuiCompte`, jamais sur la colonne
`maison`.

Le **Registre magique** — l'annuaire des membres, trié par maison et par
fonction — n'existe pas : c'est lui qui portera « bloquer depuis sa fiche »,
et c'est pourquoi ce lot-ci ne pose le blocage que depuis la conversation. Le tournoi inter-maisons n'existe pas non plus — mais la règle qui
dira **qui compte** est déjà posée et testée dans `lib/ecole/tournoi.ts` : le
lot des points remplacera la valeur, pas la condition. Les quatre panneaux du bureau lisent `lib/bureau/donnees.ts`, dont
les fonctions rendent des listes vides — chaque lot en remplacera **une
seule**. `progression()` est la première à rendre autre chose : elle porte
déjà l'année et la baguette.

**Limites connues** — les blasons ne sont plus une limite : passés en WebP et
munis de leur `sizes`, la ligne de conversation de la Tour en charge 7 Ko au
lieu de 109.

Le compteur de non-lus par conversation construit un `OR` d'une clause par
fil, parce que le seuil de lecture change de l'un à l'autre. Tenable pour la
trentaine d'une page ; si la liste s'allonge, c'est là — et nulle part
ailleurs — qu'un compteur tenu à jour prendra sa place. Le total du bandeau,
lui, est déjà en SQL brut : il est appelé à **chaque page** de l'école et doit
tenir en un aller-retour.

Une conversation dont **tous** les participants ont été supprimés reste en
base, rattachée à personne et visible de personne. Sans conséquence, mais un
ménage la ramasserait.

Le format `prenomNom` refuse les prénoms composés
(Jean-Luc) et les noms à apostrophe (O'Brien). `schema.test.ts:91-98` fige ces
refus **par choix** : ces tests casseront le jour où le format évoluera, et
c'est voulu.

---

## Méthode

**Une étape à la fois, et montrer le résultat avant de passer à la suivante.**
Pour un schéma de base ou une décision structurante : proposer, attendre la
validation, puis coder.

Le joueur n'est pas développeur. Le guider clic par clic dans les interfaces
tierces (Vercel, Neon, Google), lui ouvrir les fichiers cachés à sa place
(`open -e .env.local`), et ne jamais lui demander de coller un secret dans la
conversation.

**Lancer les commandes soi-même plutôt que les lui tendre.** Lui faire copier
une commande le met en difficulté — il s'est perdu sur une migration Prisma
passée trois fois de suite sous cette forme. Quand une commande doit venir de
lui (un `git push`, qui a besoin de son trousseau), n'en donner **qu'une**,
dire en une phrase ce qu'elle fait, et demander le résultat.
