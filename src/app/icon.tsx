import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0d9488",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          position: "relative",
        }}
      >
        {/* Horizontal bar */}
        <div
          style={{
            position: "absolute",
            width: 18,
            height: 6,
            background: "white",
            borderRadius: 2,
          }}
        />
        {/* Vertical bar */}
        <div
          style={{
            position: "absolute",
            width: 6,
            height: 18,
            background: "white",
            borderRadius: 2,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
