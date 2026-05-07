import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
/// <reference types="vitest" />

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('fuse.js')) return 'search';
            if (id.includes('lucide-react')) return 'ui';
            if (id.includes('zustand')) return 'zustand';
            if (
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('/react/')
            ) return 'vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/__tests__/setup.ts'],
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
