const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtemp, rm, stat } = require('node:fs/promises');
const { arch, cpus, release, tmpdir, totalmem } = require('node:os');
const { join, resolve } = require('node:path');
const { parseArgs } = require('node:util');
const { DuckDBInstance } = require('@duckdb/node-api');

const { DEFAULT_METRICS, profileTables } = require('../../lib/duckdb/profile');
const { getDuckDBSchema } = require('../../lib/duckdb/util/schema');
const { sqlStringLiteral } = require('../../lib/util/sql');

const root = resolve(__dirname, '../..');
const { values } = parseArgs({
  options: {
    rows: { type: 'string', default: '1000,10000,100000,1000000,10000000' },
    runs: { type: 'string', default: '7' },
    threads: { type: 'string', default: '1' },
    memory: { type: 'string', default: '512MB' },
    baseline: { type: 'string' },
  },
});
const rowCounts = values.rows.split(',').map(Number);
const runs = Number(values.runs);
const threads = Number(values.threads);
assert([...rowCounts, runs, threads].every((n) => Number.isSafeInteger(n) && n > 0));

const workloads = {
  default: DEFAULT_METRICS,
  completeness: [
    'table_summary',
    'valid_count',
    'null_count',
    'null_ratio',
    'distinct_count',
    'unique_count',
    'zero_count',
    'finite_count',
  ],
  distribution: ['min', 'max', 'mean', 'stddev', 'quantiles', 'histogram', 'skewness', 'kurtosis', 'chi_squared'],
};

function revision(directory) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: directory, encoding: 'utf8' }).trim();
}

async function withDuckDB(operation) {
  const db = await DuckDBInstance.create(':memory:', { threads: String(threads), memory_limit: values.memory });
  const connection = await db.connect();
  try {
    return await operation(connection);
  } finally {
    connection.closeSync();
    db.closeSync();
  }
}

function scanTotals(plan) {
  const scans = [];
  function collect(node) {
    if (node.operator_type === 'TABLE_SCAN') scans.push(node);
    for (const child of node.children ?? []) collect(child);
  }
  collect(plan);
  return {
    scan_operators: scans.length,
    scan_rows: scans.reduce((sum, node) => sum + node.operator_rows_scanned, 0),
    scan_operator_ms_sum: scans.reduce((sum, node) => sum + node.operator_timing * 1000, 0),
    duckdb_query_ms: plan.latency * 1000,
    peak_buffer_bytes: plan.system_peak_buffer_memory,
    peak_spill_bytes: plan.system_peak_temp_dir_size,
  };
}

async function measure(profile, path, metricIds) {
  return withDuckDB(async (connection) => {
    await connection.run(`CREATE VIEW observations AS SELECT * FROM read_parquet(${sqlStringLiteral(path)})`);
    const schema = await getDuckDBSchema(connection);
    const options = { metrics: metricIds.map((id) => ({ id })) };
    const query = connection.runAndReadAll.bind(connection);
    const queries = new Set();
    connection.runAndReadAll = (sql, ...params) => {
      queries.add(sql);
      return query(sql, ...params);
    };
    let result = await profile(connection, schema, options);
    await profile(connection, schema, options);
    const timings = [];
    for (let i = 0; i < runs; i += 1) {
      const start = performance.now();
      result = await profile(connection, schema, options);
      timings.push(performance.now() - start);
    }
    const plans = [];
    for (const sql of queries) {
      const explanation = await query(`EXPLAIN (ANALYZE, FORMAT JSON) ${sql}`);
      plans.push(scanTotals(JSON.parse(explanation.getRowObjectsJson()[0].explain_value)));
    }
    const sorted = [...timings].sort((a, b) => a - b);
    const median = (sorted[Math.floor((runs - 1) / 2)] + sorted[Math.floor(runs / 2)]) / 2;
    return { result, profile_ms: timings, median_ms: median, plans };
  });
}

async function main() {
  const baselineDirectory = values.baseline && resolve(values.baseline);
  const baseline = baselineDirectory && require(join(baselineDirectory, 'lib/duckdb/profile.js'));
  const directory = await mkdtemp(join(tmpdir(), 'ava-profile-bench-'));
  const results = [];
  try {
    for (const rows of rowCounts) {
      const path = join(directory, `${rows}.parquet`);
      await withDuckDB((connection) =>
        connection.run(`COPY (
        SELECT i AS id, CASE WHEN i % 13 <> 0 THEN (i % 4001 - 2000) * 0.125 END AS amount,
          (i * 31 % 1021)::DOUBLE AS units, i % 163 AS batch, i % 100003 AS key,
          (i % 31)::VARCHAR AS region, (i % 11)::VARCHAR AS channel,
          CASE WHEN i % 7 <> 0 THEN (i % 53)::VARCHAR END AS product,
          'code_' || (i % 200003)::VARCHAR AS code, i % 2 = 0 AS flag,
          DATE '2020-01-01' + (i % 366)::INTEGER AS day,
          TIMESTAMP '2020-01-01' + (i % 86400) * INTERVAL '1 second' AS event_at
        FROM range(${rows}) AS t(i)
      ) TO ${sqlStringLiteral(path)} (FORMAT PARQUET, ROW_GROUP_SIZE 122880)`)
      );
      const input = { rows, columns: 12, parquet_bytes: (await stat(path)).size };
      for (const [workload, metrics] of Object.entries(workloads)) {
        const entry = { ...input, workload, metrics };
        try {
          const { result, ...measurement } = await measure(profileTables, path, metrics);
          Object.assign(entry, measurement);
          if (baseline && workload === 'default') {
            const { result: expected, ...baselineMeasurement } = await measure(baseline.profileTables, path, metrics);
            entry.baseline = baselineMeasurement;
            entry.baseline_same_output = require('node:util').isDeepStrictEqual(result, expected);
          }
        } catch (error) {
          entry.error = error.message;
        }
        results.push(entry);
      }
    }
  } finally {
    await rm(directory, { recursive: true });
  }
  const duckdb = await withDuckDB(
    async (connection) => (await connection.runAndReadAll('SELECT version() AS version')).getRowObjectsJson()[0].version
  );
  console.log(
    JSON.stringify(
      {
        revision: revision(root),
        baseline_revision: baselineDirectory && revision(baselineDirectory),
        node: process.version,
        duckdb,
        os: release(),
        arch: arch(),
        cpu: cpus()[0].model,
        ram_bytes: totalmem(),
        threads,
        memory_limit: values.memory,
        runs,
        warmups: 2,
        results,
      },
      null,
      2
    )
  );
  process.exitCode = results.some(({ error, baseline_same_output }) => error || baseline_same_output === false) ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
