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
    extend: {
      keyframes: {
        'popover-fade-in': {
          from: { opacity: 0, scale: '60%', 'transform-origin': 'var(--kb-popover-content-transform-origin)' },
        },
        'popover-fade-out': {
          to: { opacity: 0, scale: '60%', 'transform-origin': 'var(--kb-popover-content-transform-origin)' },
        }
      },
      animation: {
        'popover-fade-in': 'popover-fade-in 200ms',
        'popover-fade-out': 'popover-fade-out 200ms'
      }
    },
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
};
