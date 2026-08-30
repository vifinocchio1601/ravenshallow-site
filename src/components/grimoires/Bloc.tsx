import { MATIERES } from "@/lib/cours/cursus";
import { FONCTIONS, libelleAnnee, type Fonction } from "@/lib/dossier/etats";
import type { Bloc } from "@/lib/grimoires/blocs";
import { TEXTES_GRIMOIRES } from "@/lib/grimoires/constantes";
import { CLASSE_CONTENEUR } from "@/lib/forum/mise-en-forme";
import { nettoyerHtml } from "@/lib/forum/nettoyer-html";

const T = TEXTES_GRIMOIRES;

/**
 * **Un bloc de grimoire, rendu.**
 *
 * Un composant serveur : le balisage repasse par `nettoyerHtml` à
 * l'affichage, et le nettoyeur est `server-only`. Le premier passage a eu
 * lieu à l'enregistrement ; celui-ci protège l'écran de tout ce qui aurait pu
 * entrer autrement — une reprise de données, un script lancé à la main. Même
 * parti pris que `Post.tsx`.
 *
 * ⚠️ **Aucune couleur n'est écrite ici.** Les mêmes blocs se lisent sur le
 * papier du lecteur et sur la nuit de la lecture continue : les teintes
 * viennent des variables que `.gr-papier` et `.gr-nuit` redéfinissent. Une
 * classe Tailwind posée sur un élément rendrait le texte illisible dans l'un
 * des deux — du parchemin clair sur du papier clair, la faute déjà payée sur
 * le journal du bureau.
 *
 * ⚠️ **Le nom d'une matière vient du cursus**, jamais du bloc : la fiche ne
 * porte qu'un identifiant, et c'est ce qui empêche deux orthographes de
 * cohabiter. Idem pour l'année, dont le libellé vit dans `dossier/etats.ts` —
 * « 1re année », et non « 1e ».
 */
export default function BlocGrimoire({ bloc }: { bloc: Bloc }) {
  switch (bloc.type) {
    case "SOUS_TITRE":
      return (
        <h3 id={bloc.ancre ?? undefined} className="gr-bloc gr-sous-titre">
          {bloc.donnees.texte}
        </h3>
      );

    case "PARAGRAPHE":
      return (
        <div
          className={`gr-bloc gr-para ${CLASSE_CONTENEUR}`}
          dangerouslySetInnerHTML={{ __html: nettoyerHtml(bloc.donnees.html) }}
        />
      );

    case "FICHE_SORT": {
      const d = bloc.donnees;
      const matiere = MATIERES.find((m) => m.id === d.matiere)?.nom ?? d.matiere;
      const annee = libelleAnnee(FONCTIONS[d.annee - 1] as Fonction);

      return (
        <article id={bloc.ancre ?? undefined} className="gr-bloc gr-fiche">
          <div className="gr-fiche__tete">
            <span aria-hidden="true" className="gr-fiche__glyphes glyphe">
              {d.glyphes.join(" ")}
            </span>
            <h4 className="gr-fiche__nom">{d.nom}</h4>
          </div>

          <p className="gr-fiche__meta">
            <span className="gr-fiche__formule">{d.formule}</span>
            <span aria-hidden="true"> · </span>
            {d.lie ? T.fiche.lie : T.fiche.simple}
            <span aria-hidden="true"> · </span>
            {matiere}
            <span aria-hidden="true"> · </span>
            {annee}
          </p>

          <p className="gr-fiche__effet">{d.effet}</p>

          {d.limite ? (
            <p className="gr-fiche__limite">
              <b>{T.fiche.limite}. </b>
              {d.limite}
            </p>
          ) : null}
        </article>
      );
    }

    case "FICHE_INTERDITE": {
      const d = bloc.donnees;
      return (
        <article id={bloc.ancre ?? undefined} className="gr-bloc gr-interdit">
          <h4 className="gr-interdit__nom">{d.nom}</h4>
          <p className="gr-interdit__verbe">{d.verbe}</p>

          {d.rubriques.map((r) => (
            <div key={r.titre} className="gr-interdit__rubrique">
              <p className="gr-interdit__titre">{r.titre}</p>
              <p className="gr-interdit__texte">{r.texte}</p>
            </div>
          ))}
        </article>
      );
    }

    case "TABLEAU": {
      const d = bloc.donnees;
      return (
        <div className="gr-bloc gr-tableau">
          <table>
            <thead>
              <tr>
                {d.entetes.map((e) => (
                  <th key={e} scope="col">
                    {e}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.lignes.map((ligne, i) => (
                <tr key={i}>
                  {ligne.map((cellule, j) => (
                    <td key={j} className={j === 0 ? "glyphe" : undefined}>
                      {cellule}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "SEPARATEUR":
      return <div className="gr-bloc gr-separateur" aria-hidden="true" />;
  }
}
