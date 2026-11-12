#!/usr/bin/env node
// Report assembly; upstream attribution and MIT terms are in ../assets/LICENSE.
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, open, readFile, readdir, rm } from 'node:fs/promises';
import { basename, delimiter, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const readJSON = async (path) => JSON.parse(await readFile(path, 'utf8'));
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const queryIdPattern = /^q_[a-f0-9]{64}$/;

function validateResult(result) {
  check(object(result) && Array.isArray(result.schema) && Array.isArray(result.data), 'Invalid AVA query result.');
  check(
    result.schema.every((column) => object(column) && text(column.name)),
    'Invalid result schema.'
  );
  check(result.data.every(object), 'Report queries must return rows as objects.');
  check(result.truncated === undefined || result.truncated === true, 'Invalid truncation flag.');
}

function validateEvidence(record) {
  check(object(record), 'Invalid query evidence.');
  const { queryId, ...body } = record;
  check(queryIdPattern.test(queryId) && queryId === `q_${digest(body)}`, 'Query evidence was changed or is invalid.');
  check(
    text(body.datasetId) && text(body.source) && text(body.sql) && text(body.executedAt),
    'Incomplete query evidence.'
  );
  validateResult(body.result);
  return record;
}

async function writeNew(path, value) {
  const file = await open(path, 'wx', 0o600);
  try {
    await file.writeFile(value);
  } finally {
    await file.close();
  }
}

async function windowsAvaEntry() {
  for (const item of (process.env.PATH ?? '').split(delimiter)) {
    if (!item) continue;
    const directory = resolve(item.replace(/^"|"$/g, ''));
    // npm places local shims in node_modules/.bin and global shims in the npm prefix.
    const modules = basename(directory).toLowerCase() === '.bin' ? dirname(directory) : join(directory, 'node_modules');
    const entry = join(modules, '@antv', 'ava', 'lib', 'cli', 'index.js');
    try {
      await access(join(directory, 'ava.cmd'));
      await access(entry);
      return entry;
    } catch {
      // Continue looking for the scoped AVA package.
    }
  }
  throw new Error('Could not find the @antv/ava npm CLI on PATH. Install it with npm install -g @antv/ava.');
}

// Keep argv and stdin separate even on Windows, where npm's launcher is a .cmd file.
export async function runAVA(args, input) {
  const windows = process.platform === 'win32';
  const argv = windows ? [await windowsAvaEntry(), ...args] : args;
  return new Promise((resolveResult, reject) => {
    const child = spawn(windows ? process.execPath : 'ava', argv, { stdio: ['pipe', 'pipe', 'pipe'] });
    const output = [];
    const errors = [];
    child.stdout.on('data', (chunk) => output.push(chunk));
    child.stderr.on('data', (chunk) => errors.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(errors).toString('utf8').trim() || `AVA exited with code ${code}.`));
        return;
      }
      try {
        resolveResult(JSON.parse(Buffer.concat(output).toString('utf8')));
      } catch {
        reject(new Error('AVA returned invalid JSON; the operation outcome is uncertain. Do not retry automatically.'));
      }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(input ?? '');
  });
}

export async function recordQuery({ evidence, datasetId, dsl, source, maxRows, maxResultBytes }, invoke = runAVA) {
  check(
    text(evidence) && text(datasetId) && text(dsl) && text(source),
    'query requires --evidence, datasetId, --dsl and --source.'
  );
  check(extname(dsl) === '.sql', 'Save the SQL query as a .sql file.');
  const sql = await readFile(dsl, 'utf8');
  check(sql.trim() && Buffer.byteLength(sql) <= 512 * 1024, 'DSL must be nonempty and at most 512 KiB.');
  const args = ['query', datasetId, '--dsl', '-'];
  for (const [flag, value, limit] of [
    ['--max-rows', maxRows, 10000],
    ['--max-result-bytes', maxResultBytes, Infinity],
  ]) {
    if (value !== undefined) {
      check(Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= limit, `Invalid ${flag}.`);
      args.push(flag, String(value));
    }
  }
  const directory = resolve(evidence);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const result = await invoke(args, sql);
  validateResult(result);
  const body = { datasetId, source, language: 'sql', sql, executedAt: new Date().toISOString(), result };
  const queryId = `q_${digest(body)}`;
  const evidenceOutput = join(directory, `${queryId}.json`);
  await writeNew(evidenceOutput, JSON.stringify({ queryId, ...body }, null, 2));
  return { ...result, queryId, evidenceOutput };
}

// Immutable files form the durable index; concurrent queries cannot overwrite each other.
export async function queryIndex(evidence) {
  const directory = resolve(evidence);
  const files = (await readdir(directory)).filter((name) => /^q_[a-f0-9]{64}\.json$/.test(name)).sort();
  const queries = [];
  for (const name of files) {
    const query = validateEvidence(await readJSON(join(directory, name)));
    check(name === `${query.queryId}.json`, 'Evidence filename does not match its queryId.');
    queries.push(query);
  }
  return queries;
}

const label = (value) => typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
const numeric = (value) => typeof value === 'number' && Number.isFinite(value);
const rowFields = {
  column: ['category', 'value'],
  bar: ['category', 'value'],
  line: ['time', 'value'],
  area: ['time', 'value'],
  pie: ['category', 'value'],
  scatter: ['x', 'y'],
  boxplot: ['category', 'value'],
  violin: ['category', 'value'],
  radar: ['name', 'value'],
  funnel: ['category', 'value'],
  waterfall: ['category'],
  'word-cloud': ['text', 'value'],
  venn: ['sets', 'value'],
  sankey: ['source', 'target', 'value'],
};

function validateChart(chart) {
  const { chartType: type, config } = chart;
  check(object(config), 'Chart config must be an object.');
  if (type === 'liquid') {
    check(
      numeric(config.percent) && config.percent >= 0 && config.percent <= 1,
      'liquid requires percent between 0 and 1.'
    );
  } else if (type === 'dual-axes') {
    check(
      Array.isArray(config.categories) && config.categories.length && config.categories.every(label),
      'Invalid dual-axes categories.'
    );
    check(Array.isArray(config.series) && config.series.length, 'dual-axes requires series.');
    check(
      config.series.every(
        (series) =>
          ['column', 'line'].includes(series.type) &&
          Array.isArray(series.data) &&
          series.data.length === config.categories.length &&
          series.data.every(numeric)
      ),
      'dual-axes series must align with categories.'
    );
  } else {
    check(
      type in rowFields || ['histogram', 'treemap', 'table'].includes(type),
      `Unsupported report chartType: ${type}`
    );
    check(Array.isArray(config.data) && config.data.length, 'Chart data must be nonempty.');
    if (type === 'histogram') check(config.data.every(numeric), 'histogram requires numeric observations.');
    else if (type === 'treemap') {
      const node = (item) =>
        object(item) &&
        label(item.name) &&
        (item.value === undefined || (numeric(item.value) && item.value >= 0)) &&
        (item.children === undefined || (Array.isArray(item.children) && item.children.every(node)));
      check(config.data.every(node), 'Invalid treemap nodes.');
    } else {
      check(config.data.every(object), 'Chart data must contain objects.');
      for (const row of config.data) {
        for (const key of rowFields[type] ?? []) {
          check(
            key === 'sets'
              ? Array.isArray(row[key]) && row[key].length && row[key].every(text)
              : ['value', 'x', 'y'].includes(key)
              ? numeric(row[key])
              : label(row[key]),
            `Invalid ${type} field: ${key}.`
          );
        }
        if (type === 'waterfall')
          check(row.isTotal === true || numeric(row.value), 'waterfall requires numeric changes.');
        if (['pie', 'venn', 'sankey'].includes(type)) check(row.value >= 0, `${type} values must be nonnegative.`);
        if (row.group !== undefined) check(label(row.group), 'Invalid chart group.');
      }
    }
  }
  return chart;
}

function bindChart(section, query) {
  const { chart, chartFields, chartConfigField } = section;
  check(chart || (chartFields === undefined && chartConfigField === undefined), 'Chart bindings require chart.');
  if (!chart) return;
  check(text(chart.chartType) && object(chart.config), 'Chart requires chartType and config.');
  check(
    !['data', 'categories', 'series', 'percent'].some((key) => Object.hasOwn(chart.config, key)),
    'Chart data must come from query evidence.'
  );
  check(chartFields === undefined || chartConfigField === undefined, 'Use chartFields or chartConfigField, not both.');
  const columns = new Set(query.result.schema.map((column) => column.name));
  if (chartFields !== undefined)
    check(object(chartFields) && Object.keys(chartFields).length, 'chartFields must be a nonempty mapping.');
  for (const name of chartFields !== undefined
    ? Object.values(chartFields)
    : chartConfigField !== undefined
    ? [chartConfigField]
    : []) {
    check(text(name) && columns.has(name), `Unknown query column: ${name}. Available: ${[...columns].join(', ')}.`);
  }
  if (!query.result.data.length) return;
  let bound = { data: query.result.data };
  if (chartFields !== undefined) {
    bound = {
      data: query.result.data.map((row) =>
        Object.fromEntries(Object.entries(chartFields).map(([native, name]) => [native, row[name]]))
      ),
    };
  }
  if (chartConfigField !== undefined) {
    check(
      query.result.data.length === 1 && object(query.result.data[0][chartConfigField]),
      'chartConfigField requires one row containing a config object.'
    );
    bound = query.result.data[0][chartConfigField];
  }
  return validateChart({ chartType: chart.chartType, config: { ...chart.config, ...bound } });
}

function prepareReport(spec, previous, available) {
  check(object(spec), 'Report spec must be an object.');
  const sections = new Map((previous?.sections ?? []).map((section) => [section.id, section]));
  check(spec.sections === undefined || Array.isArray(spec.sections), 'sections must be an array.');
  const seen = new Set();
  for (const section of spec.sections ?? []) {
    check(
      object(section) && text(section.id) && /^[a-z0-9][a-z0-9_-]{0,79}$/.test(section.id),
      'Each section needs a stable lowercase id.'
    );
    check(!seen.has(section.id), `Duplicate section id: ${section.id}.`);
    seen.add(section.id);
    sections.set(section.id, section);
  }
  const report = {
    metrics: [],
    definitions: [],
    limitations: [],
    ...previous,
    ...spec,
    sections: [...sections.values()],
  };
  check(
    text(report.title) && text(report.summary) && report.sections.length,
    'Report requires title, summary and at least one section.'
  );
  for (const key of ['definitions', 'limitations'])
    check(Array.isArray(report[key]) && report[key].every(text), `${key} must contain strings.`);
  check(Array.isArray(report.metrics), 'metrics must be an array.');
  const queries = new Map();
  const get = (id) => {
    check(queryIdPattern.test(id) && available.has(id), `Unknown queryId: ${id}. Use the saved evidence index.`);
    const query = available.get(id);
    queries.set(id, query);
    return query;
  };
  for (const metric of report.metrics) {
    const query = get(metric.queryId);
    check(text(metric.label) && text(metric.field), 'Metrics require label and field.');
    check(!query.result.truncated, 'Metrics cannot use truncated results.');
    metric.rowIndex ??= 0;
    check(Number.isSafeInteger(metric.rowIndex) && metric.rowIndex >= 0, 'Invalid metric rowIndex.');
    check(
      query.result.schema.some((column) => column.name === metric.field),
      `Unknown metric field: ${metric.field}.`
    );
    const value = query.result.data[metric.rowIndex]?.[metric.field];
    check(
      numeric(value) || (text(value) && Number.isFinite(Number(value))),
      `Metric ${metric.label} must reference a finite number.`
    );
  }
  const plans = [];
  const chartErrors = [];
  for (const [index, section] of report.sections.entries()) {
    check(text(section.question) && text(section.conclusion), 'Sections require question and conclusion.');
    const query = get(section.queryId);
    const chart = bindChart(section, query);
    if (!section.chart) continue;
    if (query.result.truncated || !chart) {
      chartErrors.push({
        section: index + 1,
        message: query.result.truncated
          ? '查询结果已截断，暂不绘图；请获取完整聚合结果。'
          : '查询没有返回数据，暂不绘图。',
      });
    } else plans.push({ section: index + 1, spec: chart });
  }
  return { report, queries: [...queries.values()], plans, chartErrors };
}

export async function renderReport({ evidence, spec, output, previous, template }, invoke = runAVA) {
  check(
    text(spec) && text(output) && extname(output).toLowerCase() === '.html',
    'render requires --spec and a new --output .html path.'
  );
  const prior = previous ? await readJSON(previous) : undefined;
  check(!prior || (Array.isArray(prior.queries) && Array.isArray(prior.sections)), 'Invalid previous report JSON.');
  const available = new Map();
  for (const query of [...(prior?.queries ?? []), ...(evidence ? await queryIndex(evidence) : [])]) {
    available.set(query.queryId, validateEvidence(query));
  }
  const { report, queries, plans, chartErrors } = prepareReport(await readJSON(spec), prior, available);
  const templatePath = template === undefined ? new URL('../assets/report.html', import.meta.url) : resolve(template);
  const logo = await readFile(new URL('../assets/icon.svg', import.meta.url));
  const reportTemplate = (await readFile(templatePath, 'utf8')).replace(
    'src="icon.svg"',
    () => `src="data:image/svg+xml;base64,${logo.toString('base64')}"`
  );
  check(
    reportTemplate.split('<!-- ARTIFACT_DATA -->').length === 2,
    'Report template must contain exactly one ARTIFACT_DATA slot.'
  );
  const destination = resolve(output);
  const dataOutput = destination.slice(0, -extname(destination).length) + '.json';
  // Reserve both outputs before rendering; collisions never replace existing artifacts.
  const htmlFile = await open(destination, 'wx', 0o600);
  let dataFile;
  try {
    dataFile = await open(dataOutput, 'wx', 0o600);
    const charts = [];
    for (const plan of plans) {
      // AVA requires a new output file; use a task-local private directory.
      const directory = await mkdtemp(join(resolve(evidence ?? join(destination, '..')), '.chart-'));
      try {
        const path = join(directory, 'chart.html');
        await invoke(['viz', '--spec', '-', '--output', path], JSON.stringify(plan.spec));
        charts.push({ section: plan.section, html: await readFile(path, 'utf8') });
      } catch (error) {
        chartErrors.push({ section: plan.section, message: error.message });
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    }
    const payload = {
      title: report.title,
      summary: report.summary,
      metrics: report.metrics,
      sections: report.sections,
      definitions: report.definitions,
      limitations: report.limitations,
      generatedAt: new Date().toISOString(),
      queries,
      charts,
      chartErrors: chartErrors.sort((a, b) => a.section - b.section),
    };
    if (previous) payload.previousReport = basename(previous);
    const json = JSON.stringify(payload)
      .replace(/</g, '\\u003c')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
    await htmlFile.writeFile(
      reportTemplate.replace(
        '<!-- ARTIFACT_DATA -->',
        () => `<script id="artifact-data" type="application/json">${json}</script>`
      )
    );
    await dataFile.writeFile(JSON.stringify(payload, null, 2));
    return {
      output: destination,
      dataOutput,
      sectionCount: report.sections.length,
      queryCount: queries.length,
      chartCount: charts.length,
      chartErrors: payload.chartErrors,
      chartPreviewVerified: false,
    };
  } catch (error) {
    await rm(destination);
    if (dataFile) await rm(dataOutput);
    throw error;
  } finally {
    await htmlFile.close();
    await dataFile?.close();
  }
}

const help = `AVA Skill reports (Node.js 22.13+, AVA CLI on PATH)

  node report.mjs query <datasetId> --dsl query.sql --source sales.csv --evidence /task/evidence
      [--max-rows 10000] [--max-result-bytes 1048576]
  node report.mjs index --evidence /task/evidence
  node report.mjs render --evidence /task/evidence --spec report-spec.json --output /task/report-v1.html
      [--previous /task/report-v0.json] [--template /task/report-template.html]

query executes SQL once and saves content-addressed evidence; index lists its metadata.
render consumes saved results and optionally merges sections by stable id with a previous report.
It uses the bundled default layout unless --template selects a task-local customized template.
It does not rerun queries. Existing output files are never overwritten.
`;

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || ['--help', '-h'].includes(command)) return process.stdout.write(help);
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: Object.fromEntries(
      ['dsl', 'source', 'evidence', 'spec', 'output', 'previous', 'template', 'max-rows', 'max-result-bytes'].map(
        (key) => [key, { type: 'string' }]
      )
    ),
  });
  let result;
  if (command === 'query') {
    check(positionals.length === 1, 'query requires one datasetId.');
    result = await recordQuery({
      ...values,
      datasetId: positionals[0],
      maxRows: values['max-rows'],
      maxResultBytes: values['max-result-bytes'],
    });
  } else if (command === 'index') {
    check(text(values.evidence), 'index requires --evidence.');
    result = (await queryIndex(values.evidence)).map(
      ({ queryId, datasetId, source, language, executedAt, result }) => ({
        queryId,
        datasetId,
        source,
        language,
        executedAt,
        columns: result.schema.map((column) => column.name),
        returnedRows: result.data.length,
        truncated: result.truncated === true,
      })
    );
  } else if (command === 'render') result = await renderReport(values);
  else throw new Error(`Unknown command: ${command}. Use --help.`);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
