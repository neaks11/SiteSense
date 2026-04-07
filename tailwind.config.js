/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f2',
          500: '#2e6a4a',
          700: '#1f4d35',
          900: '#143424',
        },
      },
      boxShadow: {
        card: '0 10px 24px rgba(20, 52, 36, 0.08)',
      },
    },
  },
  plugins: [],
};
