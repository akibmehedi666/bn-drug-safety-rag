/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maternal: {
          50: '#FFF7F5',
          100: '#FFEFEA',
          200: '#FDE0D7',
          300: '#F9BDB0',
          400: '#F39281',
          500: '#E86D58', // Warm Terracotta / Rose
          600: '#D44C36',
          700: '#AF3825',
          800: '#8F3122',
          900: '#752D21',
        },
        sage: {
          50: '#F4F7F5',
          100: '#E6ECE8',
          200: '#C7D7CD',
          300: '#9BB8A5',
          400: '#73977F',
          500: '#52796F', // Muted Calm Sage
          600: '#3F6158',
          700: '#344F48',
          800: '#2C413C',
          900: '#273733',
        },
        cream: {
          base: '#FAF6F0',
          card: '#FFFDF9',
          accent: '#FFF0EB',
          subtle: '#F5EFE6',
        },
        warmAlert: {
          safe: '#2E7D32',
          safeBg: '#E8F5E9',
          safeBorder: '#C8E6C9',
          caution: '#D97706',
          cautionBg: '#FEF3C7',
          cautionBorder: '#FDE68A',
          danger: '#C62828',
          dangerBg: '#FFEBEE',
          dangerBorder: '#FFCDD2',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Hind Siliguri', 'sans-serif'],
        bengali: ['Hind Siliguri', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px -2px rgba(212, 76, 54, 0.08)',
        'warm-md': '0 8px 24px -4px rgba(212, 76, 54, 0.10)',
        'warm-lg': '0 16px 32px -6px rgba(212, 76, 54, 0.12)',
        'sage-sm': '0 2px 8px -2px rgba(82, 121, 111, 0.08)',
        'sage-md': '0 8px 24px -4px rgba(82, 121, 111, 0.12)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
