import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          background: {
            DEFAULT: "var(--bg)",
            light: "var(--bg-light)",
          },
          text: {
            DEFAULT: "var(--text)",
            light: "var(--text-light)",
          },
          primary: {
            DEFAULT: "var(--primary)",
            dark: "var(--primary-dark)",
            light: "var(--primary-light)",
          },
          border: "var(--border)",
          success: "var(--success)",
          error: "var(--error)",
        },
      },
      fontFamily: {
        sans: ["Satoshi", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
} satisfies Config;
