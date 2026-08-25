# Ravenshallow

Forum de jeu de rôle textuel : une école de magie sur la côte nordique.
Next.js 14 (App Router), TypeScript strict, Tailwind 3, Prisma + PostgreSQL.

**En ligne :** https://ravenshallow-site.vercel.app — base Neon (Francfort),
déploiement automatique au push sur `main`.

---

## Avant d'écrire quoi que ce soit

**La documentation de référence n'est pas dans le dépôt.** Deux `.docx`, deux
niveaux au-dessus, dans `Perso/Ravenshallow/` :

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
npm test                 # vitest, 308 tests
npm run lint
npx tsc --noEmit
npm run build            # à passer avant tout déploiement
npm run courriel:verifier # teste l'authentification SMTP sans rien envoyer
npm run base:importer     # reprend .donnees/dossiers.json dans la base
npm run base:migrer       # applique les migrations en attente
```

`base:migrer` existe parce que la CLI Prisma ne lit pas `.env.local` : le
script fait le pont, sans jamais afficher la chaîne de connexion.

`.env.local` porte cinq variables : `ADMIN_PASSWORD`, `AUTH_SECRET`,
`MAIL_EXPEDITEUR`, `MAIL_APP_PASSWORD`, `DATABASE_URL`. Les mêmes existent sur
Vercel, environnement Production — avec là-bas la chaîne Neon **pooled**.

---

## Les coutures uniques

Neuf endroits concentrent chacun une décision. Ne pas recopier leur logique
ailleurs, l'y ajouter.

| Fichier | Ce qu'il décide, seul |
| --- | --- |
| `lib/session/acces.ts` | qui entre dans l'école, **jusqu'où il va**, et où l'on atterrit |
| `lib/ecole/menu.ts` | les routes de l'école — le menu, la protection, et les droits du suspendu comme du nouvel arrivant s'en déduisent |
| `lib/dossier/depot.ts` | l'accès au stockage — aiguille entre PostgreSQL et l'échafaudage JSON |
| `lib/dossier/schema.ts` | la validation, partagée mot pour mot entre le formulaire et la route |
| `lib/ceremonie/questionnaire.ts` | les cinq questions **et leur barème** — `server-only`, jamais expédié au client |
| `lib/ceremonie/repartition.ts` | le calcul de la maison et le départage, reproductibles |
| `lib/bjornstav/constantes.ts` | toute la scène de la boutique **et les vingt-cinq réactions** — `server-only` |
| `lib/ecole/baguette.ts` | les dix codes, les dix noms, et la validation de ce qu'envoie le navigateur |
| `lib/dossier/role-affiche.ts` | ce qu'on peut écrire dans le rôle particulier — **partagé mot pour mot** entre le champ de saisie et l'action serveur |

**L'accès se joue à deux étages**, tous deux dans `acces.ts` :

- `peutEntrerDansLEcole` — dossier accepté et accès non suspendu. Elle ouvre
  la porte du château. **Ne pas y ajouter « et réparti »** : cela fermerait le
  bureau au nouvel arrivant, donc la note qui l'envoie au Miroir.
- `aFiniLesPremiersPas` — baguette choisie **et** réparti. Elle décide
  jusqu'où l'on va. Le nouvel arrivant n'a que son bureau et sa fiche.

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

- `/bjornstav` se referme sur `aChoisiSaBaguette` → renvoi au bureau
- `/ceremonie` se referme sur `estReparti` → renvoi au bureau, **et** exige
  `aChoisiSaBaguette` → renvoi à Kaldvik

Ces deux gardes-là sont refaites **en entier** dans les routes d'API
correspondantes. Une adresse de page se contourne en la tapant ; une route
d'API se contourne en l'appelant.

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
`dossier/EcranEtat.tsx`, `ecole/Panneau.tsx`.

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
- **L'année reste stockée et modifiable même sous un rôle** — masquée, pas
  effacée. Effacer le rôle la fait réapparaître, et l'administration la voit
  en permanence dans le détail du membre.
- **Le choix de la baguette est définitif**, comme la maison. Deux verrous
  applicatifs (`updateMany` conditionné, garde de page et de route) **et**
  deux verrous en base — voir ci-dessous.

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

**Quatre règles de la base ne sont pas dans `schema.prisma`** et ne s'en
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

**`Fonction` ne porte plus que les sept années.** `PROFESSEUR` et `DIRECTION`
en ont été retirés par cette même migration — Postgres ne sachant pas ôter une
valeur d'un enum, il a fallu recréer le type. Les rôles au château se saisissent
maintenant en toutes lettres. Ne pas les réintroduire dans la liste : deux
façons d'écrire « directrice » finiraient par se contredire.

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
questionnaire, révélation, enregistrement).

**Les deux premiers pas sont dans l'ordre** : la baguette d'abord, le Miroir
ensuite, et le second est fermé côté serveur tant que le premier n'est pas
fait.

**Pas encore** : les scènes, la messagerie, les points et les annonces du
Grand Hall. Les quatre panneaux du bureau lisent `lib/bureau/donnees.ts`, dont
les fonctions rendent des listes vides — chaque lot en remplacera **une
seule**. `progression()` est la première à rendre autre chose : elle porte
déjà l'année et la baguette.

**Limite connue** : le format `prenomNom` refuse les prénoms composés
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
