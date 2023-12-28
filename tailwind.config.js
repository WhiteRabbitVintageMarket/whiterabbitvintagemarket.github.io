/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./_includes/**/*.{njk,html}",
    "./content/*.{njk,html}",
    "./public/js/*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
