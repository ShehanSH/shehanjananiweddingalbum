import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f0e6",
          color: "#5c4033",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 10, textTransform: "uppercase" }}>Wedding Album</div>
        <div style={{ fontSize: 84, marginTop: 24, fontStyle: "italic" }}>Shehan</div>
        <div style={{ fontSize: 36, margin: "8px 0 16px" }}>&</div>
        <div style={{ fontSize: 84, fontStyle: "italic" }}>Janani</div>
        <div style={{ fontSize: 26, marginTop: 36, letterSpacing: 6 }}>17 JULY 2026</div>
        <div style={{ fontSize: 20, marginTop: 12, letterSpacing: 4 }}>DUTCH GATE HOTEL · ALUTHGAMA</div>
      </div>
    ),
    size,
  );
}
