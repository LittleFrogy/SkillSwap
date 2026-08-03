/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4faff',
          100: '#e0f0ff',
          500: '#0b76e0',
          600: '#0a66c2',
          700: '#004182',
        },
        dark: '#191919',
      }
    },
  },
  plugins: [],
}
