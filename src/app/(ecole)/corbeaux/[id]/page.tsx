import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Fil from "@/components/corbeaux/Fil";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { lireFil } from "@/lib/corbeaux/depot";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: TEXTES_CORBEAUX.metaTitre,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Un fil de la Tour.
 *
 * `lireFil` rend `null` aussi bien pour un fil inexistant que pour un fil où
 * ce compte ne figure pas, et la page répond 404 dans les deux cas. C’est
 * volontaire : distinguer les deux permettrait, en essayant des identifiants,
 * de savoir lesquels sont réels — donc qui écrit à qui.
 *
 * Le nom du correspondant ne figure pas dans le titre de l’onglet : il n’a
 * rien à faire dans un historique de navigation ni sur un écran partagé.
 */
export default async function FilPage({ params }: { params: { id: string } }) {
  const compte = await exigerAcces(ROUTES.corbeaux);
  const fil = await lireFil(compte, params.id);
  if (!fil) notFound();

  const correspondant = fil.conversation.correspondant;

  return (
    <main className="mx-auto flex max-w-content flex-col px-5 pb-10 pt-8 sm:px-8">
      <Fil
        initial={fil}
        destinataire={
          fil.conversation.avecAdministration || !correspondant
            ? { administration: true }
            : { membreId: correspondant.id }
        }
      />
    </main>
  );
}
