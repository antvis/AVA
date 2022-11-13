import rollupTsConfig from '../../config/rollup-rs';

export default rollupTsConfig({
  input: './src/index.ts',
  output: {
    name: 'AVA',
  },
});
