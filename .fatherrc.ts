import path from 'path';
import { defineConfig } from 'father';

export default defineConfig({
  umd: {
    name: 'AVA',
    output: 'dist',
    externals: {
      '@antv/mcp-server-chart/sdk': '@antv/mcp-server-chart/sdk',
    },
  },
  alias: {
    '@antv/mcp-server-chart/sdk': path.resolve(
      __dirname,
      'node_modules/@antv/mcp-server-chart/build/sdk.js'
    ),
  }
});
