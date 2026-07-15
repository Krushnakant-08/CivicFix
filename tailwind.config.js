/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        earthyBrown: '#5e7260',
        earth: {
          canvas: '#f8f7f4',
          surface: '#ffffff',
          muted: '#f1f2ef',
          forest: '#5e7260',
          ocean: '#6b7280',
          soil: '#8b9a8c',
          sand: '#d1d5db',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        earthy: '0 10px 24px rgba(17, 24, 39, 0.06)',
        earthyStrong: '0 14px 30px rgba(17, 24, 39, 0.1)',
      },
    },
  },
  plugins: [],
};
