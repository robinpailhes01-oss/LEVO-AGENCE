import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Icône ajoutée à l'écran d'accueil (iOS). iOS arrondit les coins tout seul. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "linear-gradient(150deg, #10151d 0%, #0D1117 55%, #0a1b3f 100%)",
        }}
      >
        <div style={{ width: 20, height: 20, borderRadius: 20, background: "#1A3BFF" }} />
        <div style={{ fontSize: 58, fontWeight: 700, color: "#ffffff", letterSpacing: -2 }}>Luma</div>
      </div>
    ),
    { ...size },
  );
}
