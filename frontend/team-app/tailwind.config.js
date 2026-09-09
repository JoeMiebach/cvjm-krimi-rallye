/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Zentrale Theme-Variablen -- hier später Logo-/Markenfarben eintragen,
      // ohne Klassennamen im restlichen Code ändern zu müssen.
      colors: {
        primary: {
          50: '#eef7f6',
          100: '#d3ebe8',
          300: '#7fc2ba',
          500: '#2f9c8f',
          600: '#0f766e', // Haupt-Akzent (nordisches Blau-Grün)
          700: '#0c5f59',
          900: '#083b37'
        },
        accent: {
          400: '#d9a441', // warmes Erdton-Gold, Viking-Anspielung
          500: '#c48a2a',
          600: '#a66f1c'
        },
        surface: '#fdf8ee', // heller, freundlicher Hintergrund
        ink: '#1f2a2a'
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      spacing: {
        touch: '2.75rem' // 44px Mindest-Touch-Target
      }
    }
  },
  plugins: []
};
