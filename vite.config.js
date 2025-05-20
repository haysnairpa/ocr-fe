import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Get the current API URLs from environment or use defaults
const TEXT_API_URL = 'https://your-text-api.ngrok-free.app';
const SYMBOL_API_URL = 'https://your-symbol-api.ngrok-free.app';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy for text detection API
      '/api/text': {
        target: TEXT_API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/text/, ''),
      },
      // Proxy for symbol detection API
      '/api/symbol': {
        target: SYMBOL_API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/symbol/, ''),
      },
    },
  },
})
