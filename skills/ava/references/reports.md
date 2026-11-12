# Reports

`scripts/report.mjs` records AVA query evidence and assembles HTML. Invoke it by absolute path from the task directory; it uses `ava` from `PATH` and has no extra dependencies.

## Record queries

Execute report queries through the recorder so results and evidence come from the same call:

```sh
node /absolute/path/to/ava/scripts/report.mjs query "$DATASET_ID" \
  --dsl monthly.sql --source sales.csv --evidence evidence
```

Returns results, `queryId`, and `evidenceOutput`. Limit flags match `ava query`. Use a non-secret source label; evidence stores SQL, results, source, session, and time. Correct errors with a new query, not by editing evidence. List saved evidence with:

```sh
node /absolute/path/to/ava/scripts/report.mjs index --evidence evidence
```

Evidence survives session expiry/disposal. Keep it with deliverables, separate from reusable business definitions.

## Assemble a report

Reference recorded IDs. The total metric and monthly section below use separate queries:

```json
{
  "title": "Monthly sales",
  "summary": "Summarize findings supported by the executed results.",
  "metrics": [
    {"label": "Revenue", "queryId": "q_<total-query-hash>", "field": "revenue", "rowIndex": 0, "unit": "CNY"}
  ],
  "sections": [{
    "id": "monthly-revenue",
    "question": "How did revenue change by month?",
    "conclusion": "Explain the measured change, its scope and limitations.",
    "queryId": "q_<monthly-query-hash>",
    "chartFields": {"time": "month", "value": "revenue"},
    "chart": {"chartType": "line", "config": {"axisYTitle": "Revenue (CNY)"}}
  }],
  "definitions": ["State confirmed metric definitions, eligible records and time range."],
  "limitations": ["State material data gaps and limits on interpretation."]
}
```

`rowIndex` selects a result row, not a total. Compute totals/ratios in SQL; `unit` only labels them. Numeric strings retain precision in tables/metrics; charts need numeric values.

`chartFields` maps native chart fields to result-column names ([field shapes](visualization.md)). For histogram/liquid/dual-axes, use `chartConfigField` instead to select a config object from a single result row. Bindings do not convert types or units. Inline chart data is rejected; omit chart/bindings for table-only sections.

```sh
node /absolute/path/to/ava/scripts/report.mjs render \
  --evidence evidence --spec report-spec.json --output report-v1.html
```

Produces HTML and matching JSON; the parent directory must exist and output files must be new. Empty/truncated results are not plotted; truncated results cannot supply metrics. Rendering failures keep the table/code and appear in `chartErrors`; report actual `chartCount`.

HTML embeds query data; charts load GPT-Vis 1.3.1 from registry.npmmirror.com, while text/tables/SQL work offline. Account for this when sharing. Preview each chart in a browser when available; generation alone is not a preview.

## Layout and style

Use the bundled layout by default. For requested style changes, copy `assets/report.html` into the task directory and pass `--template report-template.html`. Preserve the binding code and single `<!-- ARTIFACT_DATA -->` slot; keep assets self-contained. `src="icon.svg"` is embedded automatically. Chart styles use `chart.config`; reuse the template on follow-ups.

## Follow-up questions and revisions

Read the previous JSON and evidence index; query only for new computations. In a patch spec, omitted fields persist and supplied arrays replace prior arrays, except `sections`: matching `id` replaces the whole section, new IDs append, and omitted IDs remain. Update summary/metrics when findings change.

```sh
node /absolute/path/to/ava/scripts/report.mjs render \
  --evidence evidence --spec follow-up.json \
  --previous report-v1.json --output report-v2.html
```

Previous JSON includes evidence, so presentation changes need no live session. Preserve earlier questions and deliver the new HTML and JSON.
