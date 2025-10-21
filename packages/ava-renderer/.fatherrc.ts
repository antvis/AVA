import { defineConfig } from 'father';

export default () => defineConfig({
  esm: {
    output: 'esm',
  },
  cjs: {
    output: 'lib',
  },
  umd: {
    name: 'AVA_RENDERER',
    output: 'dist',
    externals: {
      '@antv/ava': 'AVA',
    }
  },
});
