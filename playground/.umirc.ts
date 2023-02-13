import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  fastRefresh: {},
  webpack5: {},
  chainWebpack: (memo) => {
    memo.module.rule('ts-in-node_modules').include.clear();
    return memo;
  },
});
