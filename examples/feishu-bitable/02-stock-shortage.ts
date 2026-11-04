/**
 * 示例 2：列出库存低于安全线的商品，并按缺口排序。
 *
 * 自然语言问题：列出库存低于安全线的商品并按缺口排序
 * 期望结果：取表中最新月份，筛选 库存 < 安全库存，按 安全库存 - 库存 降序。
 *
 * 运行（在仓库根目录，无需 npm install）：
 *   npx esbuild examples/feishu-bitable/02-stock-shortage.ts \
 *     --bundle --platform=node --format=cjs --packages=external --outfile=node_modules/.tmp/02-stock-shortage.js
 *   node node_modules/.tmp/02-stock-shortage.js --mock
 *
 * 换成真实多维表格：
 *   AVA_FEISHU_BITABLE_URL="https://<tenant>.feishu.cn/base/<app_token>?table=<table_id>" \
 *   AVA_FEISHU_APP_ID=... AVA_FEISHU_APP_SECRET=... node node_modules/.tmp/02-stock-shortage.js
 */

import { STOCK_SHORTAGE_QUESTION, STOCK_SHORTAGE_SQL } from './queries';
import { runAnalysis } from './run-example';

runAnalysis({
  title: '示例 2：库存低于安全线的商品（飞书多维表格）',
  question: STOCK_SHORTAGE_QUESTION,
  sql: STOCK_SHORTAGE_SQL,
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
