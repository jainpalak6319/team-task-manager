import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Allows Railway to connect to the Vite server
    host: '0.0.0.0', 
    port: 5173,
    proxy: {
      '/api': {
        // This targets your local backend during dev
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  preview: {
    // This is often what Railway uses for the final production build
    host: '0.0.0.0',
    port: 5173
  }
})