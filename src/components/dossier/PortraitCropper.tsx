"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MESSAGES,
  PORTRAIT_HAUTEUR,
  PORTRAIT_LARGEUR,
  PORTRAIT_POIDS_MAX,
  PORTRAIT_QUALITE,
  TEXTES,
} from "@/lib/dossier/constantes";

/**
 * Import et recadrage du portrait au format 9:16.
 *
 * Le joueur dépose n’importe quelle image, la cadre dans une fenêtre 9:16,
 * et c’est l’image **recadrée** qui part au serveur — le fichier d’origine
 * ne quitte jamais le navigateur.
 *
 * Accessibilité : la zone de dépôt est un bouton (Entrée / Espace ouvrent le
 * sélecteur de fichier) ; le cadrage se pilote aux flèches du clavier, et le
 * zoom par un `input[type=range]` natif.
 */

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const PAS_CLAVIER = 12;

type Position = { x: number; y: number };

export default function PortraitCropper({
  valeur,
  onChange,
  message,
  tonMessage,
}: {
  /** Data URL de l’image déjà recadrée, ou chaîne vide. */
  valeur: string;
  onChange: (dataUrl: string) => void;
  message?: string | null;
  tonMessage?: "erreur" | "succes";
  }) {
  const [source, setSource] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [erreur, setErreur] = useState<string | null>(null);

  const cadreRef = useRef<HTMLDivElement | null>(null);
  const fichierRef = useRef<HTMLInputElement | null>(null);
  const glisse = useRef<{ actif: boolean; depart: Position; origine: Position }>(
    { actif: false, depart: { x: 0, y: 0 }, origine: { x: 0, y: 0 } },
  );

  // ── Chargement du fichier ──
  const charger = useCallback((fichier: File) => {
    setErreur(null);

    if (!fichier.type.startsWith("image/")) {
      setErreur(MESSAGES.portraitFormat);
      return;
    }
    if (fichier.size > PORTRAIT_POIDS_MAX) {
      setErreur(MESSAGES.portraitPoids);
      return;
    }

    const lecteur = new FileReader();
    lecteur.onload = () => {
      const dataUrl = String(lecteur.result);
      const img = new Image();
      img.onload = () => {
        setSource(dataUrl);
        setImage(img);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      };
      img.onerror = () => setErreur(MESSAGES.portraitFormat);
      img.src = dataUrl;
    };
    lecteur.onerror = () => setErreur(MESSAGES.portraitFormat);
    lecteur.readAsDataURL(fichier);
  }, []);

  // ── Bornes de déplacement : l’image couvre toujours le cadre ──
  const bornes = useCallback(() => {
    const cadre = cadreRef.current;
    if (!cadre || !image) return { x: 0, y: 0 };

    const l = cadre.clientWidth;
    const h = cadre.clientHeight;
    const echelle =
      Math.max(l / image.naturalWidth, h / image.naturalHeight) * zoom;
    const largeur = image.naturalWidth * echelle;
    const hauteur = image.naturalHeight * echelle;

    return {
      x: Math.max(0, (largeur - l) / 2),
      y: Math.max(0, (hauteur - h) / 2),
    };
  }, [image, zoom]);

  const contraindre = useCallback(
    (p: Position): Position => {
      const b = bornes();
      return {
        x: Math.min(b.x, Math.max(-b.x, p.x)),
        y: Math.min(b.y, Math.max(-b.y, p.y)),
      };
    },
    [bornes],
  );

  useEffect(() => {
    setPosition((p) => contraindre(p));
  }, [zoom, contraindre]);

  // ── Souris / tactile ──
  function debutGlisse(clientX: number, clientY: number) {
    glisse.current = {
      actif: true,
      depart: { x: clientX, y: clientY },
      origine: position,
    };
  }

  function pendantGlisse(clientX: number, clientY: number) {
    if (!glisse.current.actif) return;
    const { depart, origine } = glisse.current;
    setPosition(
      contraindre({
        x: origine.x + (clientX - depart.x),
        y: origine.y + (clientY - depart.y),
      }),
    );
  }

  // ── Clavier ──
  function auClavier(evenement: React.KeyboardEvent) {
    if (!image) return;
    const deplacements: Record<string, Position> = {
      ArrowLeft: { x: -PAS_CLAVIER, y: 0 },
      ArrowRight: { x: PAS_CLAVIER, y: 0 },
      ArrowUp: { x: 0, y: -PAS_CLAVIER },
      ArrowDown: { x: 0, y: PAS_CLAVIER },
    };
    const delta = deplacements[evenement.key];
    if (!delta) return;
    evenement.preventDefault();
    setPosition((p) => contraindre({ x: p.x + delta.x, y: p.y + delta.y }));
  }

  // ── Export : c’est l’image recadrée qui part ──
  function valider() {
    const cadre = cadreRef.current;
    if (!cadre || !image) return;

    const toile = document.createElement("canvas");
    toile.width = PORTRAIT_LARGEUR;
    toile.height = PORTRAIT_HAUTEUR;
    const ctx = toile.getContext("2d");
    if (!ctx) return;

    // Le cadre affiché et la toile ont le même ratio : un seul facteur suffit
    // pour passer des pixels d’écran aux pixels d’export.
    const facteur = PORTRAIT_LARGEUR / cadre.clientWidth;
    const echelle =
      Math.max(
        cadre.clientWidth / image.naturalWidth,
        cadre.clientHeight / image.naturalHeight,
      ) * zoom;

    const largeur = image.naturalWidth * echelle * facteur;
    const hauteur = image.naturalHeight * echelle * facteur;
    const x = (PORTRAIT_LARGEUR - largeur) / 2 + position.x * facteur;
    const y = (PORTRAIT_HAUTEUR - hauteur) / 2 + position.y * facteur;

    ctx.fillStyle = "#05070b";
    ctx.fillRect(0, 0, PORTRAIT_LARGEUR, PORTRAIT_HAUTEUR);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, x, y, largeur, hauteur);

    onChange(toile.toDataURL("image/jpeg", PORTRAIT_QUALITE));
    setSource(null);
    setImage(null);
  }

  function reprendre() {
    onChange("");
    setSource(null);
    setImage(null);
    setErreur(null);
    fichierRef.current?.click();
  }

  const textes = TEXTES.champs.portrait;
  const messageAffiche = erreur ?? message;
  const tonAffiche = erreur ? "erreur" : tonMessage;

  return (
    <div>
      <input
        ref={fichierRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const fichier = e.target.files?.[0];
          if (fichier) charger(fichier);
          e.target.value = "";
        }}
      />

      <div className="grid gap-6 sm:grid-cols-[10rem_1fr] sm:items-start">
        {/* ── Cadre 9:16 ── */}
        <div className="mx-auto w-40 sm:mx-0">
          {image && source ? (
            <div
              ref={cadreRef}
              tabIndex={0}
              role="application"
              aria-label={textes.deplacer}
              onKeyDown={auClavier}
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                debutGlisse(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => pendantGlisse(e.clientX, e.clientY)}
              onPointerUp={() => (glisse.current.actif = false)}
              onPointerCancel={() => (glisse.current.actif = false)}
              className="relative aspect-[9/16] w-full cursor-move touch-none overflow-hidden rounded-sm border border-aurora-teal/40 bg-void"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={source}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fichierRef.current?.click()}
              aria-label={textes.importLabel}
              className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-silver/30 bg-mist/40 transition-colors duration-300 hover:border-aurora-teal/50 hover:bg-mist/70"
            >
              {valeur ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={valeur}
                  alt="Aperçu du portrait recadré"
                  className="h-full w-full rounded-sm object-cover"
                />
              ) : (
                <>
                  <span
                    aria-hidden="true"
                    className="font-display text-2xl text-silver/70"
                  >
                    +
                  </span>
                  <span className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-silver">
                    9 : 16
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* ── Aide et commandes ── */}
        <div className="min-w-0">
          <p className="font-body text-sm italic leading-relaxed text-silver">
            {textes.aide}
          </p>

          {image ? (
            <div className="mt-5">
              <label
                htmlFor="portrait-zoom"
                className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-parchment-dim"
              >
                {textes.zoom}
              </label>
              <input
                id="portrait-zoom"
                type="range"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-2 w-full accent-[color:var(--aurora-teal)]"
              />
              <p className="mt-1 font-body text-sm italic text-silver">
                {textes.deplacer}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={valider} className="btn btn-solid">
                  {textes.valider}
                </button>
                <button
                  type="button"
                  onClick={() => fichierRef.current?.click()}
                  className="btn btn-ghost"
                >
                  {textes.changer}
                </button>
              </div>
            </div>
          ) : valeur ? (
            <button
              type="button"
              onClick={reprendre}
              className="btn btn-ghost mt-5"
            >
              {textes.changer}
            </button>
          ) : null}

          <p
            role={messageAffiche && tonAffiche === "erreur" ? "alert" : undefined}
            aria-live="polite"
            className={`mt-3 min-h-[1.1rem] font-display text-[0.68rem] uppercase tracking-[0.12em] ${
              tonAffiche === "succes" ? "text-aurora-teal" : "text-ember"
            }`}
          >
            {messageAffiche}
          </p>
        </div>
      </div>
    </div>
  );
}
