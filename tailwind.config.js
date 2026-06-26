/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        line: {
          green: '#06C755',
          dark: '#1A1A1A',
        },
      },
    },
  },
  plugins: [],
}
