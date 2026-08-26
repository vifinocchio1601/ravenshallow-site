import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Fil from "@/components/corbeaux/Fil";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { filAdministrationDe } from "@/lib/corbeaux/depot";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: TEXTES_CORBEAUX.metaTitre,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * La porte du fil de l’administration.
 *
 * Elle ne crée rien : s’il existe déjà, elle y renvoie ; sinon elle ouvre un
 * fil vide, et c’est le premier corbeau envoyé qui le fera naître. Créer une
 * conversation à la simple visite d’une page remplirait la boîte du staff de
 * fils muets, ouverts par curiosité.
 *
 * Cette adresse reste accessible à un membre suspendu — c’est la voie de
 * recours de l’article 8.5, et la seule qui lui reste.
 */
export default async function AdministrationPage() {
  const compte = await exigerAcces(ROUTES.corbeaux);

  const existant = await filAdministrationDe(compte.id);
  if (existant) redirect(`${ROUTES.corbeaux}/${existant}`);

  return (
    <main className="mx-auto flex max-w-content flex-col px-5 pb-10 pt-8 sm:px-8">
      <Fil initial={null} destinataire={{ administration: true }} />
    </main>
  );
}
