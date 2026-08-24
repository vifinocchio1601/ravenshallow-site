/**
 * Aurore boréale : quatre nappes de dégradés radiaux flous qui dérivent
 * lentement, composées en `mix-blend-mode: screen`.
 * L'animation est neutralisée par `prefers-reduced-motion` (voir globals.css).
 */
export default function Aurora() {
  return (
    <div aria-hidden="true" className="aurora">
      <div className="aurora__band aurora__band--teal" />
      <div className="aurora__band aurora__band--violet" />
      <div className="aurora__band aurora__band--pale" />
      <div className="aurora__band aurora__band--ember" />
    </div>
  );
}
