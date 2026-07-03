import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/calculate_route': {
        target: 'http://127.0.0.1:8800',  // Flask server
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/calculate_route/, '/calculate_route')
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, independently-cacheable vendors out of the app bundle.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          socket: ['socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
