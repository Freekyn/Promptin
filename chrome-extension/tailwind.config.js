/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/popup/popup.html"
  ],
  theme: {
    extend: {
      colors: {
        // Primary Background - Near Black
        primary: {
          DEFAULT: '#0D0D0D',
          50: '#0D0D0D',
          100: '#0D0D0D',
          200: '#0D0D0D',
          300: '#0D0D0D',
          400: '#0D0D0D',
          500: '#0D0D0D',
          600: '#0D0D0D',
          700: '#0D0D0D',
          800: '#0D0D0D',
          900: '#0D0D0D',
        },
        // Secondary Background - Dark Grey (Cards)
        secondary: {
          DEFAULT: '#1C1C1E',
          50: '#1C1C1E',
          100: '#1C1C1E',
          200: '#1C1C1E',
          300: '#1C1C1E',
          400: '#1C1C1E',
          500: '#1C1C1E',
          600: '#1C1C1E',
          700: '#1C1C1E',
          800: '#1C1C1E',
          900: '#1C1C1E',
        },
        // Accent - Vibrant Red (CTA)
        accent: {
          DEFAULT: '#E53935',
          50: '#E53935',
          100: '#E53935',
          200: '#E53935',
          300: '#E53935',
          400: '#E53935',
          500: '#E53935',
          600: '#E53935',
          700: '#E53935',
          800: '#E53935',
          900: '#E53935',
        },
        // Neutral - Off-White (Headings)
        neutral: {
          DEFAULT: '#F5F5F7',
          50: '#F5F5F7',
          100: '#F5F5F7',
          200: '#F5F5F7',
          300: '#F5F5F7',
          400: '#F5F5F7',
          500: '#F5F5F7',
          600: '#F5F5F7',
          700: '#F5F5F7',
          800: '#F5F5F7',
          900: '#F5F5F7',
        },
        // Body Text - Light Grey
        body: {
          DEFAULT: '#A1A1A6',
          50: '#A1A1A6',
          100: '#A1A1A6',
          200: '#A1A1A6',
          300: '#A1A1A6',
          400: '#A1A1A6',
          500: '#A1A1A6',
          600: '#A1A1A6',
          700: '#A1A1A6',
          800: '#A1A1A6',
          900: '#A1A1A6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'monospace']
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite'
      }
    },
  },
  plugins: [],
}
