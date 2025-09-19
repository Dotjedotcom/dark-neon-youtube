/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          500: '#6df7c1',
          600: '#33f0a6',
          700: '#0eea92'
        }
      },
      boxShadow: {
        glow: '0 0 20px rgba(51, 240, 166, 0.35), 0 0 60px rgba(51, 240, 166, 0.2)'
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.2s ease-in-out infinite',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' }
        }
      }
    }
  },
  plugins: [],
}
