/** @type {import('tailwindcss').Config} */
export default {
  content: ["./public/index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        "off-white": "#FAFAF8", // Main background
        "off-white-dark": "#F5F5F0", // Cards/sections
        "off-black": "#1A1A1A", // Primary text
        "gray-soft": "#6B6B6B", // Secondary text
        "border-light": "#E5E5E0", // Subtle borders
        "accent-purple": "#A855F7", // Purple-400 for accents
      },
    },
  },
  plugins: [],
};
