import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
        secondary: '#f0f2f5',
        accent: '#00d084',
        danger: '#dc2626',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config
