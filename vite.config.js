import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        features: resolve(__dirname, 'features.html'),
      },
      output: {
        manualChunks: {
          // Split Firebase into separate chunk (reduces main bundle)
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Lucide icons as separate chunk
          icons: ['lucide-react'],
        },
      },
    },
    // Security: Minify and optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
      },
    },
    // Increase chunk size warning threshold since we're under control
    chunkSizeWarningLimit: 600,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'lucide-react'],
  },
})
