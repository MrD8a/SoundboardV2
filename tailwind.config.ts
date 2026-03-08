import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fdf8f0',
          100: '#f9eedd',
          200: '#f2dbb8',
          300: '#e8c28a',
          400: '#dda55c',
          500: '#d4913e',
          600: '#c67a33',
          700: '#a5602c',
          800: '#854d2a',
          900: '#6c4025'
        },
        obsidian: {
          50: '#f4f3f2',
          100: '#e3e1de',
          200: '#c9c4be',
          300: '#a9a297',
          400: '#918779',
          500: '#837565',
          600: '#716256',
          700: '#5c4f47',
          800: '#4e433e',
          900: '#453c38',
          950: '#1a1614'
        },
        dragon: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626'
        },
        arcane: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed'
        }
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}

export default config
