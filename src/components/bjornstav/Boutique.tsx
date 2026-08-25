"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import EtapeChoix from "@/components/bjornstav/EtapeChoix";
import Fragments from "@/components/bjornstav/Fragments";
import type { Carte, Paragraphe } from "@/lib/bjornstav/constantes";
import { TEXTES_BJORNSTAV } from "@/lib/bjornstav/textes";
import { ROUTES } from "@/lib/ecole/menu";

/**
 * Le choix, côté navigateur : le bois, puis le cœur.
 *
 * Un choix **verrouille son étape** et fait paraître la réponse du fabricant.
 * Pas de retour en arrière, pas de bouton « précédent » : le vieux a déjà
 * sorti les boîtes.
 *
 * **Ce composant ne sait rien des réactions.** Il connaît les dix cartes et
 * ce que le fabricant répond à chacune — de la narration, sans secret. Les
 * vingt-cinq dénouements n’existent que sur le serveur : celui de la baguette
 * inscrite arrive en réponse à l’enregistrement, et lui seul.
 *
 * L’ordre est celui-là et pas un autre : **on inscrit, puis on raconte.** Le
 * texte qui s’affiche est donc toujours celui d’une baguette qui existe.
 */

/** Le temps de laisser le vieux se retourner vers ses étagères. */
const ATTENTE_SUITE = 480;

type Phase = "choix" | "travail" | "fin" | "echec";

type Denouement = {
  avantPhoto: Paragraphe[];
  apresPhoto: Paragraphe[];
  libelle: string;
};

export default function Boutique({
  cartesBois,
  cartesCoeur,
  suitesBois,
  entreLeBoisEtLeCoeur,
}: {
  cartesBois: readonly Carte[];
  cartesCoeur: readonly Carte[];
  suitesBois: Record<string, readonly Paragraphe[]>;
  entreLeBoisEtLeCoeur: readonly Paragraphe[];
}) {
  const t = TEXTES_BJORNSTAV;

  const [bois, setBois] = useState<string | null>(null);
  const [coeur, setCoeur] = useState<string | null>(null);

  /** L’étape du cœur est dans le document…  */
  const [coeurAffiche, setCoeurAffiche] = useState(false);
  /** … et reçoit sa transition une frame plus tard. */
  const [coeurVisible, setCoeurVisible] = useState(false);

  const [phase, setPhase] = useState<Phase>("choix");
  const [denouement, setDenouement] = useState<Denouement | null>(null);
  const [annonce, setAnnonce] = useState("");

  const suiteDuBois = useRef<HTMLElement>(null);
  const suiteDuCoeur = useRef<HTMLElement>(null);
  const sortie = useRef<HTMLAnchorElement>(null);

  const mouvementReduit = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * L’apparition se joue en deux temps : l’élément entre dans le document,
   * puis — un instant plus tard — reçoit son `data-visible`. Sans ce délai,
   * le navigateur n’a rien à interpoler et la transition ne se joue pas.
   *
   * `setTimeout` et non `requestAnimationFrame` : un onglet en arrière-plan
   * ne peint pas, donc n’appelle jamais ses `requestAnimationFrame`. Comme
   * c’est ce minuteur qui rend le texte visible, un joueur qui ouvre la
   * boutique dans un onglet de fond retrouverait une page muette.
   */
  useEffect(() => {
    if (!coeurAffiche) return;
    const apparition = window.setTimeout(() => setCoeurVisible(true), 30);
    return () => window.clearTimeout(apparition);
  }, [coeurAffiche]);

  /**
   * Le focus attend la fin de la mise en scène. Le poser tout de suite ferait
   * annoncer le sentier avant même que la baguette ait répondu.
   */
  useEffect(() => {
    if (phase !== "fin") return;
    const reduit = mouvementReduit();
    const attente = window.setTimeout(
      () => sortie.current?.focus(),
      reduit ? 0 : 2200,
    );
    return () => window.clearTimeout(attente);
  }, [phase]);

  function choisirBois(code: string) {
    // Une étape close ne se rouvre pas.
    if (bois !== null) return;

    setBois(code);
    setAnnonce(t.etapes.bois.verrouille);

    const reduit = mouvementReduit();

    window.setTimeout(
      () => {
        setCoeurAffiche(true);
        window.setTimeout(() => {
          suiteDuBois.current?.scrollIntoView({
            block: "start",
            behavior: reduit ? "auto" : "smooth",
          });
        }, 30);
      },
      reduit ? 0 : ATTENTE_SUITE,
    );
  }

  function choisirCoeur(code: string) {
    if (coeur !== null || bois === null) return;

    setCoeur(code);
    setAnnonce(t.etapes.coeur.verrouille);

    const reduit = mouvementReduit();
    window.setTimeout(
      () => {
        setPhase("travail");
        void inscrireLaBaguette(bois, code);
      },
      reduit ? 0 : ATTENTE_SUITE,
    );
  }

  /**
   * Envoie les deux codes et attend le dénouement.
   *
   * Rien n’est assemblé ici, et rien ne l’est jamais. Un 409 signifie qu’une
   * baguette était déjà posée — on repart au bureau plutôt que d’en raconter
   * une seconde.
   */
  async function inscrireLaBaguette(codeBois: string, codeCoeur: string) {
    try {
      const reponse = await fetch("/api/bjornstav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bois: codeBois, coeur: codeCoeur }),
      });
      const donnees: Partial<Denouement> & { destination?: string } =
        await reponse.json().catch(() => ({}));

      if (reponse.status === 409 && donnees.destination) {
        window.location.href = donnees.destination;
        return;
      }

      if (!reponse.ok || !donnees.libelle || !donnees.apresPhoto) {
        setPhase("echec");
        return;
      }

      setDenouement(donnees as Denouement);
      setPhase("fin");

      window.setTimeout(() => {
        suiteDuCoeur.current?.scrollIntoView({
          block: "start",
          behavior: mouvementReduit() ? "auto" : "smooth",
        });
      }, 30);
    } catch {
      // Réseau coupé : rien n’a été inscrit, le choix est encore en main.
      setPhase("echec");
    }
  }

  function reessayer() {
    if (!bois || !coeur) return;
    setPhase("travail");
    void inscrireLaBaguette(bois, coeur);
  }

  return (
    <>
      {/* Le verrouillage d’une étape n’a aucun signe sonore : cette zone
          l’annonce, sans déplacer le focus. */}
      <p aria-live="polite" className="sr-only">
        {annonce}
      </p>

      <EtapeChoix
        nom="bois"
        legende={t.etapes.bois.legende}
        cartes={cartesBois}
        choisi={bois}
        onChoisir={choisirBois}
        visible
        // Le bois est là dès l’ouverture de la page : lui donner le focus
        // expédierait le joueur aux cartes avant qu’il ait lu une ligne.
        prendLeFocus={false}
      />

      {/* Ce qu’il répond, puis les boîtes ouvertes et les cinq coffrets. */}
      {coeurAffiche && bois ? (
        <>
          <section
            ref={suiteDuBois}
            className="suite-echoppe"
            data-visible={coeurVisible}
          >
            <Fragments paragraphes={suitesBois[bois] ?? []} />
            <Fragments paragraphes={entreLeBoisEtLeCoeur} />
          </section>

          <EtapeChoix
            nom="coeur"
            legende={t.etapes.coeur.legende}
            cartes={cartesCoeur}
            choisi={coeur}
            onChoisir={choisirCoeur}
            visible={coeurVisible}
            // Celle-ci paraît en cours de route : elle prend le focus, sans
            // quoi le clavier resterait sur l’étape qu’on vient de fermer.
            prendLeFocus={coeurVisible}
          />
        </>
      ) : null}

      {/* Il taille. C’est le temps de l’écriture en base. */}
      {phase === "travail" ? (
        <p
          className="mt-8 font-display text-[0.72rem] uppercase tracking-[0.34em] text-ember/85"
          aria-live="polite"
        >
          {t.attente}
        </p>
      ) : null}

      {/* L’envoi a échoué et rien n’a été inscrit : le choix est toujours en
          main, il suffit de retendre la sienne. */}
      {phase === "echec" ? (
        <div role="alert" className="mt-8">
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

      {/* La baguette est inscrite. Le reste n’est plus qu’à lire. */}
      {phase === "fin" && denouement ? (
        <section
          ref={suiteDuCoeur}
          className="suite-echoppe"
          data-visible="true"
          aria-label={t.fin.aria}
        >
          <Fragments paragraphes={denouement.avantPhoto} />

          {/* La photographie, à l’instant où la baguette est en main et avant
              qu’elle réponde. Ses dimensions sont écrites : sans elles, le
              texte qui suit sauterait au moment où l’image arrive. */}
          <figure className="my-12">
            <Image
              src="/bjornstav/echoppe.webp"
              alt={t.photo.alt}
              width={1000}
              height={666}
              sizes="(max-width: 47rem) 100vw, 38rem"
              className="h-auto w-full border border-ember/30 shadow-[0_30px_80px_rgb(0_0_0_/_0.8)]"
            />
            <figcaption className="mt-4 text-center font-display text-[0.82rem] uppercase tracking-[0.12em] text-parchment-dim">
              {t.photo.legende}
            </figcaption>
          </figure>

          <Fragments paragraphes={denouement.apresPhoto} />

          <div className="fin-echoppe">
            <div className="filet" aria-hidden="true">
              <span className="text-[0.8rem] tracking-[0.3em]">◆</span>
            </div>

            <p className="fin-echoppe__baguette">{denouement.libelle}</p>
            <p className="fin-echoppe__mention font-body">{t.fin.sansRetour}</p>

            {/* Un vrai lien, et un rechargement complet : le gabarit de
                l’école relit la session en base, et c’est ce qui décoche la
                première ligne des premiers pas et déverrouille le Miroir. */}
            <a
              ref={sortie}
              href={ROUTES.bureau}
              className="btn btn-ghost border-ember/75 hover:border-ember"
            >
              {t.fin.bouton}
            </a>
          </div>
        </section>
      ) : null}
    </>
  );
}
