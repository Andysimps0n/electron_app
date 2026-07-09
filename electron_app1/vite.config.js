import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative paths so packaged Electron can load assets via file://
  // (absolute "/" paths break when there is no web server).
  base: './',
  plugins: [react()],
})
