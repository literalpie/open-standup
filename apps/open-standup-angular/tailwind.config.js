/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    colors: {
      'su-complete': 'var(--complete)',
      'su-in-progress': 'var(--in-progress)',
      'su-complete-dark': 'var(--complete-dark)',
      'su-in-progress-dark': 'var(--in-progress-dark)',
    },

    extend: {},
  },
  plugins: [require("daisyui")],
}

