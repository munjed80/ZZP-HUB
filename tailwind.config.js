/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        primary: "#0D9488",
        secondary: "#64748B",
        success: "#10B981",
      },
      borderRadius: {
        DEFAULT: '0.5rem', // 8px - unified default
        'sm': '0.375rem', // 6px
        'md': '0.5rem', // 8px
        'lg': '0.75rem', // 12px
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'none': 'none',
      },
    },
  },
};

export default config;
