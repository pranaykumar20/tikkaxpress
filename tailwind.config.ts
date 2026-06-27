import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tandoori: "#f28c22",
        ember: "#d94b19",
        ink: "#111111",
        charcoal: "#26211c",
        cream: "#fff8ef",
        curry: "#a83b1d",
        herb: "#5b7f30"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(242, 140, 34, 0.28)",
        card: "0 24px 70px rgba(38, 33, 28, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
