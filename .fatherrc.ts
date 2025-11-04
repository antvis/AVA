import path from 'path';
import { defineConfig } from 'father';

export default defineConfig({
  umd: {
    name: 'AVA',
    output: 'dist',
  },
  alias: {
    '@ava': path.resolve(__dirname, 'src'),
    '@ava/advisor-deprecated': path.resolve(__dirname, 'src/advisor-deprecated'),
    '@advisor': path.resolve(__dirname, 'src/advisor'),
    '@advisor-deprecated': path.resolve(__dirname, 'src/advisor-deprecated'),
    '@ava/insight': path.resolve(__dirname, 'src/insight'),
  }
});
