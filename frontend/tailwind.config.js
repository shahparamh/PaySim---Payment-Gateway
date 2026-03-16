/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background))",
        card: "rgb(var(--card))",
        primary: "rgb(var(--primary))",
        success: "rgb(var(--success))",
        danger: "rgb(var(--danger))",
        border: "rgb(var(--border))",
        white: "rgb(var(--white))",
        slate: {
          50: "rgb(var(--slate-50))",
          100: "rgb(var(--slate-100))",
          200: "rgb(var(--slate-200))",
          300: "rgb(var(--slate-300))",
          400: "rgb(var(--slate-400))",
          500: "rgb(var(--slate-500))",
          600: "rgb(var(--slate-600))",
          700: "rgb(var(--slate-700))",
          800: "rgb(var(--slate-800))",
          900: "rgb(var(--slate-900))",
          950: "rgb(var(--slate-950))",
        }
      },
    },
  },
  plugins: [],
}
