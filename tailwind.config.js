/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { navy: '#1a237e', saffron: '#ff9933', ink: '#172033' },
      fontFamily: { display: ['Georgia', 'serif'], sans: ['Arial', 'sans-serif'] },
    },
  },
  plugins: [],
};
