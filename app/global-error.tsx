"use client";

/**
 * Filet de sécurité ultime — si une erreur plante le layout racine lui-même
 * (rarissime, en dehors du cas dashboard couvert par app/dashboard/error.tsx).
 * Doit fournir son propre <html>/<body> : il remplace tout le layout racine.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "-apple-system, sans-serif", background: "#F0EDE6" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            textAlign: "center",
            padding: 24,
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", margin: 0 }}>
            Un problème est survenu.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#1A3BFF",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
