const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

const entry = resolve(__dirname, '../../lib/cli/index.js');
const output = resolve(process.argv[2] ?? 'orders-profile.html');
const directory = mkdtempSync(join(tmpdir(), 'ava-profile-demo-'));
const source = join(directory, 'orders.json');
const options = join(directory, 'options.json');
const observations = join(directory, 'profile.json');
const cli = (...args) => execFileSync(process.execPath, [entry, ...args], { encoding: 'utf8' });

let datasetId;
try {
  const rows = Array.from({ length: 72 }, (_, i) => {
    const units = 1 + ((i * 7) % 23);
    const day = i + (i >= 40 ? 7 : 0);
    return {
      ordered_at: new Date(Date.UTC(2026, 0, 1 + day)).toISOString(),
      region: ['North', 'South', 'West'][i % 3],
      channel: i % 9 === 0 ? null : i % 4 ? 'Web' : 'App',
      units,
      revenue: i % 11 === 0 ? null : units * 12 + (i % 7),
      delivered: i % 9 !== 0,
      note: i % 9 === 0 ? null : ['Online order', 'Gift wrap 🎁', '优先配送', 'Scheduled pickup'][i % 4],
    };
  });
  rows.push(rows[1], rows[9], rows[9], rows[25]);
  writeFileSync(source, JSON.stringify(rows));
  writeFileSync(
    options,
    JSON.stringify({
      semantics: 'data-profiling',
      typeSchema: { data: { ordered_at: 'DateTime', units: 'Numeric', revenue: 'TimeSeries', note: 'Text' } },
      metrics: [
        'row_count',
        'table_summary',
        'memory_size',
        'null_count',
        'null_ratio',
        'distinct_count',
        'value_counts',
        'imbalance',
        'min',
        'max',
        'mean',
        'median',
        'stddev',
        'histogram',
        'quantiles',
        'word_counts',
        'length_histogram',
        'pearson',
        'missing_bands',
        'missing_correlation',
        { id: 'row_duplicates', limit: 3 },
        { id: 'row_sample', head: 3, tail: 3, random: 3, seed: 7 },
        { id: 'scatter_pairs', columns: ['units', 'revenue'], targets: ['units'], threshold: 70 },
        { id: 'time_index', orderBy: 'ordered_at' },
        { id: 'time_series', orderBy: 'ordered_at' },
        { id: 'time_series_gaps', orderBy: 'ordered_at' },
        { id: 'autocorrelation', orderBy: 'ordered_at', lags: 8 },
      ],
    })
  );
  ({ datasetId } = JSON.parse(cli('source', source, '--engine', 'duckdb')));
  writeFileSync(observations, cli('profile', datasetId, '--options', options));
  process.stdout.write(cli('profile-report', observations, '--title', 'Orders profile · synthetic data', '-o', output));
} finally {
  try {
    if (datasetId) cli('dispose', datasetId);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
