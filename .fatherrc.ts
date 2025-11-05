import path from 'path';
import { defineConfig } from 'father';

export default defineConfig({
  umd: {
    name: 'AVA',
    output: 'dist',
  },
  alias: {
    '@ava': path.resolve(__dirname, 'src'),
    '@advisor': path.resolve(__dirname, 'src/advisor'),
  }
});
