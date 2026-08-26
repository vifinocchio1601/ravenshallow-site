# Ravenshallow

Forum de jeu de rôle textuel : une école de magie sur la côte nordique.
Next.js 14 (App Router), TypeScript strict, Tailwind 3, Prisma + PostgreSQL.

**En ligne :** https://ravenshallow-site.vercel.app — base Neon (Francfort),
déploiement automatique au push sur `main`.

---

## Avant d'écrire quoi que ce soit

**La documentation de référence n'est pas dans le dépôt.** Deux `.docx`, deux
niveaux au-dessus, dans `Perso/Ravenshallow/` — **et ils n'y sont plus au
26 août 2026** : le dossier ne contient que `Logos/`, `Site/` et `images/`.
Une recherche dans tout `Dropbox/Perso` ne les retrouve pas. Le règlement
reste intégralement lisible dans `src/lib/reglement.ts` ; **la bible du lore,
elle, n'est plus consultable** — la redemander au joueur avant toute question
de lore.

- `Bible du LORE.docx` — le monde, les quatre maisons, la magie, le bestiaire,
  la structure scolaire
- `Reglement_Ravenshallow.docx` — identique à `src/lib/reglement.ts`, ses
  87 points vérifiés par comparaison

Les extraire avec `zipfile` + `word/document.xml`. Toute question de lore ou de
règle se tranche là, pas au jugé.

**Le règlement fait autorité sur le produit.** Les durées de bannissement
(art. 8), le droit de contester dans les quinze jours (8.5), le format des
avatars (art. 6), l'âge d'entrée (10.2) : ce sont des règles écrites par le
joueur, pas des choix d'implémentation. Ne pas les réécrire sans demander.

---

## Démarrer

```bash
npm run dev              # http://localhost:3000
npm test                 # vitest, 482 tests — ne touche JAMAIS la base
npm run lint
npx tsc --noEmit
npm run build            # à passer avant tout déploiement
npm run courriel:verifier # teste l'authentification SMTP sans rien envoyer
npm run base:importer     # reprend .donnees/dossiers.json dans la base
npm run base:migrer       # applique les migrations en attente
npm run corbeaux:essai    # exerce la Tour aux Corbeaux SUR LA VRAIE BASE
```

`base:migrer` existe parce que la CLI Prisma ne lit pas `.env.local` : le
script fait le pont, sans jamais afficher la chaîne de connexion.

`corbeaux:essai` est à part, et son nom de fichier — `en-base.essai.ts`, et
non `.test.ts` — l'exclut de `npm test` **à dessein** : il écrit vraiment en
base. Il crée deux comptes `essai.*@ravenshallow.invalid`, les fait s'écrire,
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

Quatorze endroits concentrent chacun une décision. Ne pas recopier leur
logique ailleurs, l'y ajouter.

| Fichier | Ce qu'il décide, seul |
| --- | --- |
| `lib/session/acces.ts` | qui entre dans l'école, **jusqu'où il va**, où l'on atterrit — **et les six questions qu'on a le droit de poser sur une étape** |
| `lib/ecole/menu.ts` | les routes de l'école — le menu, la protection, et les droits du suspendu comme du nouvel arrivant s'en déduisent |
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

**Ajouter une entrée au menu** = une ligne dans `ENTREES_MENU`. Deux drapeaux,
et l'oubli de l'un comme de l'autre va dans le sens de la fermeture :

- `pendantBannissement` — ouverte au membre suspendu
- `avantPremiersPas` — ouverte au nouvel arrivant

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

**Onze règles de la base ne sont pas dans `schema.prisma`** et ne s'en
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

**Le dépôt vit dans Dropbox.** `node_modules` et `.next` y sont synchronisés en
continu, ce qui a déjà corrompu un cache webpack.

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
le réveil dépasse le délai d'attente de Prisma (5 s), la page tombe sur
`Can't reach database server at ep-….neon.tech:5432`. **Ce n'est pas une panne :
recharger suffit.** Un `?connect_timeout=15` sur `DATABASE_URL` ferait
patienter au lieu d'échouer, si la gêne revient.

**Ne jamais lancer `npm run build` pendant que `npm run dev` tourne.** Les deux
écrivent dans `.next` : le build périme le manifeste du serveur de
développement, `main-app.js` part en 404 et **React cesse d'hydrater toute la
page** — sans la moindre erreur explicite. Arrêter le serveur, construire,
supprimer `.next`, relancer.

**Images** — les blasons de `public/crests/` pèsent ~1 Mo pièce (5,7 Mo au
total), servis via `next/image` sur toutes les pages de l'école : à alléger un
jour. `public/ceremonie/` (232 Ko) et `public/bjornstav/` (224 Ko) montrent la
cible. L'image du bureau a été convertie en JPEG (2,9 Mo → 573 Ko).

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
vue, **signalement et écran de modération**.

Le panneau « Mon courrier » du bureau est **le premier à cesser d'être vide** :
`courrierNonLu` lit vraiment la base. Le panneau n'a pas eu à bouger, ce qui
était le plan depuis le lot du bureau.

**Les deux premiers pas sont dans l'ordre** : la baguette d'abord, le Miroir
ensuite, et le second est fermé côté serveur tant que le premier n'est pas
fait.

Les comptes qui ne sont pas des élèves — directrice, professeurs — se
déclarent depuis la fiche du membre : **maison et baguette retirées, sans rien
effacer**, chacune réversible et tracée au journal.

**Pas encore** : les scènes, les points et les annonces du Grand Hall.

Le **Registre magique** — l'annuaire des membres, trié par maison et par
fonction — n'existe pas : c'est lui qui portera « bloquer depuis sa fiche »,
et c'est pourquoi ce lot-ci ne pose le blocage que depuis la conversation. Le tournoi inter-maisons n'existe pas non plus — mais la règle qui
dira **qui compte** est déjà posée et testée dans `lib/ecole/tournoi.ts` : le
lot des points remplacera la valeur, pas la condition. Les quatre panneaux du bureau lisent `lib/bureau/donnees.ts`, dont
les fonctions rendent des listes vides — chaque lot en remplacera **une
seule**. `progression()` est la première à rendre autre chose : elle porte
déjà l'année et la baguette.

**Limites connues** — les blasons de `public/crests/` pèsent ~1 Mo pièce, et la
Tour en affiche **un par ligne de conversation** : c'était déjà « à alléger un
jour », ça le devient franchement.

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
