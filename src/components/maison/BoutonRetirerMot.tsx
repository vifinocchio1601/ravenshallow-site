"use client";

import { useFormStatus } from "react-dom";
import { retirerAction } from "@/app/(ecole)/maison/actions";
import { TEXTES_TABLEAU } from "@/lib/tableau/constantes";

/**
 * **Décrocher un mot du tableau.**
 *
 * Il n'apparaît que sur les mots qu'on a le droit de décrocher — le sien,
 * toujours, et tous pour qui tient le tableau. Mais **c'est l'action serveur
 * qui protège** : un bouton absent n'a jamais gardé une porte, et
 * `retirerAction` refait la question en entier.
 *
 * Le nom accessible est **entier** — « Retirer le mot épinglé par Sigrid » —
 * et non « Retirer » : dans un mur de dix parchemins, le second ne dit pas
 * lequel à qui écoute. C'est le procédé de `BoutonRetirerFil`, dans la Tour.
 */
export default function BoutonRetirerMot({
  id,
  qui,
}: {
  id: string;
  /** Le nom de qui l'a épinglé, pour le dire au clavier comme à l'écran. */
  qui: string;
}) {
  return (
    <form action={retirerAction} className="mot-epingle__retrait">
      <input type="hidden" name="id" value={id} />
      <Bouton qui={qui} />
    </form>
  );
}

function Bouton({ qui }: { qui: string }) {
  const { pending } = useFormStatus();
  const t = TEXTES_TABLEAU.retirer;
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={t.aria.replace("{qui}", qui)}
      title={t.aide}
      className="mot-epingle__retrait-bouton"
    >
      {t.libelle}
    </button>
  );
}
