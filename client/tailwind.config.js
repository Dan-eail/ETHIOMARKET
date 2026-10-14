/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ethio: {
          50: '#f1f8f3',
          100: '#def0e3',
          200: '#bee2c9',
          300: '#92cca7',
          400: '#5fab80',
          500: '#3c8e60',
          600: '#2d714b',
          700: '#255b3d',
          800: '#204933',
          900: '#1c3d2c',
          950: '#0e2218', // Deep agricultural green
        },
        earth: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#eae0d0',
          300: '#d9c7ab',
          400: '#c5ab84',
          500: '#b49466',
          600: '#9d7c52',
          700: '#7d6141',
          800: '#675038',
          900: '#544230',
        },
        amber: {
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        sand: {
          bg: '#faf9f5', // Warm off-white background
          card: '#ffffff',
          subtle: '#f3f2eb',
          border: '#e7e5dc',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
        'card': '0 4px 20px -2px rgba(27, 67, 50, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'float': '0 20px 35px -8px rgba(27, 67, 50, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
