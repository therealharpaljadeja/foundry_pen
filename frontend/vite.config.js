// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['js-cookie']
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})