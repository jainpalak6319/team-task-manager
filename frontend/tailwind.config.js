/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          400: '#6b8fff',
          500: '#4f6ef7',
          600: '#3b55e0',
          700: '#2d42c7'
        }
      }
    }
  },
  plugins: []
}
