import { defineConfig } from 'father';

export default defineConfig({
  esm: {
    output: 'esm',
  },
  cjs: {
    output: 'lib',
  },
  umd: {
    name: 'AVAReact',
    output: 'dist',
    externals: {
      antd: 'antd',
      react: 'react',
      'react-dom': 'ReactDom',
    }
  },
});
