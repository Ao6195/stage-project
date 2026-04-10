import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['three', 'vanta/dist/vanta.waves.min'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
})
