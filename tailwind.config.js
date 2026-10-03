/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
      },
      colors: {
        ink: "#1E1D24",
        paper: "#F6F4F0",
        muted: "#7C7A86",
        line: "#E6E2DA",
        accent: "#2B3A67",
        accentLight: "#E4E8F3",
        coral: "#E0694A",
        coralLight: "#FCE9E2",
        mint: "#2F7D5B",
        mintLight: "#E2F1EA",
        sun: "#D99A2B",
        sunLight: "#FBF0DA",
        night: "#14141A",
        nightCard: "#1F1F28",
      },
    },
  },
  plugins: [],
};
