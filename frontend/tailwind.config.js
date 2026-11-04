/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F9FA",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#00A896",
          dark: "#028090",
          light: "#E8F8F5",
        },
        charcoal: {
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
          600: "#475569",
          500: "#64748B",
        },
        income: {
          DEFAULT: "#10B981",
          light: "#ECFDF5",
          dark: "#047857",
        },
        expense: {
          DEFAULT: "#EF4444",
          light: "#FEF2F2",
          dark: "#B91C1C",
        },
      },
    },
  },
  plugins: [],
};

