import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-arabic)", "system-ui", "sans-serif"],
        hebrew: ["var(--font-hebrew)", "David Libre", "Times New Roman", "serif"],
      },
      colors: {
        brand: {
          50: "#f1f6fe",
          100: "#e2edfc",
          200: "#bfd8f8",
          300: "#88b8f2",
          400: "#4a92e8",
          500: "#2374d6",
          600: "#1559b5",
          700: "#124892",
          800: "#133e79",
          900: "#143565",
        },
        ink: {
          50: "#f7f8fa",
          100: "#eef0f4",
          200: "#dde1e9",
          300: "#c0c7d4",
          400: "#8e98ab",
          500: "#67728a",
          600: "#4c5670",
          700: "#3a4258",
          800: "#272d3d",
          900: "#171b26",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 8px 24px -12px rgba(16,24,40,.18)",
      },
    },
  },
  plugins: [],
};

export default config;
