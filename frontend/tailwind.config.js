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
          secondary: "#F8F3F8",
          sidebar: "#F5EFF5",
        },
        surface: {
          DEFAULT: "rgba(255, 255, 255, 0.48)",
          solid: "#FFFFFF",
          hover: "rgba(255, 255, 255, 0.70)",
          active: "rgba(255, 255, 255, 0.85)",
        },
        primary: {
          DEFAULT: "#8A83AC", // Muted lavender accent
          dark: "#77718F",
          light: "#EAE5F1",
          hover: "#6B6484",
        },
        text: {
          primary: "#252344",   // Deep muted purple
          secondary: "#77758F", // Muted purple-grey
          muted: "#A09CB1",     // Light purple-grey
        },
        income: {
          DEFAULT: "#75A65A",   // Soft reference green
          light: "#EEF6EA",
          dark: "#5E8746",
        },
        expense: {
          DEFAULT: "#C95C54",   // Soft reference coral/red
          light: "#FBEEEC",
          dark: "#A8443D",
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
        '3xl': '28px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};
