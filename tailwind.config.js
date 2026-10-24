/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FAF8F5',
          100: '#F5F1E8',
          200: '#EBE4D5',
          300: '#DDD2BD',
          400: '#CBBBA0',
          500: '#B5A282',
        },
        celebration: {
          purple: '#6D28D9',
          purpleDark: '#4C1D95',
          purpleLight: '#F3E8FF',
          gold: '#D97706',
          goldLight: '#FEF3C7',
          rose: '#E11D48',
          roseLight: '#FFE4E6',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(109, 40, 217, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 30px -4px rgba(109, 40, 217, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
