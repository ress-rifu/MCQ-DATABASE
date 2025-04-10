import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
    })
  ],
  resolve: {
    alias: {
      'react': resolve(__dirname, './node_modules/react'),
      'react-dom': resolve(__dirname, './node_modules/react-dom'),
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: true
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
  server: {
    hmr: { overlay: true },
    watch: {
      usePolling: true,
      interval: 1000,
    },
    host: true
  }
})
