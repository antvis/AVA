/**
 * The two natural-language analyses used by the examples.
 *
 * The SQL is what AVA's DuckDB dialect generates for the question, kept here so
 * the runnable examples and the end-to-end test assert the same result.
 */

/** 按月统计各区域销售额并找出环比下滑的区域 */
export const SALES_MOM_QUESTION = '按月统计各区域销售额并找出环比下滑的区域';

export const SALES_MOM_SQL = `
WITH monthly AS (
  SELECT "区域", "月份", SUM("销售额") AS "销售额"
  FROM data
  GROUP BY "区域", "月份"
),
with_previous AS (
  SELECT
    "区域",
    "月份",
    "销售额",
    LAG("销售额") OVER (PARTITION BY "区域" ORDER BY "月份") AS "上月销售额"
  FROM monthly
)
SELECT
  "区域",
  "月份",
  "销售额",
  "上月销售额",
  ROUND(("销售额" - "上月销售额") * 100.0 / "上月销售额", 2) AS "环比百分比"
FROM with_previous
WHERE "上月销售额" IS NOT NULL
  AND "销售额" < "上月销售额"
ORDER BY "环比百分比" ASC
`;

/** 列出库存低于安全线的商品并按缺口排序 */
export const STOCK_SHORTAGE_QUESTION = '列出库存低于安全线的商品并按缺口排序';

export const STOCK_SHORTAGE_SQL = `
SELECT
  "区域",
  "商品",
  "库存",
  "安全库存",
  "安全库存" - "库存" AS "缺口",
  ROUND(("安全库存" - "库存") * 100.0 / "安全库存", 1) AS "缺口百分比"
FROM data
WHERE "月份" = (SELECT MAX("月份") FROM data)
  AND "库存" < "安全库存"
ORDER BY "缺口" DESC
`;
