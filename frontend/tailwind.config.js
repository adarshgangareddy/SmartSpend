/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '400px',
      },
      colors: {
        background: {
          DEFAULT: "var(--app-bg)",
          secondary: "var(--surface-primary)",
          sidebar: "var(--sidebar-glass)",
        },
        surface: {
          DEFAULT: "var(--surface-primary)",
          solid: "var(--surface-modal)",
          hover: "var(--surface-pill)",
          active: "var(--surface-box)",
        },
        primary: {
          DEFAULT: "var(--accent-primary)",
          dark: "var(--accent-hover)",
          light: "var(--accent-soft)",
          hover: "var(--accent-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        income: {
          DEFAULT: "var(--income-color)",
          light: "var(--income-soft)",
          dark: "var(--income-color)",
        },
        expense: {
          DEFAULT: "var(--expense-color)",
          light: "var(--expense-soft)",
          dark: "var(--expense-color)",
        },
      },
      fontFamily: {
        sans: ['"Nunito Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': 'var(--shadow-glass)',
        'glass-hover': 'var(--shadow-glass)',
        'glass-lg': 'var(--shadow-glass)',
        'sidebar': 'var(--shadow-glass)',
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
