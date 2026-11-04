/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#F3EDF4",
          gradientStart: "#F8F2F7",
          gradientEnd: "#F0EAF3",
          secondary: "#F8F3F8",
          sidebar: "#F5EFF5",
        },
        surface: {
          DEFAULT: "rgba(255, 255, 255, 0.50)",
          solid: "#FFFFFF",
          hover: "rgba(255, 255, 255, 0.75)",
          active: "rgba(255, 255, 255, 0.90)",
        },
        primary: {
          DEFAULT: "#9589AD", // Primary lavender from reference
          dark: "#83769D",
          light: "#E7DFEE", // Soft lavender
          hover: "#7E7199",
        },
        text: {
          primary: "#302C49",   // Primary dark text from reference
          secondary: "#77718B", // Secondary text from reference
          muted: "#9F99B0",     // Muted text
        },
        income: {
          DEFAULT: "#7A9B72",   // Soft reference green
          light: "#EEF6EA",
          dark: "#65855E",
        },
        expense: {
          DEFAULT: "#C96F70",   // Soft reference coral/red
          light: "#FBEEEC",
          dark: "#B35859",
        },
      },
      fontFamily: {
        sans: ['"Nunito Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 30px rgba(70, 55, 100, 0.05)',
        'glass-hover': '0 12px 36px rgba(70, 55, 100, 0.08)',
        'glass-lg': '0 16px 40px rgba(70, 55, 100, 0.10)',
        'sidebar': '0 10px 32px rgba(85, 65, 115, 0.05)',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '34px',
      },
    },
  },
  plugins: [],
}
