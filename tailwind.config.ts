import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        batesMaroon: "#881124",
        batesDark: "#1A1A1A",
        batesGray: "#333333",
        batesLightGray: "#F5F5F5",
        batesBlue: "#1E293B",
        batesCard: "#1A2332",
        batesInputBg: "#263340",
        batesBorder: "#324054",
      },
    },
  },
  plugins: [],
} satisfies Config;
