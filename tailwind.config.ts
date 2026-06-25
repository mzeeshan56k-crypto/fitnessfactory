import type { Config } from "tailwindcss";

// Colors are driven by CSS variables (see globals.css) so the whole UI can swap
// between the "Midnight" (default dark) and "Trainerize" (light) themes at
// runtime via the `data-theme` attribute on <html>.
function scale(name: string, shades: number[]) {
  const out: Record<string, string> = {};
  for (const s of shades) out[s] = `rgb(var(--${name}-${s}) / <alpha-value>)`;
  return out;
}

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: scale("brand", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        accent: scale("accent", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        // Inverted neutral scale: low numbers = base surfaces, high = primary text.
        ink: scale("ink", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -10px rgb(0 0 0 / 0.22)",
        glow: "0 0 0 1px rgb(var(--brand-500) / 0.25), 0 10px 34px -12px rgb(var(--brand-500) / 0.45)",
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
