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
        // Levo brand palette — crème + navy + blue accent (cf. docs/reference)
        background: "#F0EDE6",
        surface: "#F6F3EC",
        cream: "#F0EDE6",
        forest: "#1A2E1A",
        card: "#FFFFFF",
        accent: "#1A3BFF",
        "accent-soft": "#4E66FF",
        ink: "#1A1A1A",
        sidebar: "#0D1117",
        // Agent accents
        luna: "#1A3BFF",
        orion: "#1D9E75",
        hermes: "#BA7517",
        veille: "#7B2FBE",
        // Functional
        muted: "#7A766C",
        line: "#E4DFD3",
        success: "#1D9E75",
        warning: "#BA7517",
        danger: "#E5484D",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(16, 24, 40, 0.05)",
        soft: "0 1px 2px rgba(16, 24, 40, 0.04), 0 2px 6px -2px rgba(16, 24, 40, 0.06)",
        card: "0 1px 3px rgba(16, 24, 40, 0.04), 0 12px 28px -12px rgba(16, 24, 40, 0.12)",
        lift: "0 2px 6px rgba(16, 24, 40, 0.06), 0 22px 48px -16px rgba(16, 24, 40, 0.22)",
        ring: "inset 0 0 0 1px rgba(16, 24, 40, 0.05)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
        spring: "cubic-bezier(0.34, 1.4, 0.64, 1)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        rise: "rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
