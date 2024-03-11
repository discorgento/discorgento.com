/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        'accent-dark': 'var(--accent-dark)',
      },
    },
    plugins: [],
  },
}
