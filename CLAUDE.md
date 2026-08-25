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
npm test                 # vitest, 87 tests
npm run lint
npx tsc --noEmit
npm run build            # à passer avant tout déploiement
npm run courriel:verifier # teste l'authentification SMTP sans rien envoyer
npm run base:importer     # reprend .donnees/dossiers.json dans la base
```

`.env.local` porte cinq variables : `ADMIN_PASSWORD`, `AUTH_SECRET`,
`MAIL_EXPEDITEUR`, `MAIL_APP_PASSWORD`, `DATABASE_URL`. Les mêmes existent sur
Vercel, environnement Production — avec là-bas la chaîne Neon **pooled**.

---

## Les coutures uniques

Quatre endroits concentrent chacun une décision. Ne pas recopier leur logique
ailleurs, l'y ajouter.

| Fichier | Ce qu'il décide, seul |
| --- | --- |
| `lib/session/acces.ts` | qui entre dans l'école, et où l'on atterrit selon l'état du dossier |
| `lib/ecole/menu.ts` | les routes de l'école — le menu, la protection et les droits du membre suspendu s'en déduisent |
| `lib/dossier/depot.ts` | l'accès au stockage — aiguille entre PostgreSQL et l'échafaudage JSON |
| `lib/dossier/schema.ts` | la validation, partagée mot pour mot entre le formulaire et la route |

**Le jour de la répartition**, la condition à modifier est
`peutEntrerDansLEcole` — et elle seule. Les colonnes `maison`, `repartiLe`,
`baguetteBois`, `baguetteCoeur`, `baguetteChoisieLe` existent déjà, vides.

**Ajouter une entrée au menu** = une ligne dans `ENTREES_MENU`. Une entrée est
fermée au membre banni **sauf** si elle porte `pendantBannissement` : l'oubli
va dans le sens de la fermeture.

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
`lib/ecole/constantes.ts`, `lib/content.ts` (site vitrine).

**Accessibilité** : le focus visible (`:focus-visible`) et
`prefers-reduced-motion` sont déjà traités globalement dans `globals.css` — ne
pas les refaire. Un état ne se signale jamais par la seule couleur.

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

---

## Pièges déjà rencontrés

**Tailwind** — la palette est déclarée **en hexadécimal** dans
`tailwind.config.ts` et **dupliquée** en variables CSS dans `globals.css`. Ce
n'est pas une négligence : Tailwind 3 ne sait pas injecter d'alpha dans un
`var()`, et `bg-mist/60` cesserait silencieusement de fonctionner. Garder les
deux listes synchronisées.

**Prisma CLI lit `.env`, pas `.env.local`.** Passer `DATABASE_URL` en variable
d'environnement à la commande.

**Modules natifs** — `@node-rs/argon2` et `@prisma/client` sont déclarés dans
`serverComponentsExternalPackages` : empaquetés par webpack, ils cherchent
leur binaire au mauvais endroit et échouent à l'exécution.

**La base locale est la base de production.** Il n'existe pas encore de branche
d'essai. Un compte de test s'appelle `quelquechose@ravenshallow.invalid`,
jamais une adresse réelle du projet, et aucun script ne commence par un
effacement à l'aveugle.

**Le dépôt vit dans Dropbox.** `node_modules` et `.next` y sont synchronisés en
continu, ce qui a déjà corrompu un cache webpack.

**Images** — les blasons de `public/crests/` pèsent ~1 Mo pièce, servis via
`next/image`. L'image du bureau a été convertie en JPEG (2,9 Mo → 573 Ko).

---

## Ce qui existe, ce qui manque

**Fait** : site vitrine, règlement (87 points), dossier d'admission complet
(recadrage 9:16, registre des visages, courriel de confirmation), zone
d'administration (lecture des dossiers, liste des membres, journal),
connexion, mot de passe oublié, protection des routes, bandeau-parchemin,
Ma fiche, Mon bureau.

**Pas encore** : le Miroir de Brume (répartition), la boutique Bjornstav
(baguettes), les scènes, la messagerie, les points et les annonces du Grand
Hall. Les quatre panneaux du bureau lisent `lib/bureau/donnees.ts`, dont les
fonctions rendent des listes vides — chaque lot en remplacera **une seule**.

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
