import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/layout/Logo";

export const metadata = { title: "Connexion — Luma" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2 rounded-full opacity-[0.18] blur-[120px]"
        style={{ background: "radial-gradient(circle, #1A3BFF 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-[400px] animate-scale-in">
        <div className="mb-8 text-center">
          <Logo className="justify-center text-4xl" />
          <p className="mt-3 text-sm text-muted">Dashboard agents — agence IA, Montpellier</p>
        </div>
        <div className="levo-card p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tightest text-ink">
            Connexion
          </h1>
          <p className="mt-1 text-sm text-muted">Accès réservé. Entre le mot de passe du dashboard.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-muted/70">
          © {new Date().getFullYear()} Luma. Tous droits réservés.
        </p>
      </div>
    </main>
  );
}
