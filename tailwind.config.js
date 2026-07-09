/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        earthyBrown: '#6b3f1f',
        earth: {
          canvas: '#f6efe5',
          surface: '#fcf8f1',
          muted: '#efe3d0',
          forest: '#567c51',
          ocean: '#4f6f6a',
          soil: '#a2704a',
          sand: '#d6b07d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        earthy: '0 12px 30px rgba(70, 48, 30, 0.08)',
        earthyStrong: '0 18px 40px rgba(70, 48, 30, 0.12)',
      },
    },
  },
  plugins: [],
};
