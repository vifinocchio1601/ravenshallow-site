"use client";

import Link from "next/link";
import BoutonRetirerFil from "@/components/corbeaux/BoutonRetirerFil";
import { useEffect, useState } from "react";
import BlasonCorrespondant from "@/components/corbeaux/BlasonCorrespondant";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { quandDansLaListe } from "@/lib/corbeaux/dates";
import type { ResumeConversation } from "@/lib/corbeaux/depot";
import { ROUTES } from "@/lib/ecole/menu";
import { signalerLectureCorbeaux } from "./useNonLus";
import { useRafraichissement } from "./useRafraichissement";

/**
 * La liste des conversations, triée par activité récente.
 *
 * Composant client pour une seule raison : le rafraîchissement périodique.
 * La première liste, elle, vient du serveur — la page s’affiche pleine, sans
 * attendre une requête.
 */
export default function ListeConversations({
  initiales,
}: {
  initiales: ResumeConversation[];
}) {
  const [conversations, setConversations] = useState(initiales);
  const t = TEXTES_CORBEAUX.liste;

  // Le serveur reste la référence : si la page est rendue à nouveau — retour
  // depuis un fil, navigation — on reprend ce qu'il donne.
  useEffect(() => setConversations(initiales), [initiales]);

  useRafraichissement(async () => {
    const reponse = await fetch("/api/corbeaux", { cache: "no-store" });
    if (!reponse.ok) return;
    const lu = (await reponse.json()) as { conversations: ResumeConversation[] };
    setConversations(lu.conversations);
    // Cette page-ci vient d'apprendre ce qui a bougé : autant que le bandeau
    // le sache en même temps qu'elle, plutôt qu'au tour suivant.
    signalerLectureCorbeaux();
  });

  if (conversations.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-silver/20 bg-void/40 px-6 py-12 text-center">
        <p className="font-body text-lg leading-relaxed text-parchment-dim">
          {t.vide}
        </p>
        <p className="mt-2 font-body text-sm italic leading-relaxed text-silver">
          {t.videAide}
        </p>
      </div>
    );
  }

  return (
    /* `grid-cols-1` et `min-w-0` ne sont pas décoratifs.
       Une colonne de grille vaut `auto` par défaut, et un élément de liste
       porte `min-width: auto` : le texte d'un corbeau élargissait donc la
       ligne au-delà de l'écran, et sur téléphone la date et la pastille des
       non-lus sortaient du cadre. `grid-cols-1` vaut `minmax(0, 1fr)`, qui
       contraint la colonne ; `min-w-0` lève le plancher de l'élément. Il faut
       les deux — le `truncate` plus bas ne peut rien tant que rien ne borne
       la largeur. */
    <ul aria-label={t.aria} className="grid grid-cols-1 gap-2">
      {conversations.map((conv) => (
        // **La carte est portée par l'élément de liste, plus par le lien.**
        // Un bouton ne s'imbrique pas dans un lien — c'est invalide, et le
        // clavier ne s'y retrouve pas. Le lien occupe la ligne, le bouton se
        // range à côté, et le cadre les entoure tous les deux.
        <li
          key={conv.id}
          className="flex min-w-0 items-center gap-1 rounded-sm border border-silver/12 bg-mist/40 pr-2 transition-colors duration-300 hover:border-silver/30 hover:bg-mist/60"
        >
          <Link
            href={`${ROUTES.corbeaux}/${conv.id}`}
            className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3 sm:px-5 sm:py-4"
          >
            <BlasonCorrespondant correspondant={conv.correspondant} />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={`truncate font-display text-[0.82rem] uppercase tracking-[0.1em] ${
                    conv.nonLus > 0
                      ? "font-bold text-parchment"
                      : "font-medium text-parchment-dim"
                  }`}
                >
                  {conv.correspondant?.prenomNom ?? TEXTES_CORBEAUX.administration.nom}
                </p>
                {/* L’instant voyage en ISO ; sa mise en forme est celle du
                    navigateur, seule juste pour qui lit — d’où le
                    `suppressHydrationWarning`, le serveur vivant en UTC. */}
                <time
                  dateTime={conv.dernierMessageLe}
                  suppressHydrationWarning
                  className="shrink-0 font-display text-[0.62rem] uppercase tracking-[0.12em] text-silver"
                >
                  {quandDansLaListe(conv.dernierMessageLe)}
                </time>
              </div>

              <p
                className={`mt-1 truncate font-body text-sm leading-relaxed ${
                  conv.nonLus > 0 ? "text-parchment" : "text-silver"
                }`}
              >
                {conv.extrait ?? t.videExtrait}
              </p>
            </div>

            {/* Les non-lus ne se signalent pas par la seule graisse du nom :
                la pastille porte le chiffre, et le texte hors écran le dit. */}
            {conv.nonLus > 0 ? (
              <>
                <span
                  aria-hidden="true"
                  className="flex min-w-[1.4rem] shrink-0 items-center justify-center rounded-full bg-aurora-teal px-2 py-1 font-display text-[0.62rem] font-bold leading-none text-void"
                >
                  {conv.nonLus > 9 ? "9+" : conv.nonLus}
                </span>
                <span className="sr-only">
                  {conv.nonLus === 1
                    ? t.unNonLuAria
                    : t.nonLusAria.replace("{n}", String(conv.nonLus))}
                </span>
              </>
            ) : null}
          </Link>

          {/* Le retrait se propose ici **et** dans la conversation. Depuis la
              liste, c'est le geste de quelqu'un qui fait le ménage sans
              vouloir rouvrir ce qu'il retire. */}
          <BoutonRetirerFil
            conversationId={conv.id}
            nom={
              conv.correspondant?.prenomNom ?? TEXTES_CORBEAUX.administration.nom
            }
            variante="liste"
            onRetire={() =>
              setConversations((liste) =>
                liste.filter((autre) => autre.id !== conv.id),
              )
            }
          />
        </li>
      ))}
    </ul>
  );
}
