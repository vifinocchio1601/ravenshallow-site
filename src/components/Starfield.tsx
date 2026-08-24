/**
 * Champ d'étoiles léger.
 * Les positions sont tirées d'un générateur pseudo-aléatoire *déterministe*
 * (graine fixe) : le rendu serveur et le rendu client sont identiques, donc
 * pas de désynchronisation d'hydratation.
 */

const STAR_COUNT = 90;

function makeStars(seed: number) {
  let state = seed;
  const next = () => {
    // LCG (Numerical Recipes) — suffisant et reproductible.
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    left: next() * 100,
    top: next() * 88,
    size: 0.7 + next() * 1.6,
    opacity: 0.25 + next() * 0.6,
    duration: 4 + next() * 7,
    delay: next() * 8,
  }));
}

const STARS = makeStars(20240824);

export default function Starfield() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {STARS.map((star) => (
        <span
          key={star.id}
          className="star absolute rounded-full bg-parchment"
          style={
            {
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              "--star-opacity": star.opacity,
              "--twinkle-duration": `${star.duration}s`,
              "--twinkle-delay": `${star.delay}s`,
              opacity: star.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
