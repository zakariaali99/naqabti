import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1A2038",
          50: "#E8EAEE",
          100: "#C2C8D6",
          200: "#99A5BF",
          300: "#7082A8",
          400: "#4D6391",
          500: "#1A2038",
          600: "#151A2D",
          700: "#101422",
          800: "#0B0E17",
          900: "#05070B",
        }
      }
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          background: "#F3F5F9",
          foreground: "#1A2038",
          primary: {
            DEFAULT: "#2B95E8",
            foreground: "#FFFFFF",
          },
          secondary: {
            DEFAULT: "#5468D4",
            foreground: "#FFFFFF",
          },
          content1: "#FFFFFF",
          content2: "#F7F9FC",
          content3: "#E2E8F0",
          content4: "#CBD5E1",
          focus: "#2B95E8",
        },
      },
      dark: {
        colors: {
          background: "#101422", 
          foreground: "#ECEDEE",
          primary: {
            DEFAULT: "#2B95E8",
            foreground: "#FFFFFF",
          },
          secondary: {
            DEFAULT: "#5468D4",
            foreground: "#FFFFFF",
          },
          content1: "#1A2038",
          content2: "#232b4a",
          content3: "#2d375e",
          content4: "#384373",
          focus: "#2B95E8",
        },
      },
    },
  })],
}
