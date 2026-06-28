"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Visual-only login — no backend. Any submit opens the dashboard. */
export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    router.push("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Mot de passe
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          autoFocus
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Connexion…" : "Accéder au dashboard"}
      </Button>
    </form>
  );
}
