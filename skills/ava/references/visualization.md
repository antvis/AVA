# Visualization

Verified against the published `@antv/gpt-vis` **1.3.1** package (2026-11-09). Use the [official chart reference](https://gpt-vis.antv.vision/docs/charts) for native options. AVA accepts a JSON Spec; SDK Syntax strings and T8 Summary text are not CLI inputs.

## Spec and Field Mapping

A Spec has exactly two keys: `{ "chartType": "…", "config": {…} }`. Put the fields below directly in `config`; most types use `config.data` as an array of row objects. `value`, `x`, and `y` must be numbers. Map a second dimension to row field `group`.

GPT-Vis supports 26 types; AVA currently accepts the 19 below. Its CLI does not register `flow-diagram`, `network-graph`, `mindmap`, `indented-tree`, `organization-chart`, `fishbone-diagram`, or `summary`.

| `chartType` | Data fields or structure |
| --- | --- |
| `column`, `bar` | `category`, `value`, optional `group`; `config.stack: true` or `config.group: true` |
| `line` | `time`, `value`, optional `group` |
| `area` | `time`, `value`, optional `group`; `config.stack: true` for stacked area |
| `pie` | `category`, nonnegative `value` with positive total; `innerRadius` 0.6 creates a donut chart |
| `scatter` | `x`, `y`, optional `group` |
| `histogram` | Array of raw numeric observations |
| `boxplot`, `violin` | `category`, `value`, optional `group`; multiple observations per category |
| `radar` | `name`, `value`, optional `group`; `align: true` uses a shared scale |
| `funnel` | `category`, `value`, ordered by stage |
| `waterfall` | `category`, `value`; a total has `"isTotal": true` and no `value` |
| `liquid` | Top-level `percent`, from 0 to 1; no `data` array |
| `word-cloud` | Nonempty `text`, positive `value`; up to the 50 highest-weight words |
| `venn` | `sets`, `value`, optional `label`; use arrays such as `["A", "B"]` for report compatibility |
| `treemap` | `name`, `value`, optionally nested in a `children` array |
| `sankey` | `source`, `target`, `value` |
| `table` | Fields from the original rows |
| `dual-axes` | Top-level `categories` and `series` arrays; each series has `type` (`column` or `line`), `axisYTitle`, and numeric `data` aligned with `categories` |

For grouped columns/bars, every row needs `group` and the config needs `group: true`; use `stack: true` for stacking. Do not enable both. Row `group` alone does not select a layout. `label: false` hides column/bar value labels.

Sankey flows must be acyclic. `config.type` is filled from `chartType`. Put units in titles/axis labels. `width`, `height`, and `wrapper` are SDK constructor options, not chart config; AVA supplies the container.

## Themes and Styles

In 1.3.1, `config.theme` accepts `default`/`light`, `dark`, `academy`, `gpt-vis`, `midnight`, `paper`, `product`, `neon-circuit`, `terra-print`, `mono-signal`, `candy-pop`, `pop`, or `bauhaus`. Use `default` without a style request. For custom branding, pass a complete ThemeSpec object (supported since 1.3.0): required `id` and `label`, optional `description`, `baseTheme`, `tokens`, `style`, and `charts`.

`id` does not register a custom theme name: reuse the full object in each chart's `config.theme`. Overrides resolve as built-in defaults → `tokens` → theme `style` → `charts[type].style` → chart `config.style`. Nested objects merge; arrays replace. In a report, set each section's `chart.config.theme`.

Tokens cover shared colors, palettes, fonts, spacing, and radius. Style namespaces include `backgroundColor`, `palette`, `title`, `axis`, `legend`, `label`, `mark`, `node`, `edge`, `table`, `summary`, and `texture`; each chart consumes supported fields. Use `style.mark.line.lineWidth` instead of deprecated `style.lineWidth`. Check the [theme field reference](https://gpt-vis.antv.vision/docs/reference/theme-spec) for exact properties; unknown fields may be ignored. Colors are CSS values, not token-name strings.

Data, grouping, layout, and mark visibility stay in chart config. In particular, `style.startAtZero` is a per-chart numeric-axis option for `boxplot`, `violin`, and `dual-axes`, not a ThemeSpec field. Waterfall `style.palette` order is positive, negative, total.

## JSON Examples

Dual-axes `config` fragment (wrap it in a Spec with `chartType: "dual-axes"`):

```json
{
  "categories": ["Jan", "Feb"],
  "series": [
    { "type": "column", "axisYTitle": "Sales", "data": [820, 650] },
    { "type": "line", "axisYTitle": "Profit", "data": [12, 10] }
  ]
}
```

For result rows `[{"region":"East","total":25},{"region":"West","total":20}]`, map `region → category` and `total → value`. This complete `chart.json` includes a reusable ThemeSpec:

```json
{
  "chartType": "column",
  "config": {
    "data": [
      { "category": "East", "value": 25 },
      { "category": "West", "value": 20 }
    ],
    "theme": {
      "id": "regional-sales",
      "label": "Regional sales",
      "baseTheme": "default",
      "tokens": {
        "colorDefault": "#2563eb",
        "category10": ["#2563eb", "#0f766e", "#b45309"],
        "fontFamily": "Arial, sans-serif",
        "fontSize": 12
      }
    },
    "title": "Total by region",
    "axisXTitle": "Region",
    "axisYTitle": "Total"
  }
}
```

## Render and Inspect

```sh
ava viz --spec @chart.json --output chart.html
```

`viz` needs no dataset ID. It returns an absolute `output` path and does not overwrite existing files. Charts load GPT-Vis from the internet. The CLI validates the Spec wrapper and type name, not browser rendering. Preview labels, ordering, units, values, and theme when a browser is available; otherwise disclose that no preview was performed. On failure, correct the cause or deliver the table with the error explained.
