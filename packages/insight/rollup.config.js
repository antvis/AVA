import rollupConfig from '../../rollup.config';

export default rollupConfig('ts', {
  input: './src/index.ts',
  output: {
    name: 'LiteInsight',
  },
});
