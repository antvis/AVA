import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default (options, explugins = []) => {
  const configs = {
    input: options.input,
    output: {
      file: './dist/index.min.js',
      format: 'umd',
      sourcemap: false,
      ...options.output,
    },
    plugins: [resolve(), commonjs(), typescript(), terser(), json(), ...explugins],
  };

  return configs;
};
