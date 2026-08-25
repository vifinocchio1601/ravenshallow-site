import type { Metadata } from "next";
import Link from "next/link";
import PageEtat from "@/components/dossier/PageEtat";
import { TEXTES_ETATS } from "@/lib/dossier/etats";
import { creerJeton, lienDossier } from "@/lib/dossier/jeton";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerEtat } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: "Ton dossier revient corrigé — Ravenshallow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Le dossier renvoyé en correction.
 *
 * C’est le moment où l’on perd un joueur : il a écrit sept cents signes, on
 * lui demande de revenir. Rien ne doit ressembler à un recommencement — d’où
 * la note d’abord, la saisie intacte derrière, et un seul bouton.
 *
 * Ce bouton mène à la fiche par un jeton frais, émis ici même : le joueur est
 * connecté, il n’a pas à retrouver le courriel reçu il y a trois jours. La
 * page `/dossier/[jeton]` recharge tout ce qu’il avait écrit.
 */
export default async function DossierCorrectionPage() {
  const compte = await exigerEtat(ROUTES.correction);

  const t = TEXTES_ETATS.correction;
  const p = TEXTES_ETATS.pages.correction;

  // Chemin relatif : le lien reste sur le domaine d’où l’on vient.
  const lien = lienDossier(
    await creerJeton(compte.id, compte.jetonVersion),
    "",
  );

  return (
    <PageEtat
      ton="correction"
      titre={t.titre}
      corps={t.corps}
      badge={t.badge}
      note={compte.noteAdmin}
      noteTitre={t.noteTitre}
      detail={<p>{p.detail}</p>}
    >
      <div className="mt-9">
        <Link href={lien} className="btn btn-solid">
          {t.action}
        </Link>
      </div>
    </PageEtat>
  );
}
