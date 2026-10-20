# Visualization

Build charts from user-provided data or the `data` in query results. All engines use the same charting workflow.

## Recommend a Chart

Work through these four steps before picking a `chartType`. If the user names a chart type, honor it unless the data cannot support it; then explain and suggest an alternative.

### 1. Identify the intent

| User asks about | Intent | Candidates |
| --- | --- | --- |
| Compare, rank, top N, which is highest | Comparison | `column`, `bar` |
| Trend, change over time, growth | Trend | `line`, `area` |
| Share, proportion, composition | Part-to-whole | `pie`, `treemap`, stacked `column` |
| Correlation, relationship, impact of A on B | Relationship | `scatter` |
| Distribution, spread, outliers | Distribution | `histogram`, `boxplot`, `violin` |
| Conversion, drop-off by stage | Funnel | `funnel` |
| Increase and decrease contributions to a total | Change breakdown | `waterfall` |
| Flow between nodes | Flow | `sankey` |
| Overlap between sets | Intersection | `venn` |
| Look up exact values, many columns, details | Lookup | `table` |

### 2. Analyze the data

- Classify each field: time (dates, years, months), category (text, codes), numeric (measures), or text for frequency analysis. Numeric IDs and year-like numbers are not measures.
- Count rows, distinct categories, series, and numeric fields. Note negatives, zeros, nulls, and ordering.
- Aggregate first when needed. Query results with many raw rows should be grouped (`GROUP BY`) or binned before charting; keep raw rows only for `scatter`, `histogram`, `boxplot`, `violin`, and `table`.
- Fields to choose from: one time + one numeric → `line`; one category + one numeric → `column`/`bar`; two numerics → `scatter`; one numeric alone → `histogram`; two categorical/time dimensions + one numeric → grouped or stacked `column`/`line` using `group`; two numerics on different scales over one dimension → `dual-axes`.

### 3. Match the scenario and apply limits

- `pie`: at most about 5 categories, all values non-negative, values must sum meaningfully to a whole. Merge the tail into "Other" or use `bar` otherwise. Never use it for trends. Values must be plain numbers, not percentage strings.
- `line`/`area`: use for ordered time or sequence data only; never for unordered categories. Use `area` with `stack` only when the total matters.
- `column` vs `bar`: use `bar` for long labels or more than about 8 categories. Show Top N (usually 10) sorted by value for large category sets and label it.
- `histogram`: continuous values (salary, age, score) need raw observations, not pre-aggregated counts.
- `boxplot`/`violin`: need many observations per category; with only one value per category use `column`.
- `scatter`: both axes numeric; add `group` for a third categorical dimension. For many categories prefer a table.
- `radar`: 3-8 dimensions and few series; otherwise use `column`.
- `funnel`: ordered stages with monotonically decreasing values.
- `waterfall`: signed changes; mark the total with `isTotal true`.
- `dual-axes`: only when scales differ greatly; do not mix unrelated measures.
- `liquid`: one percentage only; `treemap`: hierarchy with non-negative values; `sankey`: needs `source`/`target` pairs without cycles.
- Fall back to `table` when no chart fits, there are more than two measures with no clear intent, or the user wants exact values.

### 4. Check before rendering

Confirm the chosen chart answers the question asked, numeric fields really are numbers, the time axis is sorted ascending, and the title and axis titles (with units) are set. Do not invent data; if the data is insufficient (e.g. one row for a trend), say so and suggest a `table` or ask for more data.

## Choose a Chart and Map Fields

Map actual fields to the required fields below. Unless noted otherwise, fields belong to each item in the `data` array; `value`, `x`, and `y` are numeric. Optional `group` splits series for `line`, `area`, `column`, `bar`, `scatter`, `boxplot`, and `violin`; when there are two dimensions, put the primary axis dimension in `time`/`category` and the other in `group`. `column`, `bar` also support `stack` or `group true`.

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
