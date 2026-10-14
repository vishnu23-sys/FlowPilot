import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vendor libraries change rarely; keeping them in their own chunks lets browsers cache them across deploys.
const VENDOR_CHUNKS = {
  react: ['react', 'react-dom', 'react-router-dom', 'react-router'],
  motion: ['framer-motion'],
  ui: ['@radix-ui', 'cmdk', 'react-hot-toast', 'lucide-react'],
  data: ['@tanstack/react-query', 'axios'],
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          for (const [chunk, pkgs] of Object.entries(VENDOR_CHUNKS)) {
            if (pkgs.some((p) => id.includes(`node_modules/${p}/`) || id.includes(`node_modules/${p}`))) return chunk
          }
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
})
