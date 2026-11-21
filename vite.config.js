import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Relative base so the built site works at any path (GitHub Pages serves it under /shadowsofrome/).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        hub: resolve(__dirname, 'index.html'),
        latrunculi: resolve(__dirname, 'latrunculi/index.html'),
        voices: resolve(__dirname, 'latrunculi/voices.html'),
      },
    },
  },
  worker: { format: 'es' },
  test: { include: ['tests/**/*.test.js'] },
});
