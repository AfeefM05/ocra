/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Marine High-Contrast palette
        ocean: {
          50: '#e6f0fa',
          100: '#c5dcf0',
          200: '#8fb8e0',
          300: '#5a93cf',
          400: '#2e6fa8',
          500: '#1a4d80',
          600: '#143d66',
          700: '#0f2e4d',
          800: '#0a1f35',
          900: '#061528',
          950: '#030d1c',
        },
        aqua: {
          50: '#e6fffd',
          100: '#b3fff9',
          200: '#80fff5',
          300: '#4dfff1',
          400: '#1affed',
          500: '#00e5d0',
          600: '#00b8a8',
          700: '#008a7e',
          800: '#005c54',
          900: '#003e3a',
        },
        hazard: {
          400: '#ff6b3d',
          500: '#ff4500',
          600: '#e03400',
          700: '#b82800',
        },
        safe: {
          400: '#3df58a',
          500: '#1de958',
          600: '#15c246',
          700: '#0f9a37',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(26, 255, 237, 0.4), 0 0 40px rgba(26, 255, 237, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(26, 255, 237, 0.7), 0 0 60px rgba(26, 255, 237, 0.4)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(1.3)', opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
