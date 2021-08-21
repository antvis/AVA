import rollupConfig from '../../rollup.config';
import json from '@rollup/plugin-json';

export default rollupConfig(
  'ts',
  {
    input: './src/index.ts',
    output: {
      name: 'CKB',
    },
  },
  [json()]
);
