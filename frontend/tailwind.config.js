/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        unefm: {
          50: '#eef4ff',
          100: '#dbe7fe',
          200: '#c0d4fe',
          300: '#93b8fd',
          400: '#5f90fa',
          500: '#3868f5',
          600: '#2248ea',
          700: '#1a36d0',
          800: '#1b2fa9',
          900: '#1b2d85',
          950: '#152051',
        },
        accent: {
          50: '#fff8ed',
          100: '#ffefd5',
          200: '#fedcaa',
          300: '#fdc273',
          400: '#fb9d3b',
          500: '#fa8214',
          600: '#eb650a',
          700: '#c34a0c',
          800: '#9b3a12',
          900: '#7d3112',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          700: '#047857',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}