# Ravenshallow

Site vitrine (page d'accueil) de **Ravenshallow**, école de magie nordique.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS 3
- `next/font` → Cinzel (display) + EB Garamond (corps)
- `next/image` pour tous les visuels
- Aucun stockage navigateur (`localStorage` / `sessionStorage`)

## Démarrer

Prérequis : Node.js 18.17+.

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000

## Assets

Les cinq blasons sont repris tels quels (PNG détourés, fond transparent).
La carte du monde arrivait avec une bande blanche de 19 px sur son bord droit,
visible une fois posée sur le fond sombre : elle a été rognée et ré-encodée en
`carte.jpg` (illustration photographique — le JPEG divise son poids par cinq
face à un PNG 24 bits).

## Déploiement

Aucun réglage particulier : `vercel` ou import du dépôt sur Vercel.

## Structure

```
src/
├─ app/
│  ├─ layout.tsx     — html/body, polices, métadonnées
│  ├─ fonts.ts       — Cinzel + EB Garamond via next/font
│  ├─ globals.css    — palette, aurore animée, prefers-reduced-motion
│  └─ page.tsx       — assemblage des sections
├─ components/
│  ├─ Nav.tsx            — nav fixe, opaque + backdrop-blur au scroll
│  ├─ Hero.tsx           — plein écran, aurore + étoiles + falaise
│  ├─ Aurora.tsx         — nappes radiales en mix-blend-mode: screen
│  ├─ Starfield.tsx      — étoiles déterministes (pas de mismatch SSR)
│  ├─ CliffSilhouette.tsx— silhouette de falaise en SVG
│  ├─ WorldSection.tsx   — les trois territoires + la carte
│  ├─ HousesSection.tsx  — Le Miroir de Brume
│  ├─ HouseCard.tsx      — blason, couleur de maison, survol
│  ├─ FoundingSection.tsx— la fondation (teaser, sans révélations)
│  ├─ Footer.tsx         — rejoindre + liens + copyright
│  ├─ WaitlistForm.tsx   — formulaire visuel (preventDefault)
│  ├─ SectionHeading.tsx — eyebrow runique + titre
│  └─ RuneDivider.tsx    — séparateur runique
└─ lib/content.ts        — maisons, territoires, liens, runes

public/crests/  — kaldrafn, nattorm, bryggeld, tideal, ravenshallow (.webp), carte (.jpg)
```

## Accessibilité & mouvement

- Focus clavier visible sur tous les éléments interactifs (`:focus-visible`).
- `prefers-reduced-motion: reduce` fige l'aurore et le scintillement des
  étoiles, coupe le scroll fluide et ramène les transitions à l'instantané.
- Les runes décoratives sont `aria-hidden`.
