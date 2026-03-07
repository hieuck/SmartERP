import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    port: 5175,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
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
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['antd'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Feature chunks
          orders: [
            './src/pages/orders/SalesOrderList.tsx',
            './src/pages/orders/SalesOrderForm.tsx',
            './src/pages/orders/PurchaseOrderList.tsx',
            './src/pages/orders/PurchaseOrderForm.tsx',
            './src/pages/orders/PaymentPage.tsx',
          ],
          inventory: [
            './src/pages/inventory/StockList.tsx',
            './src/pages/inventory/StockReceiptList.tsx',
            './src/pages/inventory/StockReceiptForm.tsx',
            './src/pages/inventory/StockIssueList.tsx',
            './src/pages/inventory/StockIssueForm.tsx',
          ],
          reports: ['./src/pages/reports/ReportsPage.tsx'],
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
