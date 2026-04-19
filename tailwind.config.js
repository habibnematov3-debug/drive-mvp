/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#2F97D4',
          'blue-soft': '#EAF5FC',
          bg: '#F6F7FA',
          line: '#E2E7EE',
          muted: '#7A8798',
          ink: '#18263B',
          soft: '#F0F3F7',
        },
      },
      boxShadow: {
        soft: '0 12px 28px rgba(24, 38, 59, 0.08)',
      },
    },
  },
  plugins: [],
}
