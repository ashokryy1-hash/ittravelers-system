import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#fdf4f0',
          100: '#fae5da',
          200: '#f5c9b3',
          300: '#eda888',
          400: '#e4845a',
          500: '#d9623a',
          600: '#c44d2a',
          700: '#a33b20',
          800: '#87311c',
          900: '#702a1a',
        },
        ivory: {
          50: '#fdfcf8',
          100: '#faf6ed',
          200: '#f4ecda',
          300: '#ebdec2',
          400: '#dfc9a1',
          500: '#cfb07a',
        },
        gold: {
          300: '#f0d080',
          400: '#e8c055',
          500: '#d4a820',
          600: '#b8920a',
        },
        'dusty-rose': {
          100: '#f9eeee',
          200: '#f0d8d8',
          300: '#e4bcbc',
          400: '#d49898',
          500: '#c07070',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
