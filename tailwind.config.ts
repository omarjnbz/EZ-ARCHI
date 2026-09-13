import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FFFFFF",
        ink: "#1D1D1F",
        subink: "#6E6E73",
        line: "#D2D2D7",
        soft: "#F5F5F7",
        accent: "#0071E3",
        accentHover: "#0077ED",
        success: "#28CD41",
      },
      fontFamily: {
        display: ['"SF Pro Display"', '"Inter"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)",
        lift: "0 4px 12px rgba(0,0,0,.06), 0 24px 48px rgba(0,0,0,.10)",
        ring: "0 0 0 4px rgba(0,113,227,.18)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1.4, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
