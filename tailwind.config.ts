import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0e8ff',
          100: '#ddd0ff',
          200: '#c4a8ff',
          400: '#9b6ef3',
          600: '#7C3AED',
          700: '#6B2FD4',
          800: '#5a25b0',
          900: '#3d1680',
        },
        brand: {
          dark: '#1a0a3c',
          mid:  '#2d1560',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      }
    },
  },
  plugins: [],
}

export default config
