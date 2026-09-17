import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['expediente.unefm.edu.ve', '.unefm.edu.ve', 'localhost', '150.187.4.193'],
    watch: {
      usePolling: true,
    },
  },
})