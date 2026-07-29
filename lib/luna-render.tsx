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
 *
 * 5 gabarits (pas qu'un seul skeleton recoloré) pour une vraie variété
 * structurelle d'un post à l'autre, et pour éviter que chaque slide ait le
 * même excès d'espace vide : "minimal" (punchline, aéré), "liste" (points
 * denses type listicle), "chiffre" (stat géante en héros), "cta" (titre +
 * bouton, pour une slide de clôture/action), "comparaison" (avant/après en
 * 2 colonnes).
 */

export type LunaGabarit = "minimal" | "liste" | "chiffre" | "cta" | "comparaison";

export interface LunaComparaisonColonne {
  titre: string;
  points: string[];
}

export interface LunaSlide {
  titre: string;
  corps: string;
  fond: "creme" | "vert" | "navy";
  style_titre: "sans" | "serif";
  label: string;
  gabarit?: LunaGabarit;
  /** Gabarit "liste" : 2-4 points courts. */
  points?: string[];
  /** Gabarit "chiffre" : la statistique géante affichée en héros (ex. "3h", "90%"). */
  chiffre?: string;
  /** Gabarit "cta" : le texte du bouton (ex. "Réserver mon audit gratuit"). */
  bouton?: string;
  /** Gabarit "comparaison" : 2 colonnes (sans/avec, avant/après...). */
  comparaison?: { gauche: LunaComparaisonColonne; droite: LunaComparaisonColonne };
  /** Mots/phrases à surligner (bandeau noir), extraits exacts de `corps` (minimal) ou d'un point (liste). */
  surlignes?: string[];
  /** Citation courte affichée dans une capsule ronde après le corps (gabarit "minimal" uniquement). */
  citation?: string;
  /**
   * Prompt d'une photo de fond SANS TEXTE (texture/scène uniquement — le
   * texte reste rendu par satori, jamais par le modèle d'image). Facultatif,
   * sur quelques slides seulement. Généré séparément (lib/openai.ts) puis
   * passé en data URI à renderSlideToPng — ce champ ne contient que le
   * prompt, pas l'image elle-même.
   */
  photo_prompt?: string;
}

const PALETTE: Record<LunaSlide["fond"], { bg: string; text: string; sub: string; muted: string }> = {
  creme: { bg: "#F0EDE6", text: "#1A1A1A", sub: "#1A1A1A", muted: "rgba(26,26,26,0.06)" },
  vert: { bg: "#1A2E1A", text: "#FFFFFF", sub: "#F0EDE6", muted: "rgba(255,255,255,0.08)" },
  navy: { bg: "#0D1117", text: "#FFFFFF", sub: "#F0EDE6", muted: "rgba(255,255,255,0.08)" },
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

/** Taille de police déterministe selon la longueur — évite un texte trop long de déborder du cadre. */
function scaledFontSize(text: string, steps: [number, number][], fallback: number): number {
  for (const [max, size] of steps) {
    if (text.length <= max) return size;
  }
  return fallback;
}

function titleFontSize(text: string, style: LunaSlide["style_titre"]): number {
  return style === "serif"
    ? scaledFontSize(text, [[30, 68], [50, 58], [70, 50], [Infinity, 44]], 44)
    : scaledFontSize(text, [[30, 78], [50, 66], [70, 56], [Infinity, 48]], 48);
}

function statFontSize(text: string): number {
  return scaledFontSize(text, [[4, 190], [8, 150], [14, 110]], 80);
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Découpe `text` en segments normaux/surlignés pour un rendu type "surligneur". */
function splitHighlights(text: string, highlights: string[] | undefined): { text: string; hl: boolean }[] {
  const terms = (highlights ?? []).map((h) => h.trim()).filter(Boolean);
  if (terms.length === 0) return [{ text, hl: false }];
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${sorted.map(escapeRegExp).join("|")})`, "g");
  return text
    .split(re)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, hl: terms.some((t) => t.toLowerCase() === part.toLowerCase()) }));
}

function HighlightedText({
  text,
  highlights,
  style,
}: {
  text: string;
  highlights: string[] | undefined;
  style: Record<string, unknown>;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", ...style }}>
      {splitHighlights(text, highlights).map((seg, i) =>
        seg.hl ? (
          <span key={i} style={{ color: "#FFFFFF", backgroundColor: FOOTER_BG, padding: "2px 8px", margin: "2px 4px 2px 0" }}>
            {seg.text}
          </span>
        ) : (
          <span key={i} style={{ opacity: 0.72 }}>
            {seg.text}
          </span>
        ),
      )}
    </div>
  );
}

/**
 * Fallback emoji : satori ne sait pas dessiner de glyphes couleur (aucune de
 * nos polices n'en contient). `graphemeImages` exige une map à clés connues
 * à l'avance (Object.assign en interne ne déclenche pas de Proxy paresseux) —
 * on utilise donc `loadAdditionalAsset`, appelé à la volée pour tout segment
 * non couvert par les polices fournies, qui va chercher le SVG Twemoji.
 */
async function loadAdditionalAsset(code: string, segment: string): Promise<string> {
  if (code !== "emoji") return "";
  const codepoints = Array.from(segment)
    .map((c) => c.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-");
  const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const svgText = await res.text();
    return `data:image/svg+xml;base64,${Buffer.from(svgText).toString("base64")}`;
  } catch (err) {
    console.error("[luna:emoji-fallback]", err);
    return "";
  }
}

function Badge({ label, color }: { label: string; color: string }) {
  if (!label) return null;
  return (
    <div style={{ display: "flex", position: "absolute", top: "56px", left: "56px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 16px", borderRadius: "50px", border: `1px solid ${ACCENT}` }}>
        <div style={{ display: "flex", width: "6px", height: "6px", borderRadius: "3px", backgroundColor: ACCENT }} />
        <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase", color }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function Footer({ isLast }: { isLast: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px", backgroundColor: FOOTER_BG, padding: "0 32px" }}>
      <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "16px", color: "#FFFFFF" }}>● Luma</span>
      <span style={{ display: "flex", fontFamily: "Inter", fontWeight: 500, fontSize: "15px", color: "#FFFFFF" }}>{isLast ? "" : "Suite →"}</span>
    </div>
  );
}

function Arrow() {
  return (
    <div style={{ display: "flex", position: "absolute", left: "64px", bottom: "128px" }}>
      <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "30px", color: ACCENT }}>→</span>
    </div>
  );
}

function MinimalBody({ slide, palette }: { slide: LunaSlide; palette: (typeof PALETTE)[LunaSlide["fond"]] }) {
  const titleStyle =
    slide.style_titre === "serif"
      ? { fontFamily: "Playfair Display", fontStyle: "italic" as const, fontWeight: 500, lineHeight: 1.08 }
      : { fontFamily: "Inter", fontWeight: 900, letterSpacing: "-3px", lineHeight: 0.94 };
  const corps = truncate(slide.corps, 220);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: "0 64px" }}>
      <span style={{ ...titleStyle, fontSize: `${titleFontSize(slide.titre, slide.style_titre)}px`, color: palette.text }}>{slide.titre}</span>
      <HighlightedText
        text={corps}
        highlights={slide.surlignes}
        style={{ fontFamily: "Playfair Display", fontStyle: "italic", fontWeight: 400, fontSize: "29px", lineHeight: 1.5, marginTop: "26px", color: palette.sub }}
      />
      {slide.citation && (
        <div style={{ display: "flex", marginTop: "22px" }}>
          <div style={{ display: "flex", backgroundColor: "#0D1117", borderRadius: "50px", padding: "12px 24px", transform: "rotate(-1.5deg)" }}>
            <span style={{ fontFamily: "Playfair Display", fontStyle: "italic", fontWeight: 500, fontSize: "24px", color: "#FFFFFF" }}>{slide.citation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ListeBody({ slide, palette }: { slide: LunaSlide; palette: (typeof PALETTE)[LunaSlide["fond"]] }) {
  const points = (slide.points ?? []).slice(0, 5).map((p) => truncate(p, 90));
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: "0 64px" }}>
      <span style={{ fontFamily: "Inter", fontWeight: 900, letterSpacing: "-2px", lineHeight: 0.98, fontSize: `${titleFontSize(slide.titre, "sans") - 6}px`, color: palette.text }}>
        {slide.titre}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "32px" }}>
        {points.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            <span style={{ display: "flex", fontFamily: "Inter", fontWeight: 700, fontSize: "24px", color: ACCENT }}>—</span>
            <HighlightedText
              text={p}
              highlights={slide.surlignes}
              style={{ fontFamily: "Inter", fontWeight: 600, fontSize: "25px", lineHeight: 1.4, color: palette.text, flex: 1 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChiffreBody({ slide, palette }: { slide: LunaSlide; palette: (typeof PALETTE)[LunaSlide["fond"]] }) {
  const chiffre = slide.chiffre ?? "";
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: "0 64px" }}>
      <span style={{ fontFamily: "Inter", fontWeight: 900, letterSpacing: "-6px", lineHeight: 0.85, fontSize: `${statFontSize(chiffre)}px`, color: ACCENT }}>
        {chiffre}
      </span>
      <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "34px", letterSpacing: "-1px", color: palette.text, marginTop: "20px" }}>
        {slide.titre}
      </span>
      {slide.corps && (
        <span style={{ display: "flex", fontFamily: "Playfair Display", fontStyle: "italic", fontWeight: 400, fontSize: "26px", color: palette.sub, opacity: 0.72, marginTop: "12px" }}>
          {truncate(slide.corps, 140)}
        </span>
      )}
    </div>
  );
}

function CtaBody({ slide, palette }: { slide: LunaSlide; palette: (typeof PALETTE)[LunaSlide["fond"]] }) {
  const titleStyle =
    slide.style_titre === "serif"
      ? { fontFamily: "Playfair Display", fontStyle: "italic" as const, fontWeight: 500, lineHeight: 1.08 }
      : { fontFamily: "Inter", fontWeight: 900, letterSpacing: "-3px", lineHeight: 0.94 };
  const onDark = slide.fond !== "creme";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: "0 64px", gap: "24px" }}>
      <span style={{ ...titleStyle, fontSize: `${titleFontSize(slide.titre, slide.style_titre)}px`, color: palette.text }}>{slide.titre}</span>
      {slide.corps && (
        <span style={{ display: "flex", fontFamily: "Playfair Display", fontStyle: "italic", fontWeight: 400, fontSize: "27px", lineHeight: 1.4, color: palette.sub, opacity: 0.72 }}>
          {truncate(slide.corps, 160)}
        </span>
      )}
      {slide.bouton && (
        <div style={{ display: "flex", marginTop: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: onDark ? "#FFFFFF" : "#1A1A1A",
              borderRadius: "50px",
              padding: "18px 32px",
            }}
          >
            <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "23px", color: onDark ? "#1A1A1A" : "#FFFFFF" }}>{slide.bouton}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ComparaisonBody({ slide, palette }: { slide: LunaSlide; palette: (typeof PALETTE)[LunaSlide["fond"]] }) {
  const comp = slide.comparaison;
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: "0 64px", gap: "28px" }}>
      <span
        style={{
          fontFamily: "Inter",
          fontWeight: 900,
          letterSpacing: "-2px",
          lineHeight: 0.98,
          fontSize: `${titleFontSize(slide.titre, "sans") - 8}px`,
          color: palette.text,
        }}
      >
        {slide.titre}
      </span>
      {comp && (
        <div style={{ display: "flex", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: palette.muted, borderRadius: "20px", padding: "24px" }}>
            <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "15px", letterSpacing: "0.04em", textTransform: "uppercase", color: palette.text, opacity: 0.55 }}>
              {comp.gauche.titre}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
              {comp.gauche.points.slice(0, 3).map((p, i) => (
                <span key={i} style={{ display: "flex", fontFamily: "Inter", fontWeight: 500, fontSize: "17px", lineHeight: 1.35, color: palette.text, opacity: 0.6 }}>
                  {truncate(p, 55)}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, border: `1.5px solid ${ACCENT}`, borderRadius: "20px", padding: "24px" }}>
            <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "15px", letterSpacing: "0.04em", textTransform: "uppercase", color: ACCENT }}>
              {comp.droite.titre}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
              {comp.droite.points.slice(0, 3).map((p, i) => (
                <span key={i} style={{ display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: "17px", lineHeight: 1.35, color: palette.text }}>
                  {truncate(p, 55)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Photo de fond en data URI (générée par lib/openai.ts à partir de slide.photo_prompt) — scène/texture uniquement, aucun texte dedans. */
export async function renderSlideToPng(slide: LunaSlide, index: number, total: number, photo?: string): Promise<string> {
  const palette = PALETTE[slide.fond];
  const fonts = await loadFonts();
  const isLast = index === total - 1;
  const gabarit = slide.gabarit ?? "minimal";

  const tree = (
    <div style={{ width: `${SIZE}px`, height: `${SIZE}px`, display: "flex", flexDirection: "column", backgroundColor: palette.bg, position: "relative" }}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          width={SIZE}
          height={SIZE}
          style={{ position: "absolute", top: "0px", left: "0px", width: `${SIZE}px`, height: `${SIZE}px`, objectFit: "cover", opacity: 0.16 }}
        />
      )}
      <Badge label={slide.label} color={palette.text} />
      {gabarit === "liste" ? (
        <ListeBody slide={slide} palette={palette} />
      ) : gabarit === "chiffre" ? (
        <ChiffreBody slide={slide} palette={palette} />
      ) : gabarit === "cta" ? (
        <CtaBody slide={slide} palette={palette} />
      ) : gabarit === "comparaison" ? (
        <ComparaisonBody slide={slide} palette={palette} />
      ) : (
        <MinimalBody slide={slide} palette={palette} />
      )}
      <Arrow />
      <Footer isLast={isLast} />
    </div>
  );

  const svg = await satori(tree, { width: SIZE, height: SIZE, fonts, loadAdditionalAsset });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: SIZE } }).render().asPng();
  return `data:image/png;base64,${png.toString("base64")}`;
}
