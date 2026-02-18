/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          400: '#63f5ff',
          500: '#2be7ff',
        },
      },
    },
  },
  plugins: [],
};

