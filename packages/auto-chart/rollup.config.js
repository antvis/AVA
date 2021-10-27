import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import autoprefixer from 'autoprefixer';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

const format = process.env.FORMAT;

const OUT_DIR_NAME_MAP = {
  esm: 'esm',
  cjs: 'lib',
  umd: 'dist',
};

const outDir = OUT_DIR_NAME_MAP[format];

const output = {
  name: 'AutoChart',
  format,
  preserveModules: format === 'esm',
  sourcemap: 'inline',
  preserveModulesRoot: 'src',
};

const plugins = [
  peerDepsExternal(),
  typescript({
    outDir,
    declarationDir: outDir,
  }),
  commonjs(),
  resolve(),
  nodePolyfills(),
  globals(),
  builtins(),
  postcss({
    // Extract CSS to the same location where JS file is generated but with .css extension.
    extract: true,
    // Use named exports alongside default export.
    namedExports: true,
    // Minimize CSS, boolean or options for cssnano.
    minimize: true,
    // Enable sourceMap.
    sourceMap: true,
    // This plugin will process files ending with these extensions and the extensions supported by custom loaders.
    extensions: ['.less', '.css'],
    use: [['less', { javascriptEnabled: true }]],
    plugins: [
      autoprefixer({
        overrideBrowserslist: ['defaults', 'not ie < 11', 'last 2 versions', '> 1%', 'iOS 7', 'last 3 iOS versions'],
      }),
    ],
  }),
];

if (format === 'umd') {
  output.file = 'dist/index.min.js';
  // zip file size
  plugins.push(terser());
  output.globals = {
    react: 'React',
    'react-dom': 'ReactDOM',
    antd: 'antd',
    '@antv/g2plot': 'G2Plot',
    '@ant-design/icons': 'icons',
    // TODO g2plot schemas 瘦身完成将从 peerDeps 从移除
    '@antv/g2plot-schemas': 'schemas',
    moment: 'moment',
  };
} else {
  output.dir = outDir;
}

export default {
  input: 'src/index.ts',
  output,
  plugins,
};
