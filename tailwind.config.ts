import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 따뜻한 중성 + 보랏빛 액센트 (미니멀 & 밝음)
        ink: {
          DEFAULT: "#1c1b22",
          soft: "#3f3d4a",
          muted: "#6b6878",
          faint: "#9a97a8",
        },
        paper: {
          DEFAULT: "#ffffff",
          soft: "#faf9fb",
          sunk: "#f3f1f6",
        },
        line: {
          DEFAULT: "#e9e6ef",
          strong: "#dcd8e6",
        },
        brand: {
          50: "#f3f1ff",
          100: "#e9e5ff",
          200: "#d6cdff",
          300: "#b8a7ff",
          400: "#9a7dff",
          500: "#7c54f5",
          600: "#6a3de0",
          700: "#5a2fc0",
          800: "#4a299c",
          900: "#3e257e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,27,34,0.04), 0 4px 16px rgba(28,27,34,0.05)",
        pop: "0 8px 30px rgba(28,27,34,0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
