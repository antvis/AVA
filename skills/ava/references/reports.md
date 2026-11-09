# Reports

Use `scripts/report.mjs` relative to this skill's directory for complete analysis reports. It executes the existing AVA CLI and assembles HTML from saved evidence, with no additional npm dependencies or model key. Resolve the installed skill path; do not assume the user's working directory is the skill directory.

The agent writes the analysis and queries. The script saves actual execution evidence and assembles the HTML; it does not verify the truth of narrative conclusions. Continue to apply the analysis and business-definition rules in SKILL.md.

## Layout and style

`assets/report.html` is a general-purpose default example. When the user has no layout or style requirements, use it as supplied without asking them to choose a style. If the user provides a reference or requests different typography, colors, branding or layout, copy the template into the task directory and adjust that copy to match the request. Pass it with `render --template /task/report-template.html`; keep the installed default intact for other tasks.

Preserve the template's data-binding behavior and its single `<!-- ARTIFACT_DATA -->` slot. Layout changes must keep the conclusions, metric values, charts, result tables and query code tied to the saved evidence. The script fills that slot with the same report payload and embeds the default logo where `src="icon.svg"` remains. Keep other custom assets self-contained. Chart appearance can also be adjusted through `chart.config` using the options in [Visualization](visualization.md). Presentation changes reuse existing evidence and do not require new queries.

## Record queries

Use a task-specific output directory. The shell must resolve `ava` to a working CLI 4.x and `node` to Node.js 22.13+. `AVA_CLI` can select a different AVA executable; use an executable wrapper when an entrypoint needs explicit Node arguments. This is a process-local choice, not a global configuration change.

After loading the source and inspecting schema, save each report query as `.sql`, `.py`, or `.js`, matching the session language. Execute it through the recorder rather than separately running and then copying its result:

```sh
node /absolute/path/to/ava/scripts/report.mjs query "$DATASET_ID" \
  --dsl /task/monthly.sql --source sales.csv --evidence /task/evidence
```

The command returns the real query result, `queryId` and `evidenceOutput`. Optional `--max-rows` and `--max-result-bytes` have the same meaning as AVA query limits. Inspect results and truncation before using them. Compute comparisons and ratios in the engine. A failed query does not create evidence; an uncertain operation must not be automatically retried.

Each `q_<hash>.json` is an exclusively created snapshot containing the query code, language, dataset ID, source label, execution time, and result. The hash detects changes to saved evidence; it is not a signature proving who created it. Use a non-secret source label, not credentials or a connection URL. Do not edit evidence files to correct results: execute the corrected query and reference its new ID.

The evidence directory is the durable query index. Discover its entries without loading all rows into the conversation:

```sh
node /absolute/path/to/ava/scripts/report.mjs index --evidence /task/evidence
```

Evidence remains usable after session disposal or expiry. Keep it with task deliverables; reusable business definitions still belong in the separate semantic location.

## Assemble a report

Write a report specification containing narrative and references to recorded queries. Replace the example query ID with the ID actually returned by `query`:

```json
{
  "title": "Monthly sales",
  "summary": "Summarize findings supported by the executed results.",
  "metrics": [
    {"label": "Revenue", "queryId": "q_<actual hash>", "field": "revenue", "rowIndex": 0, "unit": "CNY"}
  ],
  "sections": [{
    "id": "monthly-revenue",
    "question": "How did revenue change by month?",
    "conclusion": "Explain the measured change, its scope and limitations.",
    "queryId": "q_<actual hash>",
    "chartFields": {"time": "month", "value": "revenue"},
    "chart": {"chartType": "line", "config": {"axisYTitle": "Revenue (CNY)"}}
  }],
  "definitions": ["State confirmed metric definitions, eligible records and time range."],
  "limitations": ["State material data gaps and limits on interpretation."]
}
```

Use a separate aggregate query for an overall metric; `rowIndex` selects an existing row and never computes a total. Metric units are display labels, not conversions. The report preserves numeric strings for precise amounts and large integers.

For charts, follow [Visualization](visualization.md) for selection and native field shapes. `chartFields` is a mapping from native fields to exact query column names and belongs beside `chart`. It does not convert numeric strings, percentages, units or data types. Do not rerun a query just to rename columns. For histogram, liquid or dual-axes, `chartConfigField` may instead reference a column containing a native config object in exactly one query row. Bindings are mutually exclusive. Inline `data`, `categories`, `series` and `percent` in chart config are rejected. Omit chart and bindings for a table-only section.

```sh
node /absolute/path/to/ava/scripts/report.mjs render \
  --evidence /task/evidence --spec /task/report-spec.json --output /task/report-v1.html
```

Omit `--template` for the default layout. Supply the task-local template only when adapting the report to the user's layout or style requirements.

The script produces HTML and matching JSON, both with owner-only permissions; their parent directory must exist. Existing files are never overwritten. Invalid references or chart bindings fail before output files are created. Empty or truncated results are not plotted; truncated results cannot supply metric cards. A renderer failure keeps the affected table and code and is returned in `chartErrors`. Report the returned `chartCount`, not the number of requested charts.

The HTML embeds query results. Sharing it shares those results. Interactive charts load third-party GPT-Vis scripts from unpkg.com, which can access chart data; explain this dependency when relevant to the user's sharing or data authorization. The report body, tables and code can be viewed offline. Preview the actual report when a browser is available and check labels, values, units, charts and code. Generation alone does not prove browser rendering; the script returns `chartPreviewVerified: false`.

## Follow-up questions and revisions

Read the previous report's matching JSON and the evidence index. Execute only queries needed for new computations. Keep stable section IDs: a supplied section with an existing ID replaces that complete section; new IDs append sections. Sections not supplied remain intact. Include the complete section when replacing it.

Create a patch specification with the new or replacement sections and any changed summary, title, metrics, definitions or limitations. Omitted top-level fields retain their previous values; supplied arrays replace those arrays. Update the summary and metric cards when findings change. Pass the previous JSON generated by this script and a new output filename:

```sh
node /absolute/path/to/ava/scripts/report.mjs render \
  --evidence /task/evidence --spec /task/follow-up.json \
  --previous /task/report-v1.json --output /task/report-v2.html
```

The previous JSON also contains the evidence needed by its sections, so earlier questions remain reproducible even if their live sessions have expired. Presentation-only changes need no live dataset. Never silently revise historical evidence or discard earlier questions; explain corrected conclusions in the new report. Deliver the new HTML and JSON links with the findings and material limits.

If the report uses a customized layout, reuse its task-local `--template` on follow-up renders unless the user requests another style.
