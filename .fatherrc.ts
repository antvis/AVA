import path from 'path';
import { defineConfig } from 'father';

export default defineConfig({
  umd: {
    name: 'AVA',
    output: 'dist',
    chainWebpack: (memo, { webpack, env }) => {
      // @antv/mcp-server-chart/sdk 依赖 node 环境，注入一些 node 的 polyfill
      // Handle Node ESM scheme import `node:process` in browser build
      memo.resolve.alias.set('node:process', require.resolve('process/browser'));
      memo.resolve.fallback.set('process', require.resolve('process/browser'));
      memo.plugin('provide-process').use(webpack.ProvidePlugin, [{ process: 'process/browser' }]);
      // Rewrite any `node:` scheme imports to plain module names so webpack can resolve them
      memo.plugin('rewrite-node-scheme').use(webpack.NormalModuleReplacementPlugin, [
        /^node:.+$/,
        (resource: any) => {
          resource.request = resource.request.replace(/^node:/, '');
        },
      ]);
      return memo;
    },
  }
});
