export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#070c18',
        'app-surface': '#0c1325',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.25)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.25)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
