import { profileOutputSchema } from '../contracts';

import { assessQuality } from './quality';

import type { JsonValue } from '../types';

const htmlEntities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

function table(headers: string[], rows: string[][]): string {
  const head = headers.map((value) => `<th scope="col">${escape(value)}</th>`).join('');
  const body = rows
    .map(
      ([first, ...rest]) => `<tr><th scope="row">${first}</th>${rest.map((cell) => `<td>${cell}</td>`).join('')}</tr>`
    )
    .join('');
  return `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function record(value: JsonValue): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function valueMarkup(value: JsonValue | undefined): string {
  if (value === undefined) return '<span class="missing">—</span>';
  if (value === null) return '<span class="missing">null</span>';
  if (Array.isArray(value)) {
    if (!value.length) return '<span class="missing">0 entries</span>';
    const entries =
      value.every(record) && value.some((row) => Object.keys(row).length)
        ? value
        : value.map((item, index) => ({ index, value: item }));
    const keys = [...new Set(entries.flatMap(Object.keys))];
    return `<details><summary>${value.length} entries</summary>${table(
      keys,
      entries.map((row) =>
        keys.map((key) => valueMarkup(Object.prototype.hasOwnProperty.call(row, key) ? row[key] : undefined))
      )
    )}</details>`;
  }
  if (record(value)) {
    const { counts, bin_edges: edges, columns, matrix } = value;
    if (
      Array.isArray(counts) &&
      counts.length &&
      counts.every((n) => typeof n === 'number' && n >= 0) &&
      Array.isArray(edges) &&
      edges.length === counts.length + 1 &&
      edges.every((n) => typeof n === 'number')
    ) {
      const max = (counts as number[]).reduce((highest, count) => Math.max(highest, count), 1);
      return `<details open><summary>Distribution</summary>${table(
        ['From', 'To', 'Count', 'Relative frequency'],
        counts.map((count, i) => [
          valueMarkup(edges[i]),
          valueMarkup(edges[i + 1]),
          valueMarkup(count),
          `<meter min="0" max="${max}" value="${count}" aria-label="Bin ${i + 1}: ${count}"></meter>`,
        ])
      )}</details>`;
    }
    if (
      Array.isArray(columns) &&
      columns.every((name) => typeof name === 'string') &&
      Array.isArray(matrix) &&
      matrix.length === columns.length &&
      matrix.every(
        (row) =>
          Array.isArray(row) && row.length === columns.length && row.every((v) => v === null || typeof v === 'number')
      )
    ) {
      const rows = matrix as (number | null)[][];
      return `<details><summary>${columns.length} columns</summary>${table(
        ['Column', ...columns],
        rows.map((row, i) => [
          escape(columns[i]),
          ...row.map((value) =>
            value === null
              ? valueMarkup(value)
              : `<span class="coefficient ${value < 0 ? 'negative' : ''}" style="--strength:${
                  Math.min(1, Math.abs(value)) * 0.35
                }" title="${value}">${value.toFixed(3)}</span>`
          ),
        ])
      )}</details>`;
    }
    const entries = Object.entries(value);
    if (!entries.length) return '<span class="missing">0 entries</span>';
    return `<details><summary>${entries.length} fields</summary>${table(
      ['Field', 'Value'],
      entries.map(([key, item]) => [escape(key), valueMarkup(item)])
    )}</details>`;
  }
  return escape(String(value));
}

function metricTable(metrics: Record<string, JsonValue>): string {
  return table(
    ['Metric', 'Value'],
    Object.entries(metrics).map(([name, value]) => [escape(name), valueMarkup(value)])
  );
}

const css = `
  :root { color-scheme: light; --paper:#f6f3eb; --ink:#202a24; --muted:#536259; --line:#cfcec0; --green:#235943; --alert:#933b24; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font:16px/1.55 "Instrument Sans", Verdana, sans-serif; }
  header, main { max-width:85rem; margin:auto; padding:2.5rem clamp(1rem,4vw,4rem); }
  header { border-bottom:1px solid var(--line); }
  h1, h2 { font-family:"Instrument Serif", Georgia, serif; font-weight:400; line-height:1; margin:0 0 1.25rem; }
  h1 { font-size:clamp(2.8rem,7vw,6rem); max-width:19ch; overflow-wrap:anywhere; }
  h2 { font-size:clamp(2.1rem,4vw,3.5rem); overflow-wrap:anywhere; }
  h3 { margin:1.6rem 0 .6rem; font-size:1.02rem; }
  nav { display:flex; flex-wrap:wrap; gap:.65rem 1.45rem; }
  a, summary { color:var(--green); }
  a:focus-visible, summary:focus-visible { outline:2px solid var(--green); outline-offset:3px; }
  section + section { margin-top:3rem; padding-top:2.5rem; border-top:2px solid var(--ink); }
  .table-scroll { max-width:100%; overflow:auto; }
  table { border-collapse:collapse; width:100%; font-size:.88rem; font-variant-numeric:tabular-nums; }
  th, td { border-bottom:1px solid var(--line); padding:.55rem .75rem; text-align:left; vertical-align:top; overflow-wrap:anywhere; }
  th { font-weight:600; }
  thead { background:#e7eadf; }
  tbody tr:hover { background:#eeece2; }
  details { max-width:100%; }
  summary { cursor:pointer; }
  .column { border-top:1px solid var(--line); padding:.75rem 0; }
  .column > summary { font-size:1.08rem; font-weight:600; }
  .column > summary span, .missing { color:var(--muted); font-weight:400; }
  .column > div { margin:.6rem 0 0 1rem; }
  .alert th { color:var(--alert); }
  meter { width:clamp(4rem,18vw,12rem); accent-color:var(--green); }
  .coefficient { background:rgba(35,89,67,var(--strength)); display:block; min-width:4.5rem; padding:.15rem .3rem; text-align:right; }
  .coefficient.negative { background:rgba(147,59,36,var(--strength)); }
  @media (max-width:40rem) { th,td { padding:.45rem; } .column > div { margin-left:0; } }
  @media print { body { background:white; } header, main { padding:1rem 0; } nav { display:none; } }
`;

/** Render a standalone report from saved observations. */
export function renderProfileHtml(input: unknown, { title = 'Data profile' }: { title?: string } = {}): string {
  const profile = profileOutputSchema.parse(input);
  const quality = assessQuality(profile, {});
  const navigation = profile.models.map(({ name }, i) => `<a href="#model-${i}">${escape(name)}</a>`).join('');
  const models = profile.models
    .map(({ name, metrics, columns }, i) => {
      const alerts = quality.models[i].alerts;
      const alertTable = alerts.length
        ? `<div class="alert"><h3>Quality alerts</h3>${table(
            ['Rule', 'Column', 'Related column', 'Value', 'Threshold'],
            alerts.map((alert) => [
              escape(alert.rule),
              valueMarkup(alert.column),
              valueMarkup(alert.relatedColumn),
              valueMarkup(alert.value),
              valueMarkup(alert.threshold),
            ])
          )}</div>`
        : '';
      const variables = columns
        .map(
          (column) => `<details class="column"><summary>${escape(column.name)}
      <span>${escape(column.properties.profileType ?? column.properties.logicalType)}</span></summary>${metricTable(
            column.metrics
          )}</details>`
        )
        .join('');
      return `<section id="model-${i}"><h2>${escape(name)}</h2>${
        Object.keys(metrics).length ? metricTable(metrics) : ''
      }${alertTable}${variables ? `<h3>Columns</h3>${variables}` : ''}</section>`;
    })
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escape(title)}</title><style>${css}</style></head><body><header><h1>${escape(
    title
  )}</h1><nav aria-label="Models">${navigation}</nav></header>
    <main>${models}</main></body></html>`;
}
