import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default (type, options, explugins = []) => {
  const configs = {
    input: options.input,
    output: {
      file: './dist/index.min.js',
      format: 'umd',
      sourcemap: false,
      ...options.output,
    },
    plugins: [resolve(), commonjs(), typescript(), terser(), ...explugins],
  };

  if (type === 'react') {
    configs.external = ['react', 'react-dom', '@antv/g2plot'];
  }

  return configs;
};
