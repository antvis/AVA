import { defineConfig } from 'umi';

export default defineConfig({
  routes: [{ path: '/', component: '@/pages/index' }],
  fastRefresh: true,
  chainWebpack: (memo) => {
    memo.module.rule('ts-in-node_modules').include.clear();
    return memo;
  },
});
