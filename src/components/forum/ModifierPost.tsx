"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ChampPost from "@/components/forum/ChampPost";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { respecteLeMinimum } from "@/lib/forum/longueur";

/**
 * **Reprendre son propre post.**
 *
 * Sans limite de temps : ce qu'un joueur a écrit est à lui (art. 6.4), et une
 * coquille se corrige six mois plus tard. Ce qui protège les autres n'est pas
 * un délai mais **la marque « modifié le »**, que le post porte ensuite et que
 * tout le monde voit.
 *
 * Le champ est **le même** que celui de la publication — `ChampPost`, donc le
 * même éditeur, la même barre, le même compteur. Deux champs qui divergeraient
 * finiraient par accepter deux textes différents, et c'est la route qui
 * trancherait, trop tard.
 *
 * Pas de boîte de dialogue ici : modifier n'est pas destructeur, et l'on voit
 * son texte pendant qu'on le reprend. Annuler le referme sans rien envoyer.
 */
export default function ModifierPost({
  postId,
  corpsInitial,
  avertissementInitial,
  lignesMinimum,
  estDuJeuDeRole = true,
}: {
  postId: string;
  corpsInitial: string;
  avertissementInitial: string | null;
  /** Dix dans le domaine (art. 12.2), nul ailleurs. */
  lignesMinimum: number | null;
  /** Voir `ChampPost` : hors RP, ni compteur, ni avertissement de contenu. */
  estDuJeuDeRole?: boolean;
}) {
  const routeur = useRouter();
  const t = TEXTES_FORUM.modification;

  const [ouvert, setOuvert] = useState(false);
  const [corps, setCorps] = useState(corpsInitial);
  const [avertissement, setAvertissement] = useState(avertissementInitial ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const pret = respecteLeMinimum(corps, lignesMinimum);

  async function enregistrer() {
    if (envoi) return;
    setEnvoi(true);
    setErreur(null);

    const reponse = await fetch(`/api/forum/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corps, avertissement }),
    }).catch(() => null);

    setEnvoi(false);

    if (!reponse || !reponse.ok) {
      const lu = (await reponse?.json().catch(() => ({}))) as { erreur?: string };
      setErreur(lu?.erreur ?? TEXTES_FORUM.erreurs.refuse);
      return;
    }

    setOuvert(false);
    routeur.refresh();
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => {
          // On repart du texte publié à chaque ouverture : une modification
          // abandonnée ne doit pas ressurgir au clic suivant.
          setCorps(corpsInitial);
          setAvertissement(avertissementInitial ?? "");
          setErreur(null);
          setOuvert(true);
        }}
        className="rounded-sm border border-silver/25 px-3 py-1.5 font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:border-silver/50 hover:text-parchment"
      >
        {t.action}
      </button>
    );
  }

  return (
    <div className="w-full">
      <ChampPost
        estDuJeuDeRole={estDuJeuDeRole}
        valeur={corps}
        onChange={setCorps}
        lignesMinimum={lignesMinimum}
        avertissement={avertissement}
        onAvertissement={setAvertissement}
        reponse
        desactive={envoi}
      />

      <p role="alert" className="mt-2 min-h-[1.25rem] font-body text-sm text-ember">
        {erreur ?? ""}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={envoi || !pret}
          className="btn btn-solid px-6 tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {envoi ? t.enCours : t.enregistrer}
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="btn btn-ghost px-5 tracking-[0.12em]"
        >
          {t.annuler}
        </button>
      </div>
    </div>
  );
}
