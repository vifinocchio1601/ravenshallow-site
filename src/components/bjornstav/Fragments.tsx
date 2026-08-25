import type { Paragraphe } from "@/lib/bjornstav/constantes";

/**
 * Une suite de paragraphes du récit.
 *
 * Narration en italique, parole du fabricant détachée et tenue par un filet
 * cuivré — les mêmes deux classes que la Cérémonie, qui raconte de la même
 * façon. Il n’y en a pas deux jeux : `globals.css` les définit une fois.
 */
export default function Fragments({
  paragraphes,
}: {
  paragraphes: readonly Paragraphe[];
}) {
  return (
    <>
      {paragraphes.map((paragraphe, index) => (
        <p
          key={index}
          className={
            paragraphe.ton === "parole" ? "recit__parole" : "recit__narration"
          }
        >
          {paragraphe.texte}
        </p>
      ))}
    </>
  );
}
