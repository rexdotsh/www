/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "bar-1": {
          "0%, 100%": {transform: "scaleY(0.8)"},
          "50%": {transform: "scaleY(1)"},
        },
        "bar-2": {
          "0%, 100%": {transform: "scaleY(0.9)"},
          "50%": {transform: "scaleY(0.7)"},
        },
        "bar-3": {
          "0%, 100%": {transform: "scaleY(0.85)"},
          "50%": {transform: "scaleY(0.75)"},
        },
      },
      animation: {
        "bar-1": "bar-1 1.4s ease-in-out infinite",
        "bar-2": "bar-2 1.6s ease-in-out infinite",
        "bar-3": "bar-3 1.2s ease-in-out infinite",
        "fade-in": "fade-in 0.2s ease-in-out forwards",
      },
    },
  },
  plugins: [],
};
