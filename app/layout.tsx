import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Apple SF Pro-like display face — clean, tight, modern.
const display = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Luma — Dashboard agents",
  description: "Pilotage des agents IA de Luma, agence IA à Montpellier.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Luma",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#F0EDE6",
  width: "device-width",
  initialScale: 1,
  // Nécessaire pour que env(safe-area-inset-*) soit non nul en mode standalone
  // (icône ajoutée à l'écran d'accueil) — sans ça, la nav du bas n'a aucun
  // padding de sécurité et ses icônes se retrouvent dans la bande réservée au
  // geste système "balayer pour revenir à l'accueil", qui intercepte le tap
  // avant qu'il n'atteigne la page (les onglets semblent alors ne réagir à
  // rien, alors que le reste de la page fonctionne normalement).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
