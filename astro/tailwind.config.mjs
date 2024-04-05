/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    './node_modules/flowbite/**/*.js',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'home-bg': "url('/images/bg-website-fhd.png')",
      },
    },
  },
  plugins: [require('flowbite/plugin')],
}
