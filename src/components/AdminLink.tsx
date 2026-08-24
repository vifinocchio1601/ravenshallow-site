import Link from "next/link";
import { KeyRound } from "lucide-react";

/**
 * Accès discret à la zone d'administration, en bas à droite de l'écran.
 * Volontairement peu visible au repos, mais trouvable — et atteignable au
 * clavier, où il reprend sa pleine opacité.
 */
export default function AdminLink() {
  return (
    <Link
      href="/admin"
      aria-label="Administration"
      title="Administration"
      className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-sm text-silver opacity-40 transition-[opacity,color] duration-300 hover:text-aurora-teal hover:opacity-100 focus-visible:opacity-100"
    >
      <KeyRound aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" />
    </Link>
  );
}
