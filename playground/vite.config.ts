import path from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@antv/ava': path.resolve(__dirname, '../packages/ava/src'),
      '@ava': path.resolve(__dirname, '../packages/ava/src'),
      '@advisor': path.resolve(__dirname, '../packages/ava/src/advisor'),
    },
  },
  server: {
    port: 3001,
    open: true,
    strictPort: false,
  },
  optimizeDeps: {
    exclude: ['@antv/ava'],
  },
});
