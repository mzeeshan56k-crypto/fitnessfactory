import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5",
          400: "#f76b6b", 500: "#f23030", 600: "#eb1313", 700: "#c20f0f",
          800: "#9c0f0f", 900: "#7f1414", 950: "#450505",
        },
        accent: {
          50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
          400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
          800: "#065f46", 900: "#064e3b",
        },
        // Inverted neutral scale: low numbers = dark surfaces, high = light text.
        ink: {
          50: "#0a0a0a", 100: "#141414", 200: "#2b2b2e", 300: "#3a3a40",
          400: "#9a9aa3", 500: "#a6a6a6", 600: "#c2c2c8", 700: "#dadadf",
          800: "#ededf1", 900: "#fafafa", 950: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 14px -4px rgba(0,0,0,0.5), 0 4px 24px -8px rgba(0,0,0,0.4)",
        glow: "0 0 0 1px rgba(225,29,42,0.25), 0 10px 34px -10px rgba(225,29,42,0.5)",
      },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "fade-in": "fade-in 0.8s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
