/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#111111',
        'surface-dim': '#181209',
        'surface-bright': '#40382d',
        'surface-container': '#251f15',
        foreground: '#FFFFFF',
        accent: {
          DEFAULT: '#FFB300',
          hover: '#FFC233',
        },
        muted: 'rgba(255, 255, 255, 0.5)',
        border: 'rgba(255, 255, 255, 0.8)',
        hairline: 'rgba(255, 255, 255, 0.1)',
        gridline: 'rgba(255, 255, 255, 0.04)',
        signal: {
          amber: '#FFB300',
          amberHover: '#FFC233',
          red: '#B22222',
          green: '#10B981',
        },
        'muted-red': '#B22222',
        // Semantic compatibility
        rail: {
          dark: '#000000',
          black: '#000000',
          card: '#111111',
          cardHover: '#181209',
          navy: '#111111',
          border: 'rgba(255, 255, 255, 0.1)',
          yellow: '#FFB300',
          yellowBright: '#FFC233',
          yellowDark: '#E09B00',
          amber: '#FFB300',
          red: '#B22222',
          green: '#10B981',
          muted: 'rgba(255, 255, 255, 0.5)',
          text: '#FFFFFF',
        }
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        sora: ['"Sora"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        data: ['"IBM Plex Sans"', 'sans-serif'],
        'mono-ui': ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Sans"', 'monospace'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
