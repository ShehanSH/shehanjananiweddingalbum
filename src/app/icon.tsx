import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

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
          background: "#f6f0e6",
          color: "#5c4033",
          fontSize: 26,
          fontStyle: "italic",
        }}
      >
        S&J
      </div>
    ),
    size,
  );
}
