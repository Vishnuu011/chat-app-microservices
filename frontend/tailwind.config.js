/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d4f5',
          800: '#1a1f2e',
          900: '#10131c',
          950: '#080a12',
        },
        accent: {
          DEFAULT: '#6c8cff',
          dark:    '#4a6bff',
          glow:    '#6c8cff33',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease',
        'fade-in':  'fadeIn 0.2s ease',
        'pulse-dot':'pulseDot 1.5s infinite',
        'ring':     'ring 0.5s ease',
      },
      keyframes: {
        slideIn:  { from: { transform: 'translateX(-8px)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
        ring:     { '0%,100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(10deg)' }, '75%': { transform: 'rotate(-10deg)' } },
      },
      backdropBlur: { xs: '2px' }
    },
  },
  plugins: [],
}
