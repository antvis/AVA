import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import rollupConfig from '../../rollup.config';

export default rollupConfig(
  'react',
  {
    input: './src/index.tsx',
    output: {
      name: 'AutoChart',
      globals: {
        'react': 'react'
      },
    }
  },
  [postcss({
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
    plugins: [
      autoprefixer({
        overrideBrowserslist: [
          'defaults',
          'not ie < 11',
          'last 2 versions',
          '> 1%',
          'iOS 7',
          'last 3 iOS versions'
        ]
      })
    ]
  })]
);
