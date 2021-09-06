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
);