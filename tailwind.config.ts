import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Levo palette
        background: "#ECEEF8",
        card: "#FFFFFF",
        accent: "#1A3BFF",
        ink: "#1A1A1A",
        sidebar: "#0D1117",
        // Agent accents
        luna: "#1A3BFF",
        orion: "#1D9E75",
        hermes: "#BA7517",
        veille: "#7B2FBE",
        // Functional
        muted: "#6B7280",
        line: "#E5E7EB",
        success: "#1D9E75",
        warning: "#BA7517",
        danger: "#DC2626",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.06)",
        card: "0 4px 24px rgba(16, 24, 40, 0.06)",
        lift: "0 8px 32px rgba(26, 59, 255, 0.12)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
