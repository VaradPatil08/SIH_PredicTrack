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
          red: '#E05252',
          green: '#10B981',
        },
        // Backward-compatible semantic mappings to prevent breakage
        rail: {
          dark: '#000000',
          black: '#000000',
          card: '#000000',
          cardHover: 'rgba(255, 255, 255, 0.04)',
          navy: '#080808',
          border: 'rgba(255, 255, 255, 0.1)',
          yellow: '#FFB300',
          yellowBright: '#FFC233',
          yellowDark: '#E09B00',
          amber: '#FFB300',
          red: '#E05252',
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
        display: ['"Space Grotesk"', 'sans-serif'],
        'mono-ui': ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
