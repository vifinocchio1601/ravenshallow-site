/**
 * Remplaçant de `server-only` sous Vitest.
 *
 * Le vrai module lève une exception dès qu’il est importé hors d’un composant
 * serveur, ce qui empêchait de tester les routes d’API. Son rôle — interdire
 * qu’un module serveur atterrisse dans le bundle client — reste assuré par
 * Next au build ; il n’a rien à faire pendant les tests.
 */
export {};
