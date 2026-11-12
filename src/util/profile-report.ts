import { z } from 'zod';

import { profileOutputSchema } from '../contracts';

import { assessQuality } from './quality';
import { compareProfiles } from './profile-compare';

import type { JsonValue, Profile } from '../types';
import type { ProfileComparison } from './profile-compare';

const htmlEntities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

function table(headers: string[], rows: string[][], className = ''): string {
  const head = headers.map((value) => `<th scope="col">${escape(value)}</th>`).join('');
  const body = rows
    .map(
      ([first, ...rest]) => `<tr><th scope="row">${first}</th>${rest.map((cell) => `<td>${cell}</td>`).join('')}</tr>`
    )
    .join('');
  return `<div class="table-scroll"><table class="${className}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function record(value: JsonValue): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const bandsSchema = z.object({
  columns: z.array(z.string()),
  bands: z.array(z.object({ start: z.number(), end: z.number(), present: z.array(z.number().min(0).max(1)) })),
});

function missingBandMarkup(value: Record<string, JsonValue>): string | undefined {
  if (!Array.isArray(value.bands)) return undefined;
  const parsed = bandsSchema.safeParse(value);
  if (!parsed.success || !parsed.data.bands.every(({ present }) => present.length === parsed.data.columns.length))
    return undefined;
  const { columns, bands } = parsed.data;
  const rows = bands.map(({ start, end, present }) => [
    `<span class="visually-hidden">Rows ${start + 1}–${end}</span>`,
    ...present.map(
      (coverage) =>
        `<span class="band-cell" style="--coverage:${coverage}" role="img" aria-label="${
          coverage * 100
        }% present" title="Rows ${start + 1}–${end}, ${coverage * 100}% present"></span>`
    ),
  ]);
  return `<details><summary>${
    bands.length
  } row bands</summary><p class="missing">Darker cells indicate more present values.</p>${table(
    ['Rows', ...columns],
    rows,
    'missing-bands'
  )}</details>`;
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
    const bandMarkup = missingBandMarkup(value);
    if (bandMarkup) return bandMarkup;
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

const pointSchema = z.object({ x: z.number(), y: z.number() });
const scatterSchema = z.object({
  x_column: z.string(),
  y_column: z.string(),
  count: z.number().nonnegative(),
  gridsize: z.number().positive(),
  x_min: z.number().nullable(),
  x_max: z.number().nullable(),
  y_min: z.number().nullable(),
  y_max: z.number().nullable(),
  points: z.array(pointSchema),
  hexagons: z.array(pointSchema.extend({ count: z.number().positive() })),
});

function scatterMarkup(chart: z.output<typeof scatterSchema>): string {
  const title = `${escape(chart.y_column)} vs ${escape(chart.x_column)}`;
  if (!chart.count)
    return `<figure><figcaption>${title}</figcaption><span class="missing">0 observations</span></figure>`;
  const normalized = (value: number, lo: number, hi: number) =>
    hi === lo ? 0.5 : Number.isFinite(hi - lo) ? (value - lo) / (hi - lo) : (value / 2 - lo / 2) / (hi / 2 - lo / 2);
  const hex = chart.hexagons.length > 0;
  const peak = chart.hexagons.reduce((maximum, { count }) => Math.max(maximum, count), 1);
  const marks = hex
    ? chart.hexagons.map(
        ({ x, y, count }) => `<span class="hexagon" title="${count} observations"
      style="left:${x * 100}%;bottom:${y * 100}%;width:${100 / chart.gridsize}%;height:${
          300 / (Math.sqrt(3) * chart.gridsize)
        }%;opacity:${0.15 + 0.85 * Math.sqrt(count / peak)}"></span>`
      )
    : chart.points.map(
        ({ x, y }) => `<span class="point" title="(${x}, ${y})"
      style="left:${normalized(x, chart.x_min!, chart.x_max!) * 100}%;bottom:${
          normalized(y, chart.y_min!, chart.y_max!) * 100
        }%"></span>`
      );
  return `<figure class="scatter"><figcaption>${title} · ${chart.count} observations</figcaption>
    <div class="scatter-chart" role="img" aria-label="${title}">${marks.join('')}</div>
    <div class="scatter-bounds"><span>${escape(chart.x_column)} ${chart.x_min}–${chart.x_max}</span>
    <span>${escape(chart.y_column)} ${chart.y_min}–${chart.y_max}</span></div></figure>`;
}

function metricValueMarkup(name: string, value: JsonValue | undefined): string {
  if (name === 'scatter_pairs') {
    const charts = z.array(scatterSchema).safeParse(value);
    if (charts.success && charts.data.length)
      return `<details><summary>${charts.data.length} pairs</summary>${charts.data
        .map(scatterMarkup)
        .join('')}</details>`;
  }
  return valueMarkup(value);
}

function metricTable(metrics: Record<string, JsonValue>): string {
  return table(
    ['Metric', 'Value'],
    Object.entries(metrics).map(([name, value]) => [escape(name), metricValueMarkup(name, value)])
  );
}

function missingBar(model: Profile['models'][number], referenceSemantics: boolean): string {
  const summary = model.metrics.table_summary;
  const rows = model.metrics.row_count ?? (summary && record(summary) ? summary.row_count : undefined);
  if (typeof rows !== 'number' || rows <= 0) return '';
  const values = model.columns.flatMap(({ name, metrics }) => {
    if (typeof metrics.null_count !== 'number') return [];
    const missing =
      metrics.null_count + (!referenceSemantics && typeof metrics.nan_count === 'number' ? metrics.nan_count : 0);
    const present = rows - missing;
    if (present < 0 || present > rows) return [];
    return [
      [
        escape(name),
        String(present),
        String(missing),
        `<meter min="0" max="${rows}" value="${present}" aria-label="${present} of ${rows} rows present"></meter>`,
      ],
    ];
  });
  return values.length
    ? `<details><summary>Column coverage</summary>${table(
        ['Column', 'Present', 'Missing', 'Share present'],
        values
      )}</details>`
    : '';
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
  .missing-bands tbody th, .missing-bands tbody td { padding:0; border:0; line-height:0; }
  .band-cell { display:block; height:4px; background:rgba(35,89,67,var(--coverage)); border-right:1px solid var(--paper); }
  .visually-hidden { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
  .scatter { margin:1rem 0; min-width:12rem; max-width:35rem; }
  .scatter-chart { position:relative; aspect-ratio:3/2; background:#fdfbf4; overflow:hidden; border:1px solid var(--line); }
  .scatter-chart span { position:absolute; transform:translate(-50%,50%); background:var(--green); }
  .scatter-chart .point { width:.4rem; height:.4rem; border-radius:50%; opacity:.7; }
  .scatter-chart .hexagon { clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); }
  .scatter-bounds { display:flex; flex-wrap:wrap; justify-content:space-between; gap:.2rem .8rem; color:var(--muted); }
  @media (max-width:40rem) { th,td { padding:.45rem; } .column > div { margin-left:0; } }
  @media print { body { background:white; } header, main { padding:1rem 0; } nav { display:none; } }
`;

function documentHtml(title: string, modelNames: string[], models: string): string {
  const navigation = modelNames.map((name, i) => `<a href="#model-${i}">${escape(name)}</a>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escape(title)}</title><style>${css}</style></head><body><header><h1>${escape(title)}</h1>
    <nav aria-label="Models">${navigation}</nav></header><main>${models}</main></body></html>`;
}

/** Render a standalone report from saved observations. */
export function renderProfileHtml(input: unknown, { title = 'Data profile' }: { title?: string } = {}): string {
  const profile = profileOutputSchema.parse(input);
  const quality = assessQuality(profile, {});
  const models = profile.models
    .map((model, i) => {
      const { name, metrics, columns } = model;
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
      }${missingBar(model, profile.semantics === 'data-profiling')}${alertTable}${
        variables ? `<h3>Columns</h3>${variables}` : ''
      }</section>`;
    })
    .join('');
  return documentHtml(
    title,
    profile.models.map(({ name }) => name),
    models
  );
}

export function renderProfileComparisonHtml(
  before: unknown,
  after: unknown,
  { title = 'Profile comparison' }: { title?: string } = {}
): string {
  const comparison = compareProfiles(before, after);
  const metricsTable = (metrics: ProfileComparison['models'][number]['metrics']) =>
    table(
      ['Metric', 'Before', 'After', 'Change'],
      metrics.map((metric) => [
        escape(metric.name),
        metricValueMarkup(metric.name, metric.before),
        metricValueMarkup(metric.name, metric.after),
        valueMarkup(metric.delta),
      ])
    );
  const models = comparison.models
    .map(({ name, metrics, columns }, i) => {
      const variables = columns
        .map((column) => {
          const left = column.before?.profileType ?? column.before?.logicalType;
          const right = column.after?.profileType ?? column.after?.logicalType;
          const types = left === right ? valueMarkup(left) : `${valueMarkup(left)} → ${valueMarkup(right)}`;
          return `<details class="column"><summary>${escape(column.name)} <span>${types}</span></summary>${metricsTable(
            column.metrics
          )}</details>`;
        })
        .join('');
      return `<section id="model-${i}"><h2>${escape(name)}</h2>${metrics.length ? metricsTable(metrics) : ''}${
        variables ? `<h3>Columns</h3>${variables}` : ''
      }</section>`;
    })
    .join('');
  return documentHtml(
    title,
    comparison.models.map(({ name }) => name),
    models
  );
}
