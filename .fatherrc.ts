import path from 'path';
import { defineConfig } from 'father';

export default defineConfig({
  umd: {
    name: 'AVA',
    output: 'dist',
    externals: {
      axios: 'axios',
    }
  }
});
