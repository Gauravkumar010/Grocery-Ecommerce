// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // toggle dark mode via a CSS class, not just OS preference
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand color — vibrant green, like Blinkit/Zepto
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // main brand color
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Accent color — warm orange/yellow for sale badges, discounts
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // Neutral grays for text/backgrounds (dark mode friendly)
        surface: {
          light: '#ffffff',
          DEFAULT: '#f9fafb',
          dark: '#111827',
          darker: '#0a0e17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      screens: {
        xs: '475px', // extra small devices, below Tailwind's default 'sm'
      },
    },
  },
  plugins: [],
};