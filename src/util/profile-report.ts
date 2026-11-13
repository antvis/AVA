import { z } from 'zod';

import { profileOutputSchema } from '../contracts';

import { assessQuality } from './quality';
import { compareProfiles } from './profile-compare';
import { validateProfileExpectations } from './profile-expectations';

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

const numberFormat = new Intl.NumberFormat('en', { maximumSignificantDigits: 5 });
const integerFormat = new Intl.NumberFormat('en');
const percentageFormat = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 2 });

function chartNumber(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < 1e12) return integerFormat.format(value);
  return value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1e12)
    ? value.toExponential(3)
    : numberFormat.format(value);
}

function dateLabel(value: number): string {
  if (Math.abs(value) > 8.64e15) return chartNumber(value);
  const iso = new Date(value).toISOString();
  const [day, time] = iso.split('T');
  return time === '00:00:00.000Z' ? day : `${day} ${time.replace(/(?:\.000)?Z$/, ' UTC')}`;
}

function normalized(value: number, lo: number, hi: number): number {
  if (hi === lo) return 0.5;
  if (Number.isFinite(hi - lo)) return (value - lo) / (hi - lo);
  return (value / 2 - lo / 2) / (hi / 2 - lo / 2);
}

const histogramSchema = z.object({ bin_edges: z.array(z.number()), counts: z.array(z.number().nonnegative()) });
const frequencySchema = z.array(
  z.object({ value: z.union([z.string(), z.number(), z.boolean()]), count: z.number().nonnegative() })
);
const lengthSchema = z.array(z.object({ length: z.number().nonnegative(), count: z.number().nonnegative() }));

function histogramMarkup(value: unknown, title: string, date = false): string | undefined {
  const parsed = histogramSchema.safeParse(value);
  if (!parsed.success) return undefined;
  const { bin_edges: edges, counts } = parsed.data;
  if (!counts.length || edges.length !== counts.length + 1 || edges.some((edge, i) => i > 0 && edge <= edges[i - 1]))
    return undefined;
  const peak = counts.reduce((highest, count) => Math.max(highest, count), 0);
  const format = date ? dateLabel : chartNumber;
  const first = edges[0];
  const last = edges[edges.length - 1];
  const marks = counts.map((count, i) => {
    const span = normalized(edges[i + 1], first, last) - normalized(edges[i], first, last);
    return `<span style="--height:${peak ? (count / peak) * 100 : 0}%;--bin-width:${span * 100}%" title="${format(
      edges[i]
    )} to ${format(edges[i + 1])} · ${chartNumber(count)}"></span>`;
  });
  return `<figure class="report-chart histogram"><figcaption>${title}</figcaption>
    <div class="histogram-layout"><div class="histogram-scale" aria-hidden="true"><span>${chartNumber(
      peak
    )}</span><span>0</span></div>
    <div class="histogram-plot" role="img" aria-label="${title}, ${counts.length} bins, peak ${chartNumber(
    peak
  )}">${marks.join('')}</div></div>
    <div class="histogram-axis"><span>${format(first)}</span><span>${format(last)}</span></div>
    <details class="chart-data"><summary>Bin values</summary>${table(
      ['From', 'To', 'Bin value'],
      counts.map((count, i) => [
        date ? dateLabel(edges[i]) : String(edges[i]),
        date ? dateLabel(edges[i + 1]) : String(edges[i + 1]),
        String(count),
      ]),
      'histogram-values'
    )}</details></figure>`;
}

function frequencyMarkup(value: unknown, title: string, lengths = false): string | undefined {
  const parsed = lengths ? lengthSchema.safeParse(value) : frequencySchema.safeParse(value);
  if (!parsed.success || !parsed.data.length) return undefined;
  const ranked = parsed.data.map((entry) => ({
    value: String('length' in entry ? entry.length : entry.value),
    count: entry.count,
  }));
  if (!lengths) ranked.sort((left, right) => right.count - left.count);
  const shown = ranked.slice(0, 10);
  if (ranked.length > shown.length) {
    const rest = ranked.slice(shown.length);
    shown.push({
      value: `Other (${rest.length} ${lengths ? 'lengths' : 'values'})`,
      count: rest.reduce((sum, row) => sum + row.count, 0),
    });
  }
  const peak = shown.reduce((max, row) => Math.max(max, row.count), 1);
  return `<figure class="report-chart"><figcaption>${title}</figcaption><ul class="chart-bars">${shown
    .map(({ value, count }) => {
      const label = escape(value || '(Empty string)');
      return `<li><span>${label}</span><span class="chart-bar-track" aria-hidden="true"><span style="--share:${
        (count / peak) * 100
      }%"></span></span><span>${chartNumber(count)}</span></li>`;
    })
    .join('')}</ul><details class="chart-data"><summary>Frequency values</summary>${table(
    [lengths ? 'Length' : 'Value', 'Count'],
    ranked.map(({ value, count }) => [escape(value || '(Empty string)'), String(count)])
  )}</details></figure>`;
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
  if (!columns.length || !bands.length) return undefined;
  return `<figure class="report-chart"><figcaption>Missingness matrix</figcaption>
    <div class="missing-matrix-scroll">${table(
      ['Rows', ...columns],
      rows,
      'missing-bands'
    )}</div><div class="chart-note">${
    bands.length
  } row bands · darker cells indicate more present values</div></figure>`;
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
    const histogram = histogramMarkup(value, 'Distribution');
    if (histogram) return histogram;
    const { columns, matrix } = value;
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
      return table(
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
      );
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
const linePointSchema = z.object({ x: z.number().nullable(), y: z.number().nullable() });
const lineSeriesSchema = z.object({ date_index: z.boolean(), points: z.array(linePointSchema) });
const correlationPoint = z.object({ lag: z.number(), value: z.number().nullable() });
const lagSeriesSchema = z.object({ acf: z.array(correlationPoint), pacf: z.array(correlationPoint) });
const spectrumSchema = z.object({
  points: z.array(z.object({ frequency: z.number(), decibels: z.union([z.number(), z.string()]).nullable() })),
});
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

function lineMarkup(title: string, points: z.output<typeof linePointSchema>[], dateIndex = false): string {
  const finite = points.filter((point): point is z.output<typeof pointSchema> => point.x !== null && point.y !== null);
  if (!finite.length) return '';
  let xMin = Infinity,
    xMax = -Infinity,
    yMin = Infinity,
    yMax = -Infinity;
  for (const { x, y } of finite) {
    xMin = Math.min(xMin, x);
    xMax = Math.max(xMax, x);
    yMin = Math.min(yMin, y);
    yMax = Math.max(yMax, y);
  }
  const position = (x: number, y: number) =>
    `${(6 + normalized(x, xMin, xMax) * 588).toFixed(2)},${(154 - normalized(y, yMin, yMax) * 148).toFixed(2)}`;
  let start = true;
  const path = points
    .map(({ x, y }) => {
      if (x === null || y === null) {
        start = true;
        return '';
      }
      const command = start ? 'M' : 'L';
      start = false;
      return `${command}${position(x, y)}`;
    })
    .join(' ');
  const label = dateIndex ? dateLabel : chartNumber;
  const bounds = `x ${label(xMin)} – ${label(xMax)} · y ${chartNumber(yMin)} – ${chartNumber(yMax)}`;
  return `<figure class="line-figure"><figcaption>${title}</figcaption>
    <svg viewBox="0 0 600 160" role="img" aria-label="${title}, ${bounds}"><path d="${path}"/></svg>
    <div class="missing">${bounds}</div></figure>`;
}

function metricValueMarkup(
  name: string,
  value: JsonValue | undefined,
  logicalType?: Profile['models'][number]['columns'][number]['properties']['logicalType']
): string {
  if (name === 'histogram') {
    const chart = histogramMarkup(value, 'Distribution', logicalType === 'date');
    if (chart) return chart;
  }
  if (
    name === 'word_counts' ||
    name === 'length_histogram' ||
    name === 'top_values' ||
    (name === 'value_counts' && logicalType !== 'numeric' && logicalType !== 'date')
  ) {
    const title =
      name === 'word_counts' ? 'Word frequencies' : name === 'length_histogram' ? 'Text lengths' : 'Value frequencies';
    const chart = frequencyMarkup(value, title, name === 'length_histogram');
    if (chart) return chart;
  }
  if (name === 'scatter_pairs') {
    const charts = z.array(scatterSchema).safeParse(value);
    if (charts.success && charts.data.length)
      return `<div class="chart-grid">${charts.data.map(scatterMarkup).join('')}</div>`;
  }
  if (name === 'time_series') {
    const chart = lineSeriesSchema.safeParse(value);
    if (chart.success) return lineMarkup('Time series', chart.data.points, chart.data.date_index) + valueMarkup(value);
  }
  if (name === 'autocorrelation') {
    const chart = lagSeriesSchema.safeParse(value);
    if (chart.success)
      return (
        Object.entries(chart.data)
          .map(([label, points]) =>
            lineMarkup(
              label.toUpperCase(),
              points.map(({ lag, value }) => ({ x: lag, y: value }))
            )
          )
          .join('') + valueMarkup(value)
      );
  }
  if (name === 'frequency_spectrum') {
    const chart = spectrumSchema.safeParse(value);
    if (chart.success)
      return (
        lineMarkup(
          'Frequency spectrum',
          chart.data.points.map(({ frequency, decibels }) => ({
            x: frequency,
            y: typeof decibels === 'number' ? decibels : null,
          }))
        ) + valueMarkup(value)
      );
  }
  return valueMarkup(value);
}

function metricTable(metrics: Record<string, JsonValue>, charts = true): string {
  return table(
    ['Metric', 'Value'],
    Object.entries(metrics).map(([name, value]) => [
      escape(name),
      charts ? metricValueMarkup(name, value) : valueMarkup(value),
    ])
  );
}

function rowCount(model: Profile['models'][number]): JsonValue | undefined {
  const summary = model.metrics.table_summary;
  return model.metrics.row_count ?? (summary && record(summary) ? summary.row_count : undefined);
}

function missingBar(model: Profile['models'][number], referenceSemantics: boolean): string {
  const rows = rowCount(model);
  if (typeof rows !== 'number' || rows <= 0) return '';
  const values = model.columns.flatMap(({ name, metrics }) => {
    if (typeof metrics.null_count !== 'number') return [];
    const missing =
      metrics.null_count + (!referenceSemantics && typeof metrics.nan_count === 'number' ? metrics.nan_count : 0);
    const present = rows - missing;
    if (present < 0 || present > rows) return [];
    return [{ name, present, missing }];
  });
  if (!values.length) return '';
  values.sort((left, right) => right.missing - left.missing);
  return `<figure class="report-chart"><figcaption>Missing values by column</figcaption><ul class="chart-bars coverage-bars">${values
    .map(({ name, present, missing }) => {
      const detail = `${missing} missing · ${present} present`;
      return `<li><span>${escape(name)}</span><span class="chart-bar-track" title="${detail}"><span style="--share:${
        (missing / rows) * 100
      }%"></span></span><span>${percentageFormat.format(missing / rows)}</span></li>`;
    })
    .join('')}</ul><details class="chart-data"><summary>Column counts</summary>${table(
    ['Column', 'Present', 'Missing'],
    values.map(({ name, present, missing }) => [escape(name), String(present), String(missing)])
  )}</details></figure>`;
}

function overview(model: Profile['models'][number], alerts: number): string {
  const summary = model.metrics.table_summary;
  const duplicates = model.metrics.row_duplicates;
  const rows = rowCount(model);
  const missing = summary && record(summary) ? summary.null_cell_ratio : undefined;
  const duplicateRows = duplicates && record(duplicates) ? duplicates.excess_row_count : undefined;
  const stats = [
    ['Rows', typeof rows === 'number' ? integerFormat.format(rows) : undefined],
    ['Columns', integerFormat.format(model.columns.length)],
    ['Missing cells', typeof missing === 'number' ? percentageFormat.format(missing) : undefined],
    ['Extra duplicate rows', typeof duplicateRows === 'number' ? integerFormat.format(duplicateRows) : undefined],
    ['Quality alerts', integerFormat.format(alerts)],
  ];
  return `<dl class="report-overview">${stats
    .filter(([, value]) => value !== undefined)
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('')}</dl>`;
}

function columnMarkup(column: Profile['models'][number]['columns'][number], i: number, j: number): string {
  const { name, properties, metrics } = column;
  const { logicalType, profileType } = properties;
  const charts = [
    'histogram',
    'value_counts',
    'top_values',
    'length_histogram',
    'word_counts',
    'time_series',
    'autocorrelation',
    'frequency_spectrum',
  ];
  const included = charts.filter((metric) => {
    if (metrics[metric] == null) return false;
    if (metric === 'value_counts')
      return logicalType === 'boolean' || (logicalType === 'string' && profileType !== 'Text');
    if (metric === 'top_values') return !metrics.value_counts;
    return true;
  });
  const chartsMarkup = included.map((metric) => metricValueMarkup(metric, metrics[metric], logicalType)).join('');
  const stats = Object.fromEntries(Object.entries(metrics).filter(([metric]) => !included.includes(metric)));
  return `<details class="column" id="model-${i}-column-${j}"><summary>${escape(name)} <span>${escape(
    profileType ?? logicalType
  )}</span></summary>
    ${chartsMarkup ? `<div class="chart-grid">${chartsMarkup}</div>` : ''}${
    Object.keys(stats).length ? metricTable(stats, false) : ''
  }</details>`;
}

const darkTheme =
  'color-scheme:dark; --paper:#181a1c; --ink:#efefef; --muted:#b1b4b8; --line:#3a3e43; --accent:#92b7f1; --alert:#f2a48e; --head:#2a2e33; --hover:#24272b; --chart:#202225;';
const css = `
  :root { color-scheme:light; --paper:#fff; --ink:#202020; --muted:#62666a; --line:#e8e8e8; --accent:#2c5792; --alert:#a4442d; --head:#f1f3f5; --hover:#f7f8f9; --chart:#fafafa; --mono:'SFMono-Regular',Consolas,monospace; }
  :root[data-theme=dark] { ${darkTheme} }
  @media (prefers-color-scheme:dark) { :root[data-theme=auto] { ${darkTheme} } }
  * { box-sizing:border-box; }
  html { scroll-padding-top:1rem; }
  body { margin:0; background:var(--paper); color:var(--ink); font:14px/1.65 "Instrument Sans","Avenir Next","PingFang SC",sans-serif; }
  body.transparent { background:transparent; }
  header, main { max-width:70rem; margin:auto; padding:1.75rem clamp(1rem,4vw,2.5rem); }
  .full-width header, .full-width main { max-width:none; }
  header { padding-bottom:.25rem; }
  h1,h2,h3 { font-weight:600; letter-spacing:-.02em; overflow-wrap:anywhere; }
  h1 { font-size:clamp(1.65rem,3vw,2rem); line-height:1.35; margin:0; }
  h2 { font-size:1.2rem; margin:0 0 .55rem; }
  h3 { margin:0 0 .65rem; font-size:1rem; }
  nav { display:flex; flex-wrap:wrap; gap:.4rem 1rem; }
  a, summary { color:inherit; }
  a { text-decoration-thickness:1px; text-underline-offset:3px; }
  a:focus-visible, summary:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
  section + section { margin-top:2rem; padding-top:1.5rem; border-top:1px solid var(--line); }
  .table-scroll { max-width:100%; overflow:auto; }
  table { border-collapse:collapse; width:100%; font-size:.79rem; font-variant-numeric:tabular-nums; }
  th, td { border-bottom:1px solid var(--line); padding:.46rem .7rem; text-align:left; vertical-align:top; overflow-wrap:anywhere; }
  th { font-weight:500; }
  thead { background:var(--head); }
  tbody tr:hover { background:var(--hover); }
  details { max-width:100%; }
  summary { cursor:pointer; }
  .column { border-top:1px solid var(--line); padding:.75rem 0; }
  .column > summary { font-size:.92rem; font-weight:600; }
  .column > summary span { color:var(--muted); font: .72rem var(--mono); margin-left:.45rem; }
  .missing { color:var(--muted); }
  .column > div { margin:.65rem 0 0; }
  .column:target { border-top-color:var(--accent); }
  .column-links, .report-index { margin:0 0 .9rem; font-size:.78rem; color:var(--muted); }
  .report-index { padding:.25rem 0 .8rem; border-bottom:1px solid var(--line); }
  .alert th { color:var(--alert); }
  .report-overview { display:grid; grid-template-columns:repeat(auto-fit,minmax(8rem,1fr)); gap:.65rem 0; padding:.95rem .25rem; margin:.4rem 0 .9rem; background:var(--chart); border-radius:1.1rem; }
  .report-overview div { padding:0 .95rem; border-inline-end:1px solid var(--line); }
  .report-overview div:last-child { border:0; }
  .report-overview dt { color:var(--muted); font-size:.72rem; }
  .report-overview dd { margin:.15rem 0 0; font-size:1.9rem; line-height:1.15; font-weight:500; font-variant-numeric:tabular-nums; letter-spacing:-.035em; }
  .report-section { margin:0; padding:1.25rem 0; border-bottom:1px solid var(--line); }
  .chart-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr)); gap:1rem; align-items:start; }
  .chart-grid > * { min-width:0; }
  .report-chart, .chart-grid > .scatter, .chart-grid > .line-figure { margin:0; border:1px solid var(--line); border-radius:1rem; background:var(--paper); padding:clamp(.65rem,2vw,1rem); max-width:none; }
  figcaption { font-weight:600; margin-bottom:.55rem; overflow-wrap:anywhere; }
  .chart-data, .chart-note { font-size:.8rem; color:var(--muted); margin-top:.6rem; }
  .chart-data .table-scroll { max-height:16rem; }
  .chart-data thead, .missing-matrix-scroll thead { position:sticky; top:0; }
  .chart-bars { list-style:none; margin:0; padding:0; }
  .chart-bars li { display:grid; grid-template-columns:minmax(4.4rem,30%) 1fr max-content; gap:.55rem; align-items:center; min-height:1.75rem; font-size:.82rem; overflow-wrap:anywhere; font-variant-numeric:tabular-nums; }
  .chart-bar-track { background:var(--head); height:.58rem; border-radius:2px; overflow:hidden; }
  .chart-bar-track > span { display:block; height:100%; width:var(--share); background:var(--accent); }
  .coverage-bars .chart-bar-track > span { background:var(--alert); }
  .histogram-layout { display:grid; grid-template-columns:minmax(2.5rem,max-content) 1fr; gap:.45rem; }
  .histogram-scale { display:flex; justify-content:space-between; flex-direction:column; align-items:end; }
  .histogram-scale, .histogram-axis { color:var(--muted); font-size:.76rem; font-variant-numeric:tabular-nums; }
  .histogram-axis { display:flex; justify-content:space-between; gap:1rem; padding-left:2.95rem; overflow-wrap:anywhere; }
  .histogram-axis span:last-child { text-align:right; }
  .histogram-plot { min-width:0; display:flex; align-items:end; height:clamp(6rem,18vw,10rem); border:solid var(--line); border-width:0 0 1px 1px; background:repeating-linear-gradient(to top,transparent 0 calc(25% - 1px),var(--line) calc(25% - 1px) 25%); }
  .histogram-plot > span { height:var(--height); width:var(--bin-width); background:var(--accent); box-shadow:inset -1px 0 var(--paper); }
  .histogram-plot > span:hover { background:var(--alert); }
  .histogram-values { font-family:var(--mono); font-size:.68rem; }
  .coefficient { --tint:var(--accent); background:color-mix(in srgb, var(--tint) calc(var(--strength)*100%), transparent); display:block; min-width:3.5rem; padding:.15rem .3rem; text-align:right; }
  .coefficient.negative { --tint:var(--alert); }
  .missing-bands tbody th, .missing-bands tbody td { padding:0; border:0; line-height:0; }
  .missing-matrix-scroll { max-height:19rem; overflow:auto; }
  .missing-matrix-scroll th { min-width:2.5rem; font-size:.72rem; padding:.42rem .38rem; }
  .missing-bands thead th { white-space:nowrap; }
  .band-cell { display:block; height:3px; background:color-mix(in srgb, var(--accent) calc(var(--coverage)*100%), transparent); border-right:1px solid var(--paper); }
  .visually-hidden { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
  .scatter { margin:1rem 0; min-width:12rem; max-width:35rem; }
  .scatter-chart { position:relative; aspect-ratio:3/2; background:var(--chart); overflow:hidden; border:1px solid var(--line); }
  .scatter-chart span { position:absolute; transform:translate(-50%,50%); background:var(--accent); }
  .scatter-chart .point { width:.4rem; height:.4rem; border-radius:50%; opacity:.7; }
  .scatter-chart .hexagon { clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); }
  .scatter-bounds { display:flex; flex-wrap:wrap; justify-content:space-between; gap:.2rem .8rem; color:var(--muted); }
  .line-figure { margin:1rem 0; max-width:42rem; }
  .line-figure svg { display:block; width:100%; min-width:12rem; border:1px solid var(--line); background:var(--chart); }
  .line-figure path { fill:none; stroke:var(--accent); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
  @media (max-width:40rem) { header { padding-top:1.3rem; } main { padding-top:1rem; } th,td { padding:.4rem; } }
  @media print { body { background:var(--paper); } header, main { padding:1rem 0; } nav { display:none; } }
`;

export const profileReportOptions = z.object({
  title: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  transparent: z.boolean().optional(),
  fullWidth: z.boolean().optional(),
});
type ProfileReportOptions = z.input<typeof profileReportOptions>;

function documentHtml(title: string, modelNames: string[], models: string, options: ProfileReportOptions): string {
  const navigation = modelNames.map((name, i) => `<a href="#model-${i}">${escape(name)}</a>`).join('');
  const { theme = 'light', transparent, fullWidth } = profileReportOptions.parse(options);
  const classes = [transparent && 'transparent', fullWidth && 'full-width'].filter(Boolean).join(' ');
  return `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escape(title)}</title><style>${css}</style></head><body class="${classes}"><header><h1>${escape(
    title
  )}</h1>
    ${
      modelNames.length > 1 ? `<nav aria-label="Models">${navigation}</nav>` : ''
    }</header><main>${models}</main></body></html>`;
}

/** Render a standalone report from saved observations. */
export function renderProfileHtml(input: unknown, options: ProfileReportOptions = {}): string {
  const profile = profileOutputSchema.parse(input);
  const quality = assessQuality(profile, {});
  const models = profile.models
    .map((model, i) => {
      const { name, metrics, columns } = model;
      const alerts = quality.models[i].alerts;
      const alertTable = alerts.length
        ? `<div class="report-section alert" id="model-${i}-alerts"><h3>Quality alerts</h3>${table(
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
      const variables = columns.map((column, j) => columnMarkup(column, i, j)).join('');
      const columnLinks = columns
        .map(({ name }, j) => `<a href="#model-${i}-column-${j}">${escape(name)}</a>`)
        .join('');
      const missingMatrix = metrics.missing_bands;
      const matrix = missingMatrix && record(missingMatrix) ? missingBandMarkup(missingMatrix) : undefined;
      const missing = missingBar(model, profile.semantics === 'data-profiling') + (matrix ?? '');
      const methods = ['pearson', 'spearman', 'kendall', 'cramers', 'auto', 'phi_k', 'missing_correlation'];
      const correlations = new Map(
        methods.flatMap((method) => {
          const value = metrics[method];
          if (!value || !record(value) || !Array.isArray(value.columns) || !value.columns.length) return [];
          const label =
            method === 'missing_correlation'
              ? 'Missingness correlation'
              : method === 'phi_k'
              ? 'Phi-k'
              : method[0].toUpperCase() + method.slice(1);
          return [
            [method, `<figure class="report-chart"><figcaption>${label}</figcaption>${valueMarkup(value)}</figure>`],
          ] as const;
        })
      );
      const scatter = z.array(scatterSchema).safeParse(metrics.scatter_pairs);
      const scatterPairs = scatter.success ? scatter.data : [];
      const stats = Object.fromEntries(
        Object.entries(metrics).filter(([metric]) => {
          if (metric === 'scatter_pairs') return !scatterPairs.length;
          if (metric === 'missing_bands') return !matrix;
          return !correlations.has(metric);
        })
      );
      const sections = [
        [missing, 'missing', 'Missing values'],
        [alertTable, 'alerts', 'Quality alerts'],
        [correlations.size, 'correlations', 'Correlations'],
        [scatterPairs.length, 'interactions', 'Interactions'],
        [variables, 'columns', 'Columns'],
        [Object.keys(stats).length, 'details', 'Table metrics and samples'],
      ];
      const sectionLinks = sections
        .filter(([content]) => content)
        .map(([, id, label]) => `<a href="#model-${i}-${id}">${label}</a>`)
        .join('');
      return `<section id="model-${i}"><h2>${escape(name)}</h2>${overview(model, alerts.length)}
      ${sectionLinks ? `<nav class="report-index" aria-label="Report sections">${sectionLinks}</nav>` : ''}
      ${
        missing
          ? `<div class="report-section" id="model-${i}-missing"><h3>Missing values</h3><div class="chart-grid">${missing}</div></div>`
          : ''
      }
      ${alertTable}
      ${
        correlations.size
          ? `<div class="report-section" id="model-${i}-correlations"><h3>Correlations</h3><div class="chart-grid">${[
              ...correlations.values(),
            ].join('')}</div></div>`
          : ''
      }
      ${
        scatterPairs.length
          ? `<div class="report-section" id="model-${i}-interactions"><h3>Interactions</h3><div class="chart-grid">${scatterPairs
              .map(scatterMarkup)
              .join('')}</div></div>`
          : ''
      }
      ${
        variables
          ? `<div class="report-section" id="model-${i}-columns"><h3>Columns</h3><nav class="column-links" aria-label="Jump to a column">${columnLinks}</nav>${variables}</div>`
          : ''
      }${
        Object.keys(stats).length
          ? `<details class="report-section" id="model-${i}-details"><summary>Table metrics and samples</summary>${metricTable(
              stats
            )}</details>`
          : ''
      }</section>`;
    })
    .join('');
  return documentHtml(
    options.title ?? 'Data profile',
    profile.models.map(({ name }) => name),
    models,
    options
  );
}

export function renderProfileComparisonHtml(
  before: unknown,
  after: unknown,
  options: ProfileReportOptions = {}
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
    options.title ?? 'Profile comparison',
    comparison.models.map(({ name }) => name),
    models,
    options
  );
}

export function renderProfileValidationHtml(
  input: unknown,
  suites: unknown,
  options: ProfileReportOptions = {}
): string {
  const validation = validateProfileExpectations(input, suites);
  const models = validation.results.map(({ model, expectation_suite_name: suite, expectations }, i) => {
    const rows = expectations.map(({ column, expectation_type: rule, status }) => [
      escape(column),
      escape(rule),
      escape(status.replace(/_/g, ' ')),
    ]);
    const passed = expectations.filter(({ status }) => status === 'passed').length;
    return `<section id="model-${i}"><h2>${escape(model)}</h2><p>${escape(suite)} · ${passed} of ${
      rows.length
    } passed</p>
      ${table(['Column', 'Expectation', 'Status'], rows)}</section>`;
  });
  return documentHtml(
    options.title ?? 'Profile validation',
    validation.results.map(({ model }) => model),
    models.join(''),
    options
  );
}
