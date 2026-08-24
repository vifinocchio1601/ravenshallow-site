import Aurora from "./Aurora";
import CliffSilhouette from "./CliffSilhouette";
import Starfield from "./Starfield";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-void"
    >
      {/* — Fond : aurore + étoiles + voiles de profondeur — */}
      <div aria-hidden="true" className="absolute inset-0">
        <Starfield />
        <Aurora />
        {/* Assombrit le bas pour laisser respirer le texte et la falaise */}
        <div className="absolute inset-0 bg-gradient-to-b from-void/20 via-void/45 to-void" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_35%,rgba(5,7,11,0.85)_100%)]" />
      </div>

      {/* — Contenu — */}
      <div className="relative z-20 mx-auto w-full max-w-content px-6 pb-[30vh] pt-28 sm:px-8 sm:pb-[26vh] md:pb-40 md:pt-32">
        <div className="max-w-3xl">
          <p className="eyebrow rise-in flex flex-wrap items-center gap-x-3 gap-y-1">
            <span aria-hidden="true" className="rune text-aurora-teal">
              ᚺᚨᚱᚦᚨᚾ
            </span>
            <span>École de magie · Côte de Norvège</span>
          </p>

          <h1
            className="rise-in mt-6 font-display text-[clamp(2.2rem,10vw,7.5rem)] font-bold leading-[0.95] tracking-[0.06em] text-parchment"
            style={{ animationDelay: "120ms" }}
          >
            Ravenshallow
          </h1>

          <p
            className="rise-in mt-7 max-w-2xl text-[clamp(1.05rem,2.4vw,1.35rem)] leading-relaxed text-parchment-dim text-balance"
            style={{ animationDelay: "240ms" }}
          >
            Un château dressé à flanc de falaise, entre mer, lac et forêt sombre
            — où l&apos;on enseigne encore ce que quatre fondateurs ont juré de
            garder scellé.
          </p>

          <div
            className="rise-in mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            style={{ animationDelay: "360ms" }}
          >
            <a href="#les-maisons" className="btn btn-solid">
              Découvrir les maisons
            </a>
            <a href="#la-fondation" className="btn btn-ghost">
              L&apos;histoire du château
            </a>
          </div>
        </div>
      </div>

      <CliffSilhouette />
    </section>
  );
}
