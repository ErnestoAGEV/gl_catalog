/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Clases de error de campo en checkout (se aplican dinámicamente desde JS)
    '!border-red-500',
    '!ring-1',
    '!ring-red-500/30',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
