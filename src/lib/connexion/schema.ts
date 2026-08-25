import { z } from "zod";
import { MESSAGES_CONNEXION } from "./constantes";
import { MESSAGES } from "@/lib/dossier/constantes";
import { REGLES_MOT_DE_PASSE } from "@/lib/dossier/schema";

/**
 * Schémas de la connexion et de la réinitialisation.
 *
 * Même source de vérité pour le formulaire et pour la route : le bouton
 * d’envoi peut être réactivé depuis une console, le serveur revalide tout.
 */

export const schemaConnexion = z.object({
  email: z.string().trim().min(1, MESSAGES_CONNEXION.emailRequis),
  motDePasse: z.string().min(1, MESSAGES_CONNEXION.motDePasseRequis),
});

export type ValeursConnexion = z.infer<typeof schemaConnexion>;

/**
 * L’adresse n’est **pas** validée comme une adresse ici : un format refusé
 * côté client dirait « celle-ci n’est pas dans notre base » plus vite qu’un
 * essai. La seule réponse possible reste « adresse ou mot de passe
 * incorrect », et elle vient du serveur.
 */

export const schemaOubli = z.object({
  email: z.string().trim().email(MESSAGES.email),
});

/** Les trois mêmes règles que le dossier d’admission, sans exception. */
export const schemaNouveauMotDePasse = z
  .object({
    motDePasse: z
      .string()
      .refine(
        (v) =>
          REGLES_MOT_DE_PASSE.longueur(v) &&
          REGLES_MOT_DE_PASSE.majuscule(v) &&
          REGLES_MOT_DE_PASSE.chiffre(v),
        MESSAGES.motDePasse,
      ),
    confirmation: z.string(),
  })
  .refine((v) => v.motDePasse === v.confirmation, {
    message: MESSAGES.confirmation,
    path: ["confirmation"],
  });

export type ValeursNouveauMotDePasse = z.infer<typeof schemaNouveauMotDePasse>;
