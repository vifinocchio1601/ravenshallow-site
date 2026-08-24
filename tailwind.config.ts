import type { Config } from "tailwindcss";

/**
 * Palette de Ravenshallow.
 *
 * Les mêmes valeurs sont exposées en variables CSS dans `src/app/globals.css`
 * (`:root`) pour les styles écrits à la main et les `style` en ligne (couleurs
 * de maison, aurore). Les deux listes doivent rester synchronisées.
 *
 * Elles sont déclarées ici en hexadécimal — et non en `var(--x)` — pour que les
 * modificateurs d'opacité de Tailwind (`bg-mist/60`, `border-silver/10`…)
 * fonctionnent : Tailwind v3 ne sait pas injecter d'alpha dans un `var()`.
 */
const palette = {
  void: "#05070b",
  fjord: "#0d141c",
  mist: "#182430",
  "mist-2": "#212f3d",
  parchment: "#e9e1cd",
  "parchment-dim": "#b9b09a",
  "aurora-teal": "#3fd9c7",
  "aurora-violet": "#8a6fd6",
  ember: "#c97b3d",
  silver: "#8ea0b3",
  kaldrafn: "#4a7fa8",
  nattorm: "#8a5fd6",
  bryggeld: "#c97b3d",
  tideal: "#2fa89a",
};

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: palette,
      fontFamily: {
        display: ["var(--font-display)", "Cinzel", "Georgia", "serif"],
        body: ["var(--font-body)", "EB Garamond", "Georgia", "serif"],
      },
      maxWidth: {
        content: "72rem",
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
