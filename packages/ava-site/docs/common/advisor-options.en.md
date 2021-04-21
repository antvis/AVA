#### options.purpose

Specify a analysis purpose for getting better recommendation.

- Comparison
- Trend
- Distribution
- Rank
- Proportion
- Composition

#### options.preferences

Preferences setting, current support setting landscape and portrait canvas layout.

```ts
{
  canvasLayout: 'landscape' | 'portrait';
}
```

#### options.chartRuleConfigs

Custom configs for chart rules.

```ts
type ChartRuleConfigMap = {
  [K in ChartRuleID]?: ChartRuleConfig;
};

interface ChartRuleConfig {
  weight?: number; // score
  off?: boolean; // off or open
  limit?: number; // limit series
}
```

| rule id                    | hard or soft | default score | description                                                                                    |
| -------------------------- | ------------ | ------------- | ---------------------------------------------------------------------------------------------- |
| data-check                 | HARD         | 1.0           | Data must satisfy the data prerequisites                                                       |
| data-field-qty             | HARD         | 1.0           | Data must has the min qty of the prerequisite                                                  |
| no-redundant-field         | HARD         | 1.0           | No redundant field                                                                             |
| purpose-check              | HARD         | 1.0           | Choose types that satisfy the purpose, if purpose is defined                                   |
| aggregation-single-row     | HARD         | 1.0           | Recommend KPI panel while data only has one single aggregation row                             |
| all-can-be-table     | HARD         | 1.0           | All Dataset can present as table ( default close when using autoChart )                        |
| series-qty-limit           | SOFT         | 0.8           | Some charts should has at most N series                                                        |
| bar-series-qty             | SOFT         | 0.5           | Bar chart should has proper number of bars or bar groups                                       |
| line-field-time-ordinal    | SOFT         | 1.0           | Data has Time or Ordinal field are good for Line, Area charts                                  |
| landscape-or-portrait      | SOFT         | 0.3           | Landscape or portrait as preferences                                                           |
| diff-pie-sector            | SOFT         | 0.5           | Difference should be big enough for pie sectors                                                |
| nominal-enum-combinatorial | SOFT         | 1.0           | Single and Multi charts should be optimized recommended by nominal enums combinatorial numbers |
| limit-series               | SOFT         | 1.0           | Avoid too many series                                                                          |

#### options.refine

on/off design rules
