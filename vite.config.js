import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Firebase into separate chunk (reduces main bundle)
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Lucide icons as separate chunk
          icons: ['lucide-react'],
        },
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
