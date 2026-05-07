/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: 'var(--bg)',
          card: 'var(--card)',
          border: 'var(--border)',
          text: 'var(--text)',
          muted: 'var(--text-muted)',
          blue: '#5b9cf5',
          blue2: '#6aa6ff',
        },
      },
      backdropBlur: {
        apple: '40px',
      },
    },
  },
  plugins: [],
};
