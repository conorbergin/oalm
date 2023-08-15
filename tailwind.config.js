/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      'body': ['InputSans', 'sans-serif'],
      'mono': ['InputMono', 'monospace'],
      'script': ['UnifrakturCook', 'cursive'],
    },

    extend: {
      gridTemplateColumns: {
        // 24 column grid
        '16': 'repeat(16, minmax(0, 1fr))',
      }
    },
  },
  plugins: [],
}
