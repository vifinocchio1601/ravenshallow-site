import base from "./vitest.config.mts";

/**
 * L’essai de la Tour aux Corbeaux, sur la VRAIE base.
 *
 * Une configuration à part, et non un `*.test.ts` de plus : la suite
 * ordinaire — `npm test` — ne doit jamais toucher la base, qui est celle de
 * production tant qu’il n’existe pas de branche d’essai.
 *
 *   npm run corbeaux:essai — npm run forum:essai
 *
 * L’essai crée deux comptes en `@ravenshallow.invalid`, les fait s’écrire, se
 * bloquer, se chercher — puis efface tout ce qu’il a écrit, y compris les
 * conversations, qui resteraient sinon orphelines. Il ne commence par aucun
 * effacement à l’aveugle.
 */
export default {
  ...base,
  test: {
    ...base.test,
    // Les deux essais en base. Chaque script npm en vise un par son chemin :
    // les lancer ensemble mélangerait deux ménages qui n’ont rien à voir.
    include: ["src/lib/**/en-base.essai.ts"],
    /**
     * Vingt secondes au lieu de cinq.
     *
     * La base Neon se met en veille après quelques minutes sans requête, et le
     * réveil prend plusieurs secondes. Au délai par défaut, les premiers essais
     * échouaient une fois sur deux avec un « Test timed out » qui ne disait
     * rien de la cause — un faux échec est pire qu'un essai lent, parce qu'on
     * finit par cesser de le lire.
     */
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
};
