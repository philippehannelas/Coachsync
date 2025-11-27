/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AthleteHub Brand Colors
        'athletehub': {
          primary: '#0066FF',
          'primary-dark': '#0047B3',
          'primary-light': '#3385FF',
          navy: '#0A1F44',
          orange: '#FF6B35',
          'orange-light': '#FF8C5F',
          slate: '#64748B',
          'slate-light': '#94A3B8',
          'slate-dark': '#475569',
        },
        // Alias for backward compatibility (replacing purple with blue)
        'purple': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#0066FF', // Primary blue
          600: '#0047B3', // Primary dark
          700: '#003D99',
          800: '#003380',
          900: '#002966',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'athletehub-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'athletehub': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'athletehub-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'athletehub-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'athletehub-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0066FF 0%, #0047B3 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0A1F44 0%, #0066FF 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FF6B35 0%, #FF8C5F 100%)',
      },
    },
  },
  plugins: [],
}
