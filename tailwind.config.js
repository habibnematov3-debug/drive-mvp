/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#1A4FD8',
          'blue-soft': '#E9EFFF',
          bg: '#F2F1ED',
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
