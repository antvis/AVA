import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    createHtmlPlugin({
      inject: {
        tags: [
          {
            tag: 'script',
            attrs: { src: 'https://gw.alipayobjects.com/os/lib/axios/1.12.2/dist/axios.min.js' },
            injectTo: 'head',
          },
        ],
      },
    }),
  ],
  server: {
    port: 3001,
    open: true,
    strictPort: false,
  },
  optimizeDeps: {
    exclude: ['@antv/ava'],
    include: ['color-blind', 'quantize'],
  },
  build: {
    rollupOptions: {
      external: ['axios'],
    },
  },
});
