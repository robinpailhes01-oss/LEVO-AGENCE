import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon + icône générique (onglet, Android). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          background: "linear-gradient(150deg, #10151d 0%, #0D1117 55%, #0a1b3f 100%)",
        }}
      >
        <div style={{ width: 22, height: 22, borderRadius: 22, background: "#1A3BFF" }} />
      </div>
    ),
    { ...size },
  );
}
