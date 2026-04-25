import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API = 'http://127.0.0.1:8000'
const apiProxy = { target: API, changeOrigin: true }

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': apiProxy,
      '/ai': apiProxy,
      '/simulation': apiProxy,
      '/notes': apiProxy,
      '/lectures': apiProxy,
      '/flashcard-sets': apiProxy,
      '/flashcards': apiProxy,
    },
  },
})
