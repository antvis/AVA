#### options.purpose

指定图表的分析目的，增加图表推荐的准确度，可以为以下这些值

- Comparison -- 比较
- Trend -- 趋势
- Distribution -- 分布
- Rank -- 排行
- Proportion -- 比例
- Composition -- 组成

#### options.preferences

偏好配置，目前支持图表布局偏好，包括景观和肖像两种。

```ts
{
  canvasLayout: 'landscape' | 'portrait';
}
```

#### options.refine

设计规则开关

#### options.chartRuleConfigs

自定义推荐规则配置，是 rule id 为 key，配置内容为 value 到对象形式。

```ts
type ChartRuleConfigMap = {
  [K in ChartRuleID]?: ChartRuleConfig;
};

interface ChartRuleConfig {
  weight?: number; // 权重
  off?: boolean; // 是否关闭
  limit?: number; // 限制个数
}
```

<!-- TODO diff pie sector detail description -->

| rule id                    | hard or soft | default score | description                                                                                 |
| -------------------------- | ------------ | ------------- | ------------------------------------------------------------------------------------------- |
| data-check                 | HARD         | 1.0           | 必须符合 ckb 中对应图表字段属性                                                             |
| data-field-qty             | HARD         | 1.0           | 字段属性数量必须满足 ckb 中对应图表最少数量要求                                             |
| no-redundant-field         | HARD         | 1.0           | 没有多余的字段                                                                              |
| purpose-check              | HARD         | 1.0           | 必须符合 ckb 中对应图表分析目的                                                             |
| aggregation-single-row     | HARD         | 1.0           | 只有一行聚合数据时推荐使用指标卡                     |
| all-can-be-table     | HARD         | 1.0           | 所有数据皆可使用表格来展现（此规则目前在 autoChart 中默认关闭）                             |
| series-qty-limit           | SOFT         | 0.8           | 饼图、环图、雷达图数据个数推荐不超过 6 个，玫瑰图推荐不超过 8 个，数量可以通过 `limit` 配置 |
| bar-series-qty             | SOFT         | 0.5           | 柱形图、条形图数据个数推荐在 2 - 20 个之间，数量可以通过 `limit` 配置                       |
| line-field-time-ordinal    | SOFT         | 1.0           | 折线图、面积图数据中推荐含有时间或序数字段                                                  |
| landscape-or-portrait      | SOFT         | 0.3           | 景观布局推荐柱形图类，肖像布局推荐条形图类                                                  |
| diff-pie-sector            | SOFT         | 0.5           | 对于饼图类需要有足够的数据差异                                                              |
| nominal-enum-combinatorial | SOFT         | 1.0           | 优化排列组合推荐                                                                            |
| limit-series               | SOFT         | 1.0           | 避免过多的数据条数                                                                          |
