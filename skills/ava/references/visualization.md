# Visualization

Build charts from user-provided data or the `data` in query results. All engines use the same charting workflow.

## Choose a Chart and Map Fields

Choose a chart type based on the user's intent, then map actual fields to the required fields below. Unless noted otherwise, fields belong to each item in the `data` array; `value`, `x`, and `y` are numeric.

| Use case | `chartType` | Data fields or structure |
| --- | --- | --- |
| Category comparison | `column`, `bar` | `category`, `value`; prefer `bar` for long labels |
| Time trend | `line`, `area` | `time`, `value`; only `area` supports `stack` |
| Part-to-whole | `pie` | `category`, `value`; use for a small number of non-negative values; `innerRadius 0.6` creates a donut chart |
| Relationship between two numeric variables | `scatter` | `x`, `y` |
| Numeric distribution | `histogram` | Array of raw numeric observations |
| Grouped distribution | `boxplot`, `violin` | `category`, `value`; include multiple observations per category |
| Compare multiple metrics | `radar` | `name`, `value` |
| Stage conversion | `funnel` | `category`, `value`, ordered by stage |
| Cumulative increase or decrease | `waterfall` | `category`, `value`; mark the total item with `category` and `isTotal true` |
| Single progress value | `liquid` | Top-level `percent`, from 0 to 1; no `data` array |
| Word frequency | `word-cloud` | `text`, `value` |
| Set intersections | `venn` | `sets`, `value`; write intersections as `sets A,B` |
| Hierarchical composition | `treemap` | `name`, `value`, optionally nested in a `children` array |
| Flow | `sankey` | `source`, `target`, `value` |
| Exact value lookup | `table` | Fields from the original rows |
| Series with different scales | `dual-axes` | Top-level `categories` and `series` arrays; each series has `type` (`column` or `line`), `axisYTitle`, and numeric `data` aligned with `categories` |

## Build the Spec

A Spec contains exactly two strings: `chartType`, the chart type, and `syntax`, the GPT-Vis syntax text.

- The first line must be `vis <chartType>` and match the Spec's chart type.
- Write properties as `key value`, without colons. Indent nested content by two spaces and start array items with `- `.
- Put data before title and axis properties. Use plain numbers for numeric values; put units in the title or axis title.
- Quote field names or strings that contain spaces. The chart size adapts to its container, so do not set `width` or `height`.

For example, given regional totals `[{"region":"East","total":25},{"region":"West","total":20}]`, map `region → category` and `total → value`, then save as `chart.json`:

```json
{
  "chartType": "column",
  "syntax": "vis column\ndata\n  - category East\n    value 25\n  - category West\n    value 20\ntitle \"Total by region\"\naxisXTitle Region\naxisYTitle Total"
}
```

Use a JSON serializer to escape newlines, quotes, and backslashes in `syntax`.

## Render and Inspect

```sh
ava viz --spec @chart.json --output chart.html
```

The returned `output` is the absolute path to the HTML file. Existing files are not overwritten. The HTML requires an internet connection to load GPT-Vis.

The CLI validates only the Spec structure and chart type; it does not verify that the syntax renders correctly. If a browser is available, preview the chart and check the field mappings, ordering, title, units, and data range. If you do not preview it, say so. Label Top N selections and aggregated categories in the chart.

If rendering fails, fix the error and retry up to two times. If it still fails, provide the results table and explain why the chart could not be rendered.
