/**
 * **L'adresse d'un portrait**, et le seul endroit qui la compose.
 *
 * Les portraits vivent en base sous forme de texte encodé ; la route
 * `/api/portraits/[id]` les rend comme de vraies images, que le navigateur
 * peut garder. Cette fonction fabrique le lien, avec l'empreinte qui le rend
 * cachable sans risque : **une fiche modifiée change d'adresse**, donc le
 * cache d'hier ne peut pas resservir un portrait d'avant.
 *
 * Le jour où les portraits partiront sur un stockage externe, c'est cette
 * fonction et la route qui changeront — rien d'autre.
 */
export function adressePortrait(
  eleveId: string | null,
  majLe: Date | null,
): string | null {
  if (!eleveId) return null;
  const empreinte = majLe ? majLe.getTime() : 0;
  return `/api/portraits/${eleveId}?v=${empreinte}`;
}
