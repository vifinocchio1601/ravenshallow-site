"use client";

import { useEffect, useRef, useState } from "react";
import Revelation from "@/components/ceremonie/Revelation";
import { TEXTES_CEREMONIE } from "@/lib/ceremonie/constantes";
import type { QuestionAffichee } from "@/lib/ceremonie/questionnaire";
import type { Maison } from "@/lib/dossier/etats";

/**
 * La cérémonie, côté navigateur : les cinq questions, puis la révélation.
 *
 * Les questions apparaissent **une par une** — répondre verrouille la
 * question et fait paraître la suivante. Pas de retour en arrière, pas de
 * bouton « précédent » : le Miroir lit ce qu’on lui donne, pas ce qu’on
 * aurait préféré lui dire.
 *
 * Sous la mise en scène, ce sont de vrais groupes de boutons radio dans des
 * `fieldset` : la navigation aux flèches fonctionne, le focus se voit, et la
 * question suivante le reçoit dès qu’elle paraît. Le verrouillage est annoncé
 * dans une zone `aria-live`, sans quoi il se ferait en silence pour qui n’a
 * pas l’écran.
 *
 * **Ce composant ne sait pas calculer une maison.** Il ne connaît que des
 * libellés et des identifiants ; il envoie les cinq identifiants au serveur
 * et attend qu’on lui dise ce que le Miroir a vu.
 */

/** Le temps de laisser la brume respirer entre deux questions. */
const ATTENTE_QUESTION_SUIVANTE = 520;
const ATTENTE_REVELATION = 900;

type Phase = "questions" | "lecture" | "revelation" | "echec";

export default function Ceremonie({
  questions,
}: {
  questions: readonly QuestionAffichee[];
}) {
  const t = TEXTES_CEREMONIE.quiz;

  const [reponses, setReponses] = useState<(string | null)[]>(() =>
    questions.map(() => null),
  );
  /** Combien de questions sont dans le document. */
  const [affichees, setAffichees] = useState(1);
  /** Combien ont reçu leur transition d’apparition — toujours une frame après. */
  const [apparues, setApparues] = useState(0);
  const [phase, setPhase] = useState<Phase>("questions");
  const [maison, setMaison] = useState<Maison | null>(null);
  const [annonce, setAnnonce] = useState("");

  const champs = useRef<(HTMLInputElement | null)[]>([]);
  const groupes = useRef<(HTMLFieldSetElement | null)[]>([]);

  const mouvementReduit = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * L’apparition se joue en deux temps : la question entre dans le document,
   * puis — un instant plus tard — reçoit son `data-visible`. Sans ce délai,
   * le navigateur n’a rien à interpoler et la transition ne se joue pas.
   *
   * `setTimeout` et non `requestAnimationFrame` : un onglet en arrière-plan
   * ne peint pas, donc n’appelle jamais ses `requestAnimationFrame`. Comme
   * c’est ce minuteur qui rend les questions visibles, le joueur qui ouvre la
   * cérémonie dans un onglet de fond retrouverait un questionnaire vide.
   */
  useEffect(() => {
    const apparition = window.setTimeout(() => setApparues(affichees), 30);
    return () => window.clearTimeout(apparition);
  }, [affichees]);

  /**
   * Envoie les cinq identifiants et attend le verdict.
   *
   * Rien n’est calculé ici, et rien ne l’est jamais : la réponse du serveur
   * ne contient que le code de la maison. Un 409 signifie que le Miroir avait
   * déjà parlé — on repart au bureau plutôt que de rejouer quoi que ce soit.
   */
  async function consulterLeMiroir(toutes: string[]) {
    try {
      const reponse = await fetch("/api/ceremonie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reponses: toutes }),
      });
      const donnees: { maison?: Maison; destination?: string } = await reponse
        .json()
        .catch(() => ({}));

      if (reponse.status === 409 && donnees.destination) {
        window.location.href = donnees.destination;
        return;
      }

      if (!reponse.ok || !donnees.maison) {
        setPhase("echec");
        return;
      }

      setMaison(donnees.maison);
      setPhase("revelation");
    } catch {
      // Réseau coupé : rien n’a été écrit, les réponses sont encore en main.
      setPhase("echec");
    }
  }

  function choisir(index: number, idReponse: string) {
    // Une question répondue ne se reprend pas.
    if (reponses[index] !== null) return;

    const misesAJour = [...reponses];
    misesAJour[index] = idReponse;
    setReponses(misesAJour);
    setAnnonce(t.verrouillee);

    const reduit = mouvementReduit();

    if (index === questions.length - 1) {
      window.setTimeout(
        () => {
          setPhase("lecture");
          void consulterLeMiroir(misesAJour as string[]);
        },
        reduit ? 0 : ATTENTE_REVELATION,
      );
      return;
    }

    window.setTimeout(
      () => {
        setAffichees((compte) => Math.max(compte, index + 2));

        // Le focus part sur la nouvelle question : sans lui, la navigation au
        // clavier resterait bloquée sur la question qu’on vient de verrouiller.
        window.setTimeout(() => {
          groupes.current[index + 1]?.scrollIntoView({
            block: "center",
            behavior: reduit ? "auto" : "smooth",
          });
          champs.current[index + 1]?.focus({ preventScroll: true });
        }, 30);
      },
      reduit ? 0 : ATTENTE_QUESTION_SUIVANTE,
    );
  }

  function reessayer() {
    setPhase("lecture");
    void consulterLeMiroir(reponses as string[]);
  }

  return (
    <section aria-label={t.aria}>
      {/* Le verrouillage d’une question n’a aucun signe sonore : cette zone
          l’annonce, sans déplacer le focus. */}
      <p aria-live="polite" className="sr-only">
        {annonce}
      </p>

      {questions.map((question, index) => {
        const choisie = reponses[index];
        const premierDeSonGroupe = index === 0 || reponses[index - 1] !== null;

        return (
          <fieldset
            key={question.id}
            ref={(element) => {
              groupes.current[index] = element;
            }}
            className="question"
            hidden={index >= affichees}
            data-visible={index < apparues}
            data-verrouillee={choisie !== null}
          >
            <legend className="p-0">
              <span className="font-display text-[0.72rem] uppercase tracking-[0.34em] text-ember/80">
                {t.etape
                  .replace("{n}", String(index + 1))
                  .replace("{total}", String(questions.length))}
              </span>
            </legend>

            <p className="mb-5 mt-3 font-body italic leading-[1.85] text-parchment-dim">
              {question.enonce}
            </p>

            <ul className="grid list-none gap-[0.7rem] p-0">
              {question.reponses.map((reponse, rang) => {
                const identifiant = `${question.id}-${reponse.id}`;
                return (
                  <li key={reponse.id} className="reponse relative">
                    <input
                      type="radio"
                      name={question.id}
                      id={identifiant}
                      value={reponse.id}
                      checked={choisie === reponse.id}
                      // Une fois la question verrouillée, seule la réponse
                      // retenue reste dans l’ordre de tabulation.
                      disabled={choisie !== null && choisie !== reponse.id}
                      onChange={() => choisir(index, reponse.id)}
                      ref={(element) => {
                        if (rang === 0 && premierDeSonGroupe) {
                          champs.current[index] = element;
                        }
                      }}
                    />
                    <label htmlFor={identifiant} className="font-body">
                      {reponse.texte}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}

      {phase === "lecture" ? (
        <p
          className="font-display text-[0.72rem] uppercase tracking-[0.34em] text-ember/80"
          aria-live="polite"
        >
          {t.lecture}
        </p>
      ) : null}

      {/* L’envoi a échoué et rien n’a été écrit : les réponses sont toujours
          là, il suffit de redemander. On ne renvoie pas au questionnaire. */}
      {phase === "echec" ? (
        <div role="alert">
          <p className="font-body leading-[1.85] text-parchment-dim">{t.echec}</p>
          <button
            type="button"
            onClick={reessayer}
            className="btn btn-ghost mt-5 border-ember/75 hover:border-ember"
          >
            {t.reessayer}
          </button>
        </div>
      ) : null}

      {phase === "revelation" && maison ? <Revelation maison={maison} /> : null}
    </section>
  );
}
