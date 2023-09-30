/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./vite.config.ts"],
  theme: {
    colors: {
      'su-complete': 'var(--complete)',
      'su-in-progress': 'var(--in-progress)',
      'su-complete-dark': 'var(--complete-dark)',
      'su-in-progress-dark': 'var(--in-progress-dark)',
    },
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
};
