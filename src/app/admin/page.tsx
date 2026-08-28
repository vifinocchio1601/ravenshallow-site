import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import AdminCard from "@/components/AdminCard";
import AdminEmptyState from "@/components/AdminEmptyState";
import { TEXTES_ANNONCES } from "@/lib/annonces/constantes";
import { listerAnnonces } from "@/lib/annonces/depot";
import { TEXTES_CALENDRIER } from "@/lib/calendrier/constantes";
import { lireLeCalendrier } from "@/lib/calendrier/depot";
import { TEXTES_SALON } from "@/lib/salon/constantes";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { courrierEnAttente } from "@/lib/corbeaux/courrier";
import { signalementsEnAttente } from "@/lib/corbeaux/moderation";
import { TEXTES_POUVOIRS } from "@/lib/forum/constantes";
import { TEXTES_POINTS } from "@/lib/points/constantes";

export const metadata: Metadata = {
  title: "Administration — Ravenshallow",
  robots: { index: false, follow: false },
};

// À remplacer par l'URL exacte du projet une fois connue
// (https://vercel.com/<équipe>/<projet>/analytics).
const VERCEL_ANALYTICS_URL = "https://vercel.com/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [enAttente, lettresEnAttente, affichees, calendrier] =
    await Promise.all([
      signalementsEnAttente(),
      courrierEnAttente(),
      listerAnnonces(),
      lireLeCalendrier(),
    ]);

  // Ce que la carte annonce : ce qui vient, jamais le total. Une carte qui
  // dirait « 14 dates » sur un calendrier entièrement passé serait fausse
  // sans être inexacte.
  const datesAVenir = calendrier.aVenir.length;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(63,217,199,0.07)_0%,transparent_72%)]"
      />

      <div className="relative mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        {/* — En-tête — */}
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-silver/10 pb-8">
          <div>
            <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
              <span aria-hidden="true" className="rune text-aurora-teal">
                ᚨᛞᛗᛁᚾ
              </span>
              <span>· Accès restreint</span>
            </p>
            <h1 className="mt-3 font-display text-[clamp(1.9rem,6vw,2.75rem)] font-bold leading-[1.1] tracking-[0.04em] text-parchment">
              Administration
            </h1>
          </div>

          {/* Déconnexion en POST : un simple lien ne doit pas pouvoir la
              déclencher depuis l'extérieur. Un formulaire natif suffit, la
              page reste un composant serveur. */}
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
            >
              Se déconnecter
            </button>
          </form>
        </header>

        {/* — Tableau de bord — */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <AdminCard
            rune="ᛏᚨᛚ"
            eyebrow="Trafic"
            title="Statistiques de visite"
          >
            <p className="leading-[1.7] text-parchment-dim">
              Les statistiques de trafic sont gérées par Vercel Analytics.
            </p>

            <a
              href={VERCEL_ANALYTICS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost mt-6"
            >
              Voir les statistiques complètes
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          </AdminCard>

          <AdminCard rune="ᛗᛁᚱ" eyebrow="Dossiers à lire" title="Inscriptions">
            <p className="leading-[1.7] text-parchment-dim">
              Les dossiers déposés attendent une lecture : accepter, renvoyer
              en correction ou refuser.
            </p>
            <Link href="/admin/inscriptions" className="btn btn-ghost mt-6">
              Ouvrir les inscriptions
            </Link>
          </AdminCard>

          <AdminCard rune="ᛖᛚᚡ" eyebrow="L’école" title="Liste des membres">
            <p className="leading-[1.7] text-parchment-dim">
              Les dossiers acceptés : âge, fonction et statut d’accès se
              modifient ici.
            </p>
            <Link href="/admin/membres" className="btn btn-ghost mt-6">
              Ouvrir la liste
            </Link>
          </AdminCard>

          {/* Le Grand Hall.
              Le seul endroit officiel où annoncer une modification du
              règlement : le préambule le dit, et lui donne sept jours pour
              entrer en vigueur. */}
          <AdminCard
            rune="ᛗᚨᛚ"
            eyebrow={TEXTES_ANNONCES.administration.carteEyebrow}
            title={TEXTES_ANNONCES.administration.carteTitre}
          >
            <p className="leading-[1.7] text-parchment-dim">
              {TEXTES_ANNONCES.administration.carteAccroche}
            </p>
            <p className="mt-4 font-display text-[0.68rem] uppercase tracking-[0.18em] text-silver">
              {affichees.length === 0
                ? TEXTES_ANNONCES.administration.carteAucune
                : affichees.length === 1
                  ? TEXTES_ANNONCES.administration.carteUneAffichee
                  : TEXTES_ANNONCES.administration.carteAffichees.replace(
                      "{n}",
                      String(affichees.length),
                    )}
            </p>
            <Link href="/admin/annonces" className="btn btn-ghost mt-6">
              {TEXTES_ANNONCES.administration.carteLien}
            </Link>
          </AdminCard>

          {/* Le calendrier.
              Même lieu, même règle : aucune permission attribuable ne l'ouvre.
              Il vit à côté des annonces parce qu'on écrit souvent les deux le
              même jour — la date au calendrier, le détail en annonce. */}
          <AdminCard
            rune="ᛃᚨᚱ"
            eyebrow={TEXTES_CALENDRIER.administration.carteEyebrow}
            title={TEXTES_CALENDRIER.administration.carteTitre}
          >
            <p className="leading-[1.7] text-parchment-dim">
              {TEXTES_CALENDRIER.administration.carteAccroche}
            </p>
            <p className="mt-4 font-display text-[0.68rem] uppercase tracking-[0.18em] text-silver">
              {datesAVenir === 0
                ? TEXTES_CALENDRIER.administration.carteAucune
                : datesAVenir === 1
                  ? TEXTES_CALENDRIER.administration.carteUneAVenir
                  : TEXTES_CALENDRIER.administration.carteAVenir.replace(
                      "{n}",
                      String(datesAVenir),
                    )}
            </p>
            <Link href="/admin/calendrier" className="btn btn-ghost mt-6">
              {TEXTES_CALENDRIER.administration.carteLien}
            </Link>
          </AdminCard>

          {/* Le courrier.
              Séparé des signalements, et pas par commodité : ce ne sont pas
              les mêmes gestes, et mélanger une question anodine avec un
              signalement de harcèlement dans la même file est le meilleur
              moyen de traiter les deux mal. */}
          <AdminCard
            rune="ᛒᚱᛖᚡ"
            eyebrow={TEXTES_CORBEAUX.courrier.eyebrow}
            title={TEXTES_CORBEAUX.courrier.titre}
          >
            <p className="leading-[1.7] text-parchment-dim">
              {TEXTES_CORBEAUX.courrier.accroche}
            </p>
            {lettresEnAttente > 0 ? (
              <p className="mt-4 font-display text-[0.68rem] uppercase tracking-[0.18em] text-aurora-teal">
                {lettresEnAttente === 1
                  ? TEXTES_CORBEAUX.courrier.unEnAttente
                  : TEXTES_CORBEAUX.courrier.enAttente.replace(
                      "{n}",
                      String(lettresEnAttente),
                    )}
              </p>
            ) : null}
            <Link href="/admin/courrier" className="btn btn-ghost mt-6">
              {TEXTES_CORBEAUX.courrier.lien}
            </Link>
          </AdminCard>

          {/* Les salons.
              Le seul écran du site où le staff lit une conversation — et il
              est légitime parce qu'un salon est une PIÈCE, pas une
              correspondance. Sans lui, le pouvoir d'en retirer un message
              serait théorique : la page /maison exige une maison, qu'une
              directrice n'a pas. */}
          <AdminCard
            rune="ᛊᚨᛚ"
            eyebrow={TEXTES_SALON.administration.carteEyebrow}
            title={TEXTES_SALON.administration.carteTitre}
          >
            <p className="leading-[1.7] text-parchment-dim">
              {TEXTES_SALON.administration.carteAccroche}
            </p>
            <Link href="/admin/salons" className="btn btn-ghost mt-6">
              {TEXTES_SALON.administration.carteLien}
            </Link>
          </AdminCard>

          {/* Les signalements.
              Le compteur est relu à chaque affichage — la page est
              `force-dynamic` —, et ne dit rien du contenu : combien attendent,
              rien de plus. */}
          <AdminCard
            rune="ᚱᚨᚡ"
            eyebrow={TEXTES_CORBEAUX.moderation.eyebrow}
            title={TEXTES_CORBEAUX.moderation.titre}
          >
            <p className="leading-[1.7] text-parchment-dim">
              {TEXTES_CORBEAUX.moderation.accroche}
            </p>
            <p className="mt-3 font-body text-sm italic leading-relaxed text-silver">
              {TEXTES_CORBEAUX.moderation.limite}
            </p>
            {enAttente > 0 ? (
              <p className="mt-4 font-display text-[0.68rem] uppercase tracking-[0.18em] text-aurora-teal">
                {enAttente === 1
                  ? TEXTES_CORBEAUX.moderation.unEnAttente
                  : TEXTES_CORBEAUX.moderation.enAttente.replace(
                      "{n}",
                      String(enAttente),
                    )}
              </p>
            ) : null}
            <Link href="/admin/signalements" className="btn btn-ghost mt-6">
              {TEXTES_CORBEAUX.moderation.lien}
            </Link>
          </AdminCard>

          {/* Les pouvoirs.
              Séparés de la liste des membres : celle-ci répond à « que peut
              Sigrid ? », celle-là à « qui peut clore une scène ? ». Une
              permission accordée en juin et oubliée en décembre ne se voit
              que sur la seconde. */}
          <AdminCard
            rune="ᛊᛖᚷ"
            eyebrow={TEXTES_POUVOIRS.eyebrow}
            title={TEXTES_POUVOIRS.titre}
          >
            <p className="leading-[1.7] text-parchment-dim">
              {TEXTES_POUVOIRS.accroche}
            </p>
            <Link href="/admin/pouvoirs" className="btn btn-ghost mt-6">
              {TEXTES_POUVOIRS.lien}
            </Link>
          </AdminCard>

          {/* Les points.
              Séparés des pouvoirs, et pas par commodité : accorder une charge
              et retirer des points à une maison n'ont ni le même rythme ni le
              même public. Les seconds s'affichent devant tout le monde. */}
          <AdminCard
            rune="ᛏᚢᚱ"
            eyebrow={TEXTES_POINTS.admin.eyebrow}
            title={TEXTES_POINTS.admin.titre}
          >
            <p className="leading-[1.7] text-parchment-dim">
              {TEXTES_POINTS.admin.accroche}
            </p>
            <Link href="/admin/points" className="btn btn-ghost mt-6">
              Ouvrir les compteurs
            </Link>
          </AdminCard>

          {/* La clôture d'année.
              À part, et volontairement peu accessible : c'est le geste le plus
              irréversible du site, et il se fait deux fois par an. */}
          <AdminCard
            rune="ᛊᛚᚢᛏ"
            eyebrow={TEXTES_POINTS.cloture.eyebrow}
            title={TEXTES_POINTS.cloture.titre}
          >
            <p className="leading-[1.7] text-parchment-dim">
              {TEXTES_POINTS.cloture.accroche}
            </p>
            <Link href="/admin/cloture" className="btn btn-ghost mt-6">
              Ouvrir la clôture
            </Link>
          </AdminCard>

          {/* Les absences.
              Séparées de la liste des membres : celle-ci répond à « que
              devient Sigrid ? », celle-là à « qui n'est pas revenu ? ». La
              première est triée par nom, et l'absent s'y perd. */}
          <AdminCard
            rune="ᚠᚱᚨ"
            eyebrow={TEXTES_POINTS.absences.eyebrow}
            title={TEXTES_POINTS.absences.titre}
          >
            <p className="leading-[1.7] text-parchment-dim">
              {TEXTES_POINTS.absences.accroche}
            </p>
            <Link href="/admin/absences" className="btn btn-ghost mt-6">
              Ouvrir les absences
            </Link>
          </AdminCard>

          <AdminCard rune="ᚹᛁᛏ" eyebrow="Assistance" title="Assistant IA">
            <AdminEmptyState>Fonctionnalité à venir.</AdminEmptyState>
          </AdminCard>
        </div>
      </div>
    </main>
  );
}
