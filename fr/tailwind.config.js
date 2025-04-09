module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Override grey colors with white
        gray: {
          50: '#ffffff',
          100: '#ffffff',
          200: '#ffffff',
          300: '#ffffff',
          // Keep darker grays for text
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        },
      },
      backgroundColor: {
        // Add explicit overrides for common bg classes
        'gray-50': 'white',
        'gray-100': 'white',
        'gray-200': 'white',
        'gray-300': 'white',
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "forest"],
  },
}