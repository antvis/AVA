import json from '@rollup/plugin-json';
import rollupConfig from '../../rollup.config';

export default rollupConfig(
  'ts',
  {
    input: './src/index.ts',
    output: {
      name: 'ChartAdvisor',
    },
  },
  [json()]
);
