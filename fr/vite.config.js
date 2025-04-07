import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      babel: {
        plugins: [
          '@babel/plugin-transform-react-jsx'
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'xlsx', 'axios'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020',
    cssTarget: 'chrome80',
    minify: 'terser',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['react-icons', 'react-datepicker', 'katex'],
        }
      }
    }
  },
  server: {
    hmr: true,
    port: 3000,
    strictPort: false,
    open: true,
    host: true
  }
})
