/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './assets/js/**/*.js',
    './components/**/*.{js,ts}',
    './src/**/*.{js,ts}',
    './voice-system/**/*.{js,ts}',
    './realtime-voice-system/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        galaxy: {
          deep: '#030712',
          space: '#0B1120',
          accent: '#3B82F6',
          glow: '#8B5CF6',
        },
      },
    },
  },
  plugins: [],
};

