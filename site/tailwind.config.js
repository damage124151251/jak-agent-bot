/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'jak-black': '#0a0a0a',
        'jak-dark': '#1a1a1a',
        'jak-gray': '#2a2a2a',
        'jak-light': '#e0e0e0',
        'jak-white': '#f5f5f5',
        'jak-green': '#4ade80',
        'jak-red': '#f87171',
        'jak-yellow': '#fbbf24',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
        'comic': ['Comic Sans MS', 'cursive'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
