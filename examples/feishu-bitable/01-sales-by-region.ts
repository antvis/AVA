/**
 * 示例 1：按月统计各区域销售额，找出环比下滑的区域。
 *
 * 自然语言问题：按月统计各区域销售额并找出环比下滑的区域
 * 期望结果：按区域、月份聚合销售额，用 LAG 取上月销售额，只保留环比为负的行。
 *
 * 运行（在仓库根目录，无需 npm install）：
 *   npx esbuild examples/feishu-bitable/01-sales-by-region.ts \
 *     --bundle --platform=node --format=cjs --packages=external --outfile=node_modules/.tmp/01-sales-by-region.js
 *   node node_modules/.tmp/01-sales-by-region.js --mock
 *
 * 换成真实多维表格：
 *   AVA_FEISHU_BITABLE_URL="https://<tenant>.feishu.cn/base/<app_token>?table=<table_id>" \
 *   AVA_FEISHU_APP_ID=... AVA_FEISHU_APP_SECRET=... node node_modules/.tmp/01-sales-by-region.js
 */

import { SALES_MOM_QUESTION, SALES_MOM_SQL } from './queries';
import { runAnalysis } from './run-example';

runAnalysis({
  title: '示例 1：各区域销售额与环比下滑（飞书多维表格）',
  question: SALES_MOM_QUESTION,
  sql: SALES_MOM_SQL,
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
