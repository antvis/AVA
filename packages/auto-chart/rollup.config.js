// import alias from '@rollup/plugin-alias';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
// import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import autoprefixer from 'autoprefixer';
// TODO AutoChart 先不处理 node 包，而交给消费它的项目自己处理
// import resolve from '@rollup/plugin-node-resolve';
// import nodePolyfills from 'rollup-plugin-polyfill-node';
// import builtins from 'rollup-plugin-node-builtins';
// import globals from 'rollup-plugin-node-globals';
import { visualizer } from 'rollup-plugin-visualizer';
import json from '@rollup/plugin-json';

const format = process.env.FORMAT;
const enableAnalysis = process.env.ANALYSIS;

const OUT_DIR_NAME_MAP = {
  esm: 'esm',
  cjs: 'lib',
  umd: 'dist',
};

const outDir = OUT_DIR_NAME_MAP[format];

const output = {
  name: 'AutoChart',
  format,
  // preserveModules: format === 'esm',
  sourcemap: 'inline',
  preserveModulesRoot: 'src',
};

const external = ['react', 'react-dom', '@ant-design/icons', 'antd', '@antv/g6', '@antv/g2plot', 'moment'];

const plugins = [
  typescript({
    outDir,
    declarationDir: outDir,
  }),
  commonjs(),
  // resolve(),
  // nodePolyfills(),
  // globals(),
  // builtins(),
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
  json(),
];

if (enableAnalysis) {
  plugins.push(visualizer({ gzipSize: true }));
}

if (format === 'umd') {
  output.file = 'dist/index.min.js';
  // zip file size
  plugins.push(terser());
  output.globals = {
    react: 'React',
    'react-dom': 'ReactDOM',
    antd: 'antd',
    '@antv/g2plot': 'G2Plot',
    '@antv/g6': 'G6',
    '@ant-design/icons': 'icons',
    moment: 'moment',
  };
} else {
  output.dir = outDir;
}

export default {
  input: 'src/index.ts',
  output,
  plugins,
  external,
};
