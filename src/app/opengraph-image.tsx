import { ImageResponse } from "next/og";

export const alt = "PeopleFlow ERP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(135deg, #18181b 0%, #3b0764 50%, #7c3aed 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "baseline",
          }}
        >
          People
          <span style={{ color: "#a78bfa" }}>Flow</span>
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#d4d4d8",
            marginTop: 16,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Sistema ERP Empresarial
        </div>
      </div>
    ),
    { ...size }
  );
}
