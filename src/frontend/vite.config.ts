import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared/types': path.resolve(__dirname, '../shared/types/src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow access from network
    port: parseInt(process.env.VITE_PORT || process.env.PORT || '5173'),
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: false, // keep original host so cookies work
        cookieDomainRewrite: 'localhost',
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Code splitting optimization (Requirement 22.10, 24.4)
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (
              id.includes('/@ant-design/icons') ||
              id.includes('\\@ant-design\\icons') ||
              id.includes('/@ant-design/icons-svg') ||
              id.includes('\\@ant-design\\icons-svg')
            ) {
              return 'icons-vendor';
            }
            if (
              id.includes('/@emotion/') ||
              id.includes('\\@emotion\\') ||
              id.includes('/stylis/') ||
              id.includes('\\stylis\\') ||
              id.includes('/@ant-design/cssinjs') ||
              id.includes('\\@ant-design\\cssinjs')
            ) {
              return 'style-vendor';
            }
            if (
              id.includes('/@rc-component/') ||
              id.includes('\\@rc-component\\') ||
              id.includes('/rc-') ||
              id.includes('\\rc-') ||
              id.includes('/rc-util/') ||
              id.includes('\\rc-util\\')
            ) {
              return 'rc-vendor';
            }
            if (
              id.includes('/antd/') ||
              id.includes('\\antd\\') ||
              id.includes('/@ant-design/') ||
              id.includes('\\@ant-design\\')
            ) {
              return 'ui-vendor';
            }
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'react-vendor';
            }
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'redux-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            if (
              id.includes('react-hook-form') ||
              id.includes('@hookform/resolvers') ||
              id.includes('zod')
            ) {
              return 'form-vendor';
            }
          }
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Image optimization
  assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'antd'],
  },
});
