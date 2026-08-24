/**
 * Silhouette de falaise en bas du hero : trois plans de montagnes sombres
 * superposés, du plus lointain (le plus clair) au plus proche (noir), qui se
 * fondent dans le fond de la section suivante.
 *
 * Les amplitudes des sommets sont volontairement irrégulières d'un pic à
 * l'autre, pour éviter l'effet « dents de scie ».
 */
export default function CliffSilhouette() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
    >
      <svg
        viewBox="0 0 1440 340"
        preserveAspectRatio="none"
        className="block h-[28vh] min-h-[160px] w-full sm:h-[32vh]"
      >
        {/* Plan lointain — crêtes hautes et découpées */}
        <path
          fill="#0a1018"
          d="M0 340 V246 L74 212 L98 224 L170 148 L216 192 L270 168 L320 208 L394 122 L438 178 L484 156 L550 206 L614 176 L656 200 L732 134 L786 186 L844 162 L904 212 L966 180 L1028 216 L1096 148 L1152 194 L1208 170 L1270 210 L1332 176 L1390 204 L1440 184 V340 Z"
        />

        {/* Plan médian */}
        <path
          fill="#070d15"
          d="M0 340 V278 L88 250 L144 266 L198 222 L260 260 L316 238 L382 270 L454 212 L508 254 L572 232 L642 268 L708 240 L770 264 L838 220 L906 258 L964 236 L1034 270 L1102 230 L1166 260 L1234 234 L1302 266 L1372 242 L1440 264 V340 Z"
        />

        {/* Falaise au premier plan — arête franche, plus haute côté large */}
        <path
          fill="#05070b"
          d="M0 340 V320 L118 312 L206 318 L268 300 L342 314 L410 296 L472 308 L522 286 L562 302 L618 274 L670 294 L726 262 L782 288 L832 256 L892 280 L948 244 L1012 274 L1072 238 L1138 270 L1200 234 L1266 264 L1332 230 L1402 260 L1440 242 V340 Z"
        />
      </svg>

      {/* Raccord doux avec la section suivante */}
      <div className="-mt-px h-16 bg-gradient-to-b from-void/80 to-void" />
    </div>
  );
}
