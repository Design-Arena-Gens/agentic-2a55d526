import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1d4ed8",
          foreground: "#f8fafc"
        },
        accent: {
          DEFAULT: "#f59e0b",
          foreground: "#111827"
        }
      }
    }
  },
  plugins: []
};

export default config;
