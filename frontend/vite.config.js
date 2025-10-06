import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Add your Render URL here
const FRONTEND_URL = 'youconnect-7.onrender.com'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    preview: {
      allowedHosts: [FRONTEND_URL]
    }
  },
  build: {
    outDir: 'dist'
  }
})
