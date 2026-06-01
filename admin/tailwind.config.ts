import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 18px 70px rgba(0, 0, 0, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
