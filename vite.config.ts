import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const host = process.env.TAURI_DEV_HOST || '0.0.0.0';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host,
    allowedHosts: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/manager/')) {
            return 'manager';
          }
          if (id.includes('/src/tools/')) {
            return 'mini-tools';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
});
