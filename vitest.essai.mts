import base from "./vitest.config.mts";

/**
 * L’essai de la Tour aux Corbeaux, sur la VRAIE base.
 *
 * Une configuration à part, et non un `*.test.ts` de plus : la suite
 * ordinaire — `npm test` — ne doit jamais toucher la base, qui est celle de
 * production tant qu’il n’existe pas de branche d’essai.
 *
 *   npm run corbeaux:essai
 *
 * L’essai crée deux comptes en `@ravenshallow.invalid`, les fait s’écrire, se
 * bloquer, se chercher — puis efface tout ce qu’il a écrit, y compris les
 * conversations, qui resteraient sinon orphelines. Il ne commence par aucun
 * effacement à l’aveugle.
 */
export default {
  ...base,
  test: { ...base.test, include: ["src/lib/corbeaux/en-base.essai.ts"] },
};
