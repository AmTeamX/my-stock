/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        line: {
          green: "#06C755",
          "green-dark": "#05A84A",
          "green-light": "#E8F8EF",
          dark: "#1A1A1A",
        },
        danger: {
          DEFAULT: "#FF6B6B",
          light: "#FFF0F0",
          dark: "#E55555",
        },
        surface: {
          DEFAULT: "#F8F9FB",
          card: "#FFFFFF",
          muted: "#F1F3F5",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans Thai"',
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 4px 20px rgba(0, 0, 0, 0.1)",
        nav: "0 -2px 12px rgba(0, 0, 0, 0.06)",
        header: "0 4px 24px rgba(6, 199, 85, 0.25)",
        button: "0 2px 8px rgba(6, 199, 85, 0.3)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.3s ease-out",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
