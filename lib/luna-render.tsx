import "server-only";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Rendu des slides LUNA en PNG via satori (HTML/CSS → SVG) + resvg (SVG → PNG).
 * Remplace la génération par modèle d'image (gpt-image-1) : un modèle d'image
 * ne sait pas reproduire une typographie et une mise en page de marque
 * précises — il "dessine" du texte approximatif. Ici le texte est du vrai
 * texte vectoriel, la mise en page est déterministe, donc toujours fidèle à
 * la charte Luma.
 */

export interface LunaSlide {
  titre: string;
  corps: string;
  fond: "creme" | "vert" | "navy";
  style_titre: "sans" | "serif";
  label: string;
}

const PALETTE: Record<LunaSlide["fond"], { bg: string; text: string; sub: string }> = {
  creme: { bg: "#F0EDE6", text: "#1A1A1A", sub: "#1A1A1A" },
  vert: { bg: "#1A2E1A", text: "#FFFFFF", sub: "#F0EDE6" },
  navy: { bg: "#0D1117", text: "#FFFFFF", sub: "#F0EDE6" },
};

const ACCENT = "#1A3BFF";
const FOOTER_BG = "#1A1A1A";
const SIZE = 1080;

type FontEntry = { name: string; data: Buffer; weight: 400 | 500 | 600 | 900; style: "normal" | "italic" };

let fontsPromise: Promise<FontEntry[]> | null = null;
function loadFonts(): Promise<FontEntry[]> {
  if (!fontsPromise) {
    const dir = path.join(process.cwd(), "public", "fonts");
    fontsPromise = Promise.all([
      readFile(path.join(dir, "Inter-Black.woff")),
      readFile(path.join(dir, "Inter-SemiBold.woff")),
      readFile(path.join(dir, "Inter-Regular.woff")),
      readFile(path.join(dir, "PlayfairDisplay-Italic.woff")),
      readFile(path.join(dir, "PlayfairDisplay-Italic-Regular.woff")),
    ]).then(([black, semibold, regular, playfairMed, playfairReg]) => [
      { name: "Inter", data: black, weight: 900, style: "normal" },
      { name: "Inter", data: semibold, weight: 600, style: "normal" },
      { name: "Inter", data: regular, weight: 400, style: "normal" },
      { name: "Playfair Display", data: playfairMed, weight: 500, style: "italic" },
      { name: "Playfair Display", data: playfairReg, weight: 400, style: "italic" },
    ] as FontEntry[]);
  }
  return fontsPromise;
}

/** Taille de titre déterministe selon la longueur — évite un titre trop long de déborder du cadre. */
function titleFontSize(text: string, style: LunaSlide["style_titre"]): number {
  const len = text.length;
  const steps: [number, number][] =
    style === "serif"
      ? [[30, 68], [50, 58], [70, 50], [Infinity, 44]]
      : [[30, 78], [50, 66], [70, 56], [Infinity, 48]];
  for (const [max, size] of steps) {
    if (len <= max) return size;
  }
  return style === "serif" ? 44 : 48;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

export async function renderSlideToPng(slide: LunaSlide, index: number, total: number): Promise<string> {
  const palette = PALETTE[slide.fond];
  const fonts = await loadFonts();
  const corps = truncate(slide.corps, 220);
  const isLast = index === total - 1;

  const titleStyle =
    slide.style_titre === "serif"
      ? { fontFamily: "Playfair Display", fontStyle: "italic" as const, fontWeight: 500, lineHeight: 1.08 }
      : { fontFamily: "Inter", fontWeight: 900, letterSpacing: "-3px", lineHeight: 0.94 };

  const tree = (
    <div
      style={{
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        display: "flex",
        flexDirection: "column",
        backgroundColor: palette.bg,
        position: "relative",
      }}
    >
      {slide.label && (
        <div style={{ display: "flex", position: "absolute", top: "56px", left: "56px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              borderRadius: "50px",
              border: `1px solid ${ACCENT}`,
            }}
          >
            <div style={{ display: "flex", width: "6px", height: "6px", borderRadius: "3px", backgroundColor: ACCENT }} />
            <span
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: "14px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: palette.text,
              }}
            >
              {slide.label}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: "0 64px" }}>
        <span style={{ ...titleStyle, fontSize: `${titleFontSize(slide.titre, slide.style_titre)}px`, color: palette.text }}>
          {slide.titre}
        </span>
        <span
          style={{
            display: "flex",
            fontFamily: "Playfair Display",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "29px",
            lineHeight: 1.4,
            color: palette.sub,
            opacity: 0.72,
            marginTop: "26px",
          }}
        >
          {corps}
        </span>
      </div>

      <div style={{ display: "flex", position: "absolute", left: "64px", bottom: "128px" }}>
        <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "30px", color: ACCENT }}>→</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          backgroundColor: FOOTER_BG,
          padding: "0 32px",
        }}
      >
        <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "16px", color: "#FFFFFF" }}>● Luma</span>
        <span style={{ display: "flex", fontFamily: "Inter", fontWeight: 500, fontSize: "15px", color: "#FFFFFF" }}>
          {isLast ? "" : "Suite →"}
        </span>
      </div>
    </div>
  );

  const svg = await satori(tree, { width: SIZE, height: SIZE, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: SIZE } }).render().asPng();
  return `data:image/png;base64,${png.toString("base64")}`;
}
