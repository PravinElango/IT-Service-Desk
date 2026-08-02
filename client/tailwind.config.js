/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        status: {
          open: {
            bg: '#f1f5f9',
            text: '#475569',
            border: '#cbd5e1',
            badge: '#64748b'
          },
          assigned: {
            bg: '#eff6ff',
            text: '#1d4ed8',
            border: '#bfdbfe',
            badge: '#3b82f6'
          },
          in_progress: {
            bg: '#fffbeb',
            text: '#b45309',
            border: '#fde68a',
            badge: '#f59e0b'
          },
          resolved: {
            bg: '#ecfdf5',
            text: '#047857',
            border: '#a7f3d0',
            badge: '#10b981'
          },
          closed: {
            bg: '#f0fdf4',
            text: '#15803d',
            border: '#bbf7d0',
            badge: '#22c55e'
          },
          reopened: {
            bg: '#fef2f2',
            text: '#b91c1c',
            border: '#fecaca',
            badge: '#ef4444'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.12)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)'
      }
    },
  },
  plugins: [],
}
