import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/layout/Logo";

export const metadata = {
  title: "Connexion — Levo",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo className="text-4xl" />
          <p className="mt-3 text-sm text-muted">
            Dashboard agents — agence IA, Montpellier
          </p>
        </div>

        <div className="levo-card p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Connexion
          </h1>
          <p className="mt-1 text-sm text-muted">
            Accès réservé. Entre le mot de passe du dashboard.
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted/70">
          © {new Date().getFullYear()} Levo. Tous droits réservés.
        </p>
      </div>
    </main>
  );
}
