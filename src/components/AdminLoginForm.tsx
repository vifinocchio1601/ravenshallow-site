"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

/**
 * Formulaire de connexion. Le mot de passe part vers la route API, qui seule
 * connaît `ADMIN_PASSWORD` — rien de sensible ne transite par le bundle client.
 */
export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : "Mot de passe incorrect";
        setError(message);
        setPending(false);
        return;
      }

      // `refresh()` pour que le middleware revoie le nouveau cookie.
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Connexion impossible. Réessaie dans un instant.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <label
        htmlFor="admin-password"
        className="font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver"
      >
        Mot de passe
      </label>

      <input
        id="admin-password"
        type="password"
        name="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          if (error) setError(null);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "admin-password-error" : undefined}
        className="mt-3 w-full rounded-sm border border-silver/25 bg-mist/60 px-4 py-3 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
      />

      <button
        type="submit"
        disabled={pending}
        className="btn btn-solid mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Vérification…" : "Se connecter"}
      </button>

      <p
        id="admin-password-error"
        role="alert"
        aria-live="polite"
        className="mt-4 min-h-[1.25rem] text-sm text-ember"
      >
        {error}
      </p>
    </form>
  );
}
