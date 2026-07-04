import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1a1a1a",
        cta: "#F2A93B",
        ctadark: "#E09420",
        saleRed: "#E5383B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "pulse-orange": {
          "0%": { boxShadow: "0 0 0 0 rgba(234,88,12,0.5)" },
          "70%": { boxShadow: "0 0 0 12px rgba(234,88,12,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(234,88,12,0)" },
        },
      },
      animation: {
        "pulse-orange": "pulse-orange 1.8s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
