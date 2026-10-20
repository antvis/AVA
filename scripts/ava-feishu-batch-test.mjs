#!/usr/bin/env node
/**
 * AVA × Feishu Bitable batch smoke test.
 *
 * Runs a matrix of `ava` commands against a live Feishu Bitable dataset,
 * validates the JSON responses, and writes a compact feishu-summary.json
 * (plus feishu-charts/ and, on failure, feishu-failures/) to an artifact dir.
 *
 * Default output is deliberately small. Pass --artifacts all to also keep
 * per-case stdout/stderr logs, or --artifacts none to keep only the summary.
 *
 * Usage:
 *   node scripts/ava-feishu-batch-test.mjs                     # newest live dataset
 *   node scripts/ava-feishu-batch-test.mjs --id ds_xxx         # explicit dataset
 *   node scripts/ava-feishu-batch-test.mjs --id ds_xxx --llm   # include LLM commands
 *   node scripts/ava-feishu-batch-test.mjs --filter sql        # only matching cases
 *   node scripts/ava-feishu-batch-test.mjs --list              # list case names
 *   node scripts/ava-feishu-batch-test.mjs --cases my.json     # add custom cases
 *
 * Notes:
 * - `.env` is loaded into the child process environment (plain `source .env`
 *   does NOT export variables to child processes).
 * - `dispose` only ever runs against a throwaway dataset created by this script.
 * - Exit code: 0 all good, 1 failures, 2 setup problem.
 */

import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

/* ------------------------------------------------------------------ */
/* output helpers                                                      */
/* ------------------------------------------------------------------ */

const COLOR = Boolean(process.stdout.isTTY) && !('NO_COLOR' in process.env);
const paint =
  (code) =>
  (text) =>
    COLOR ? `\u001b[${code}m${text}\u001b[0m` : text;
const green = paint('32');
const red = paint('31');
const yellow = paint('33');
const dim = paint('2');
const bold = paint('1');
const cyan = paint('36');

function die(message) {
  console.error(`${red('✖')} ${message}`);
  process.exit(2);
}

function firstLine(text) {
  return String(text ?? '').trim().split(/\r?\n/)[0] ?? '';
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Keep failure output in feishu-summary.json bounded. */
function cap(text, limit = 100_000) {
  const value = String(text ?? '');
  return value.length > limit
    ? `${value.slice(0, limit)}\n… [truncated ${value.length - limit} chars]`
    : value;
}

const HELP = `${bold('AVA × Feishu CLI batch test')}

Usage:
  node scripts/ava-feishu-batch-test.mjs [options]

Options:
  --id <ds_...>        Dataset id (default: newest live session)
  --llm               Include commands that call the LLM
  --llm-full          Also run the slower loop/subset analyze strategies (implies --llm)
  --filter <text>     Only run cases whose name contains text
  --skip <text>       Skip cases whose name contains text
  --timeout <ms>      Timeout for local cases (default 30000)
  --llm-timeout <ms>  Timeout for LLM cases (default max(150000, timeout))
  --out <dir>         Artifact directory (default ./.ava-feishu-test/<timestamp>)
  --artifacts <mode>  summary (default), all (per-case logs), or none
  --keep-work         Keep the temporary work dir (rows/specs) for debugging
  --env <file>        Env file to load (default ./.env, then <repo>/.env)
  --ava <cmd>         CLI to run (default $AVA_BIN, else ava, else node <repo>/lib/cli/index.js)
  --cases <file>      Extra cases as a JSON array
  --list              List cases and exit
  -h, --help          Show this help

Case fields for --cases:
  { "name": "my/case", "args": ["query", "$ID", "--dsl", "SELECT 1"],
    "stdin": "optional", "needsKey": false, "needsGateway": false,
    "needsSql": false, "expect": "success" | "failure",
    "error": "regex for stderr", "timeout": 30000 }

Placeholders in args: $ID, $TEMP, $ROWS, $OUT.
`;

/* ------------------------------------------------------------------ */
/* options                                                             */
/* ------------------------------------------------------------------ */

const opts = {
  id: null,
  out: null,
  filter: null,
  skip: null,
  list: false,
  llm: false,
  llmFull: false,
  timeout: 30_000,
  llmTimeout: null,
  env: null,
  ava: null,
  cases: null,
  artifacts: 'summary',
  keepWork: false,
};

const VALUE_OPTIONS = new Map([
  ['--id', 'id'],
  ['--out', 'out'],
  ['--filter', 'filter'],
  ['--skip', 'skip'],
  ['--timeout', 'timeout'],
  ['--llm-timeout', 'llmTimeout'],
  ['--env', 'env'],
  ['--ava', 'ava'],
  ['--cases', 'cases'],
  ['--artifacts', 'artifacts'],
]);

const argv = process.argv.slice(2);

for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];

  if (VALUE_OPTIONS.has(arg)) {
    const key = VALUE_OPTIONS.get(arg);
    const value = argv[++i];
    if (value === undefined) die(`${arg} 缺少参数值`);
    if (key === 'timeout' || key === 'llmTimeout') {
      const number = Number(value);
      if (!Number.isSafeInteger(number) || number <= 0) die(`${arg} 需要正整数毫秒`);
      opts[key] = number;
    } else {
      opts[key] = value;
    }
    continue;
  }

  switch (arg) {
    case '--llm':
      opts.llm = true;
      break;
    case '--llm-full':
      opts.llm = true;
      opts.llmFull = true;
      break;
    case '--list':
      opts.list = true;
      break;
    case '--keep-work':
      opts.keepWork = true;
      break;
    case '-h':
    case '--help':
      console.log(HELP);
      process.exit(0);
    // eslint-disable-next-line no-fallthrough
    default:
      if (arg.startsWith('-')) die(`未知参数 ${arg}\n\n${HELP}`);
      if (opts.id) die(`多余的参数 ${arg}`);
      opts.id = arg;
  }
}

if (!['summary', 'all', 'none'].includes(opts.artifacts)) {
  die(`--artifacts 只能是 summary / all / none（收到 ${opts.artifacts}）`);
}

/* ------------------------------------------------------------------ */
/* env file                                                            */
/* ------------------------------------------------------------------ */

/** Load KEY=VALUE lines into process.env without overriding real env vars. */
function loadEnvFile(file) {
  const text = readFileSync(file, 'utf8');
  let total = 0;
  let loaded = 0;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    total++;

    const [, key, rawValue] = match;
    let value = rawValue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded++;
    }
  }

  return { total, loaded };
}

const envCandidates = opts.env
  ? [resolve(opts.env)]
  : [resolve(process.cwd(), '.env'), join(REPO, '.env')];

let envFile = null;
for (const candidate of envCandidates) {
  if (existsSync(candidate)) {
    envFile = candidate;
    break;
  }
}

let envTotal = 0;
let envLoaded = 0;
if (envFile) ({ total: envTotal, loaded: envLoaded } = loadEnvFile(envFile));

const hasKey = Boolean(process.env.OPENAI_API_KEY);
const hasGateway = Boolean(process.env.AI_GATEWAY_API_KEY);

/* ------------------------------------------------------------------ */
/* ava command resolution                                              */
/* ------------------------------------------------------------------ */

function parseCommand(text) {
  const parts = String(text).trim().split(/\s+/);
  return { cmd: parts[0], prefix: parts.slice(1), label: String(text).trim() };
}

function resolveAva() {
  const explicit = opts.ava ?? process.env.AVA_BIN;
  if (explicit) return parseCommand(explicit);

  const probe = spawnSync('ava', ['--help'], { stdio: 'ignore' });
  if (!probe.error) return { cmd: 'ava', prefix: [], label: 'ava' };

  const local = join(REPO, 'lib', 'cli', 'index.js');
  if (existsSync(local)) {
    const [major, minor] = process.versions.node.split('.').map(Number);
    if (major < 22 || (major === 22 && minor < 13)) {
      die(
        `当前 node 是 ${process.version}，但 AVA 需要 >= 22.13。\n` +
          '  用 Node 22 运行本脚本，或用 --ava 指定可用的 ava 命令。'
      );
    }
    return { cmd: process.execPath, prefix: [local], label: `node ${local}` };
  }

  const localBin = join(REPO, 'node_modules', '.bin', 'ava');
  if (existsSync(localBin)) return { cmd: localBin, prefix: [], label: localBin };

  die(
    '找不到可执行的 ava。请把 ava 放进 PATH，或用 --ava "node /path/to/lib/cli/index.js" 指定。'
  );
}

/* ------------------------------------------------------------------ */
/* dataset discovery                                                   */
/* ------------------------------------------------------------------ */

function liveSessions() {
  const base = tmpdir();
  let names = [];

  try {
    names = readdirSync(base);
  } catch {
    return [];
  }

  return names
    .filter((name) => name.startsWith('ava-ds_'))
    .map((name) => {
      const ipc = join(base, name, 'ipc');
      let mtime = 0;
      try {
        mtime = statSync(ipc).mtimeMs;
      } catch {
        return null;
      }
      return { id: name.slice(4), ipc, mtime };
    })
    .filter(Boolean)
    .sort((a, b) => b.mtime - a.mtime);
}

function pickDataset(AVA) {
  if (opts.id) return opts.id;

  const candidates = liveSessions().slice(0, 5);
  if (candidates.length === 0) {
    die('没有找到正在运行的 ava 会话。先运行 `ava source ...`，或用 --id 指定数据集。');
  }

  for (const candidate of candidates) {
    const probe = spawnSync(AVA.cmd, [...AVA.prefix, 'schema', candidate.id], {
      encoding: 'utf8',
      timeout: 15_000,
      env: process.env,
    });
    if (probe.status === 0) {
      console.log(dim(`自动选择数据集 ${candidate.id}（可用 --id 指定）`));
      return candidate.id;
    }
  }

  die('找到会话目录但都连不上。先用 `ava schema <id>` 确认，再用 --id 指定。');
}

/* ------------------------------------------------------------------ */
/* process runner                                                      */
/* ------------------------------------------------------------------ */

function run(AVA, args, { timeout, stdin } = {}) {
  return new Promise((settleResolve) => {
    const started = Date.now();
    let child;

    try {
      child = spawn(AVA.cmd, [...AVA.prefix, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      });
    } catch (error) {
      settleResolve({
        args,
        code: null,
        signal: null,
        stdout: '',
        stderr: String(error),
        ms: 0,
        timedOut: false,
      });
      return;
    }

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let done = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeout);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    const finish = (code, signal, extra) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      settleResolve({
        args,
        code,
        signal,
        stdout,
        stderr: stderr + (extra ? `\n${String(extra)}` : ''),
        ms: Date.now() - started,
        timedOut,
      });
    };

    child.on('error', (error) => finish(null, null, error));
    child.on('close', (code, signal) => finish(code, signal));

    if (typeof stdin === 'string') child.stdin.end(stdin);
    else child.stdin.end();
  });
}

/* ------------------------------------------------------------------ */
/* result checks                                                       */
/* ------------------------------------------------------------------ */

/** Success check: exit 0 + JSON output, then run a validator. */
function checkJson(result, validate) {
  if (result.timedOut) return [`超时（${result.ms}ms 后被杀掉）`];
  if (result.code !== 0) {
    return [`exit ${result.code}: ${firstLine(result.stderr) || firstLine(result.stdout) || '无输出'}`];
  }

  const json = parseJson(result.stdout);
  if (json === undefined) return ['stdout 不是合法 JSON'];

  try {
    return validate(json) ?? [];
  } catch (error) {
    return [`校验抛错: ${error.message}`];
  }
}

/** Negative check: non-zero exit + non-empty error, optionally matching a regex. */
function checkError(result, pattern) {
  if (result.timedOut) return [`超时（${result.ms}ms 后被杀掉）`];
  if (result.code === 0) return ['本来期望失败，但 exit code 是 0'];

  const message = `${result.stderr}\n${result.stdout}`.trim();
  if (!message) return ['期望有错误信息，但 stdout/stderr 都是空的'];
  if (pattern && !pattern.test(message)) {
    return [`错误信息不匹配 ${pattern}: ${firstLine(message)}`];
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* shared fixtures                                                     */
/* ------------------------------------------------------------------ */

const STATIC_ROWS = [
  { category: '茶', n: 300 },
  { category: '咖啡', n: 300 },
  { category: '果汁', n: 300 },
  { category: '点心', n: 300 },
];

const STATIC_SPECS = {
  column: {
    chartType: 'column',
    syntax: `vis column
data
  - category 茶
    value 300
  - category 咖啡
    value 300
  - category 果汁
    value 300
  - category 点心
    value 300
title 各类别记录数
axisXTitle 类别
axisYTitle 记录数`,
  },
  line: {
    chartType: 'line',
    syntax: `vis line
data
  - time 2026-01
    value 31
  - time 2026-02
    value 28
  - time 2026-03
    value 31
  - time 2026-04
    value 30
  - time 2026-05
    value 31
  - time 2026-06
    value 30
title 月度记录数趋势
axisXTitle 月份
axisYTitle 记录数`,
  },
  pie: {
    chartType: 'pie',
    syntax: `vis pie
data
  - category 茶
    value 300
  - category 咖啡
    value 300
  - category 果汁
    value 300
  - category 点心
    value 300
title 类别占比`,
  },
  scatter: {
    chartType: 'scatter',
    syntax: `vis scatter
data
  - x 1
    y 37.5
  - x 2
    y 74.5
  - x 3
    y 111.5
  - x 4
    y 148.5
  - x 5
    y 185.5
title 编号与金额关系
axisXTitle 编号
axisYTitle 金额`,
  },
};

const NUMERIC_TYPES = new Set([
  'BIGINT',
  'UBIGINT',
  'HUGEINT',
  'INTEGER',
  'DECIMAL',
  'DOUBLE',
  'FLOAT',
  'REAL',
  'SMALLINT',
  'TINYINT',
]);

function applySchema(state, schema) {
  const table = schema.tables?.[0];
  const fields = table?.fields ?? [];

  state.fence = schema.language?.fence ?? null;
  state.fields = fields.map((field) => field.name);
  state.numField =
    fields.find((field) => NUMERIC_TYPES.has(String(field.type).toUpperCase()))?.name ?? null;
  state.textField =
    fields.find((field) => /CHAR|TEXT|STRING/.test(String(field.type).toUpperCase()))?.name ??
    null;
  state.dateField =
    fields.find((field) => /DATE|TIME/.test(String(field.type).toUpperCase()))?.name ?? null;
}

function quoteId(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]+/g, '_');
}

const CHART_FILES = {
  column: 'feishu-chart-column.html',
  line: 'feishu-chart-line.html',
  pie: 'feishu-chart-pie.html',
  scatter: 'feishu-chart-scatter.html',
  recommendedColumn: 'feishu-chart-recommended-column.html',
  recommendedPie: 'feishu-chart-recommended-pie.html',
  visualizeColumn: 'feishu-chart-visualize-column.html',
  visualizePie: 'feishu-chart-visualize-pie.html',
};

function chartProblems(state, file) {
  const html = join(state.chartsDir, file);
  if (!existsSync(html)) return [`没有生成 ${file}`];
  if (statSync(html).size === 0) return [`${file} 是空文件`];
  if (!readFileSync(html, 'utf8').includes('GPTVis')) return [`${file} 不包含 GPTVis 脚本`];
  return [];
}

/** Render a static GPT-Vis spec with `viz` (no API key needed). */
function staticChartCase(name, type, file) {
  return {
    name,
    args: (state) => [
      'viz',
      '--spec',
      `@${state.staticSpecs[type]}`,
      '--output',
      join(state.chartsDir, file),
    ],
    check: (result, state) => checkJson(result, () => chartProblems(state, file)),
  };
}

/** Ask the LLM for a chart spec and save it for a later viz case. */
function recommendCase(name, query, specKey) {
  return {
    name,
    needsKey: true,
    args: (state) => ['recommend', '--query', query, '--data', `@${state.rowsFile}`],
    check: (result, state) =>
      checkJson(result, (spec) => {
        if (typeof spec?.chartType !== 'string' || !spec.chartType) return ['缺少 chartType'];
        if (typeof spec?.syntax !== 'string' || !spec.syntax.trim()) return ['缺少 syntax'];
        writeFileSync(state.recommendSpecs[specKey], JSON.stringify(spec, null, 2));
        return [];
      }),
  };
}

/** Render the spec produced by a matching recommend case. */
function recommendedVizCase(name, specKey, file) {
  return {
    name,
    skip: (state) => (existsSync(state.recommendSpecs[specKey]) ? null : 'recommend 用例未成功'),
    args: (state) => [
      'viz',
      '--spec',
      `@${state.recommendSpecs[specKey]}`,
      '--output',
      join(state.chartsDir, file),
    ],
    check: (result, state) => checkJson(result, () => chartProblems(state, file)),
  };
}

/** One-shot recommend + render via `visualize` (needs an API key). */
function visualizeCase(name, query, file) {
  return {
    name,
    needsKey: true,
    args: (state) => [
      'visualize',
      '--query',
      query,
      '--data',
      `@${state.rowsFile}`,
      '--output',
      join(state.chartsDir, file),
    ],
    check: (result, state) =>
      checkJson(result, (rendered) => {
        if (typeof rendered.chartType !== 'string') return ['缺少 chartType'];
        if (typeof rendered.html !== 'string' || rendered.html.length === 0) return ['缺少 html'];
        return chartProblems(state, file);
      }),
  };
}

/* ------------------------------------------------------------------ */
/* cases                                                               */
/* ------------------------------------------------------------------ */

const CASES = [
  {
    name: 'cli/help',
    args: [],
    check: (result) => {
      if (result.code !== 0) return [`exit ${result.code}`];
      return /Commands:/.test(result.stdout) ? [] : ['help 输出里没有 Commands'];
    },
  },
  {
    name: 'cli/help-analyze',
    args: ['analyze', '--help'],
    check: (result) => {
      if (result.code !== 0) return [`exit ${result.code}`];
      return /Usage:/.test(result.stdout) ? [] : ['帮助输出里没有 Usage'];
    },
  },
  {
    name: 'cli/unknown-command',
    args: ['definitely-not-a-command'],
    check: (result) => checkError(result, /Unknown command/),
  },

  {
    name: 'schema',
    args: (state) => ['schema', state.id],
    check: (result, state) =>
      checkJson(result, (schema) => {
        const table = schema.tables?.[0];
        if (!table) return ['schema 里没有 tables'];
        if (!Array.isArray(table.fields) || table.fields.length === 0) return ['schema 里没有字段'];
        applySchema(state, schema);
        return [];
      }),
  },
  {
    name: 'schema/unknown-id',
    args: ['schema', 'ds_000000000000000000000000'],
    check: (result) => checkError(result, /unavailable|not found|ENOENT|Invalid dataset ID/i),
  },

  {
    name: 'profile/default',
    args: (state) => ['profile', state.id],
    check: (result) =>
      checkJson(result, (profile) => {
        const table = profile.tables?.[0];
        if (!table) return ['profile 里没有 tables'];
        if (!table.fields?.length) return ['profile 里没有字段'];
        if (typeof table.metrics?.row_count !== 'number') return ['缺少表级 row_count'];
        return [];
      }),
  },
  {
    name: 'profile/metrics',
    args: (state) => ['profile', state.id, '--metrics', 'distinct_count,top_values'],
    check: (result) =>
      checkJson(result, (profile) => {
        const fields = profile.tables?.[0]?.fields ?? [];
        if (!fields.length) return ['没有字段'];
        const bad = fields.find((field) => typeof field.metrics?.distinct_count !== 'number');
        return bad ? [`字段 ${bad.name} 没有 distinct_count`] : [];
      }),
  },
  {
    name: 'profile/structure',
    args: (state) => ['profile', state.id, '--metrics', ''],
    check: (result) =>
      checkJson(result, (profile) => {
        const fields = profile.tables?.[0]?.fields ?? [];
        if (!fields.length) return ['没有字段'];
        const bad = fields.find((field) => Object.keys(field.metrics ?? {}).length > 0);
        return bad ? [`--metrics "" 仍然算了统计: ${bad.name}`] : [];
      }),
  },
  {
    name: 'profile/extended',
    args: (state) => ['profile', state.id, '--metrics', 'sum,median,stddev,min,max'],
    skip: (state) => (state.numField ? null : '没有数值字段'),
    check: (result, state) =>
      checkJson(result, (profile) => {
        const field = profile.tables?.[0]?.fields?.find((item) => item.name === state.numField);
        if (!field) return [`找不到数值字段 ${state.numField}`];
        if (typeof field.metrics?.sum !== 'number' && typeof field.metrics?.median !== 'number') {
          return [`字段 ${state.numField} 没有 sum/median`];
        }
        return [];
      }),
  },

  {
    name: 'query/limit',
    needsSql: true,
    args: (state) => ['query', state.id, '--dsl', 'SELECT * FROM data LIMIT 3'],
    check: (result) =>
      checkJson(result, (rows) => {
        if (!Array.isArray(rows.data)) return ['结果里没有 data 数组'];
        if (rows.rowCount !== 3 || rows.data.length !== 3) return [`期望 3 行，实际 ${rows.rowCount}`];
        return [];
      }),
  },
  {
    name: 'query/count',
    needsSql: true,
    args: (state) => ['query', state.id, '--dsl', 'SELECT COUNT(*) AS n FROM data'],
    check: (result) =>
      checkJson(result, (rows) => {
        const n = Number(rows.data?.[0]?.n);
        if (!Number.isFinite(n) || n <= 0) return [`COUNT(*) 异常: ${rows.data?.[0]?.n}`];
        return [];
      }),
  },
  {
    name: 'query/group-by',
    needsSql: true,
    skip: (state) => (state.textField ? null : '没有文本字段'),
    args: (state) => [
      'query',
      state.id,
      '--dsl',
      `SELECT ${quoteId(state.textField)} AS value, COUNT(*) AS n FROM data GROUP BY 1 ORDER BY n DESC`,
    ],
    check: (result) =>
      checkJson(result, (rows) => {
        if (!Array.isArray(rows.data) || rows.data.length === 0) return ['分组结果为空'];
        const bad = rows.data.find((row) => !(Number(row.n) > 0));
        return bad ? [`分组计数异常: ${JSON.stringify(bad)}`] : [];
      }),
  },
  {
    name: 'query/stdin',
    needsSql: true,
    args: (state) => ['query', state.id, '--dsl', '-'],
    stdin: 'SELECT 1 AS value',
    check: (result) =>
      checkJson(result, (rows) => (rows.data?.[0]?.value === 1 ? [] : ['stdin SQL 结果不对'])),
  },
  {
    name: 'query/file',
    needsSql: true,
    args: (state) => ['query', state.id, '--dsl', `@${state.caseSql}`],
    check: (result) =>
      checkJson(result, (rows) => (rows.data?.[0]?.value === 2 ? [] : ['@file SQL 结果不对'])),
  },
  {
    name: 'query/bad-sql',
    needsSql: true,
    args: (state) => ['query', state.id, '--dsl', 'SELECT * FROM no_such_table'],
    check: (result) => checkError(result, /no_such_table|does not exist|not exist|Catalog|Binder/i),
  },
  {
    name: 'sql/describe',
    needsSql: true,
    args: (state) => ['query', state.id, '--dsl', 'DESCRIBE data'],
    check: (result) =>
      checkJson(result, (rows) => {
        if (!Array.isArray(rows.data) || rows.data.length === 0) return ['DESCRIBE 没有结果'];
        if (typeof rows.data[0]?.column_name !== 'string') return ['缺少 column_name'];
        return [];
      }),
  },
  {
    name: 'sql/aggregate',
    needsSql: true,
    skip: (state) => (state.numField ? null : '没有数值字段'),
    args: (state) => [
      'query',
      state.id,
      '--dsl',
      `SELECT MIN(${quoteId(state.numField)}) AS min_v, MAX(${quoteId(
        state.numField
      )}) AS max_v, AVG(${quoteId(state.numField)}) AS avg_v, COUNT(${quoteId(
        state.numField
      )}) AS n FROM data`,
    ],
    check: (result) =>
      checkJson(result, (rows) => {
        const row = rows.data?.[0] ?? {};
        const [min, max, avg, n] = [row.min_v, row.max_v, row.avg_v, row.n].map(Number);
        if (![min, max, avg, n].every(Number.isFinite)) return ['聚合结果不是数字'];
        if (n <= 0) return ['COUNT 结果异常'];
        if (min > max || avg < min - 1e-9 || avg > max + 1e-9) return ['min/avg/max 关系异常'];
        return [];
      }),
  },
  {
    name: 'sql/distinct',
    needsSql: true,
    skip: (state) => (state.textField ? null : '没有文本字段'),
    args: (state) => [
      'query',
      state.id,
      '--dsl',
      `SELECT COUNT(DISTINCT ${quoteId(state.textField)}) AS distinct_values, COUNT(*) AS total_rows FROM data`,
    ],
    check: (result) =>
      checkJson(result, (rows) => {
        const distinct = Number(rows.data?.[0]?.distinct_values);
        const total = Number(rows.data?.[0]?.total_rows);
        if (!Number.isFinite(distinct) || !Number.isFinite(total)) return ['结果不是数字'];
        if (distinct < 0 || distinct > total) return ['distinct_values 超出范围'];
        return [];
      }),
  },
  {
    name: 'sql/nulls',
    needsSql: true,
    skip: (state) => (state.numField ? null : '没有数值字段'),
    args: (state) => [
      'query',
      state.id,
      '--dsl',
      `SELECT COUNT(*) AS total, COUNT(${quoteId(state.numField)}) AS non_null, COUNT(*) - COUNT(${quoteId(
        state.numField
      )}) AS nulls FROM data`,
    ],
    check: (result) =>
      checkJson(result, (rows) => {
        const row = rows.data?.[0] ?? {};
        const [total, nonNull, nulls] = [row.total, row.non_null, row.nulls].map(Number);
        if (![total, nonNull, nulls].every(Number.isFinite)) return ['结果不是数字'];
        if (total <= 0) return ['总行数异常'];
        if (nonNull + nulls !== total) return ['non_null + nulls 不等于 total'];
        return [];
      }),
  },
  {
    name: 'sql/top-n',
    needsSql: true,
    skip: (state) => (state.textField && state.numField ? null : '缺少文本或数值字段'),
    args: (state) => [
      'query',
      state.id,
      '--dsl',
      `SELECT ${quoteId(state.textField)} AS label, ROUND(SUM(${quoteId(
        state.numField
      )}), 2) AS total FROM data WHERE ${quoteId(state.textField)} IS NOT NULL GROUP BY 1 ORDER BY total DESC LIMIT 3`,
    ],
    check: (result) =>
      checkJson(result, (rows) => {
        if (!Array.isArray(rows.data) || rows.data.length === 0) return ['Top-N 结果为空'];
        if (rows.data.length > 3) return ['Top-N 超过 3 行'];
        const totals = rows.data.map((row) => Number(row.total));
        if (!totals.every(Number.isFinite)) return ['total 不是数字'];
        const sorted = totals.every((value, index) => index === 0 || totals[index - 1] >= value);
        return sorted ? [] : ['total 没有按降序排列'];
      }),
  },
  {
    name: 'sql/date-month',
    needsSql: true,
    skip: (state) => (state.dateField ? null : '没有日期字段'),
    args: (state) => [
      'query',
      state.id,
      '--dsl',
      `SELECT strftime(date_trunc('month', ${quoteId(
        state.dateField
      )}), '%Y-%m') AS month, COUNT(*) AS n FROM data WHERE ${quoteId(
        state.dateField
      )} IS NOT NULL GROUP BY 1 ORDER BY 1`,
    ],
    check: (result) =>
      checkJson(result, (rows) => {
        if (!Array.isArray(rows.data) || rows.data.length === 0) return ['按月聚合结果为空'];
        const bad = rows.data.find((row) => typeof row.month !== 'string' || !(Number(row.n) > 0));
        return bad ? [`按月结果异常: ${JSON.stringify(bad)}`] : [];
      }),
  },
  {
    name: 'sql/window',
    needsSql: true,
    skip: (state) => (state.numField ? null : '没有数值字段'),
    args: (state) => [
      'query',
      state.id,
      '--dsl',
      `SELECT ${quoteId(state.numField)} AS value, ROW_NUMBER() OVER (ORDER BY ${quoteId(
        state.numField
      )}) AS rn FROM data WHERE ${quoteId(state.numField)} IS NOT NULL LIMIT 3`,
    ],
    check: (result) =>
      checkJson(result, (rows) => {
        if (!Array.isArray(rows.data) || rows.data.length === 0) return ['窗口函数结果为空'];
        const bad = rows.data.find((row, index) => Number(row.rn) !== index + 1);
        return bad ? ['ROW_NUMBER 不是从 1 连续递增'] : [];
      }),
  },
  {
    name: 'sql/cte',
    needsSql: true,
    skip: (state) => (state.dateField ? null : '没有日期字段'),
    args: (state) => [
      'query',
      state.id,
      '--dsl',
      `WITH monthly AS (SELECT date_trunc('month', ${quoteId(
        state.dateField
      )}) AS month, COUNT(*) AS n FROM data WHERE ${quoteId(
        state.dateField
      )} IS NOT NULL GROUP BY 1) SELECT * FROM monthly ORDER BY n DESC LIMIT 3`,
    ],
    check: (result) =>
      checkJson(result, (rows) => {
        if (!Array.isArray(rows.data) || rows.data.length === 0) return ['CTE 结果为空'];
        const bad = rows.data.find((row) => !(Number(row.n) > 0));
        return bad ? ['CTE 计数异常'] : [];
      }),
  },

  {
    name: 'source/stdin-json',
    args: ['source', '-'],
    stdin: JSON.stringify({
      type: 'json',
      options: {
        data: [
          { name: 'a', score: 1 },
          { name: 'b', score: 2 },
        ],
      },
    }),
    check: (result, state) =>
      checkJson(result, (loaded) => {
        if (typeof loaded.datasetId !== 'string' || !/^ds_/.test(loaded.datasetId)) {
          return ['没有返回 datasetId'];
        }
        state.tempId = loaded.datasetId;
        return [];
      }),
  },
  {
    name: 'source/schema',
    skip: (state) => (state.tempId ? null : 'source 用例未成功'),
    args: (state) => ['schema', state.tempId],
    check: (result) =>
      checkJson(result, (schema) => {
        const fields = schema.tables?.[0]?.fields ?? [];
        return fields.length === 2 ? [] : [`期望 2 个字段，实际 ${fields.length}`];
      }),
  },
  {
    name: 'dispose/temp',
    skip: (state) => (state.tempId ? null : 'source 用例未成功'),
    args: (state) => ['dispose', state.tempId],
    check: (result, state) =>
      checkJson(result, (disposed) => {
        if (disposed.disposed !== true) return ['dispose 没有返回 disposed: true'];
        state.tempDisposed = true;
        return [];
      }),
  },
  {
    name: 'dispose/temp-again',
    skip: (state) => (state.tempDisposed ? null : '临时数据集还没有被 dispose'),
    args: (state) => ['dispose', state.tempId],
    check: (result) => checkError(result, /unavailable|not found|closed|ENOENT/i),
  },

  {
    name: 'query/export-rows',
    needsSql: true,
    skip: (state) => (state.textField ? null : '没有文本字段'),
    args: (state) => [
      'query',
      state.id,
      '--dsl',
      `SELECT ${quoteId(state.textField)} AS category, COUNT(*) AS n FROM data GROUP BY 1 ORDER BY n DESC`,
    ],
    check: (result, state) =>
      checkJson(result, (rows) => {
        if (!Array.isArray(rows.data) || rows.data.length === 0) return ['导出行结果为空'];
        writeFileSync(state.rowsFile, JSON.stringify(rows.data));
        return [];
      }),
  },

  staticChartCase('chart/viz-column', 'column', CHART_FILES.column),
  staticChartCase('chart/viz-line', 'line', CHART_FILES.line),
  staticChartCase('chart/viz-pie', 'pie', CHART_FILES.pie),
  staticChartCase('chart/viz-scatter', 'scatter', CHART_FILES.scatter),

  recommendCase('chart/recommend-column', '用柱状图展示各类别的数量对比', 'column'),
  recommendCase('chart/recommend-pie', '用饼图展示各类别的数量占比', 'pie'),
  recommendedVizCase('chart/viz-recommended-column', 'column', CHART_FILES.recommendedColumn),
  recommendedVizCase('chart/viz-recommended-pie', 'pie', CHART_FILES.recommendedPie),

  visualizeCase('chart/visualize-column', '用柱状图展示各类别的数量对比', CHART_FILES.visualizeColumn),
  visualizeCase('chart/visualize-pie', '用饼图展示各类别的数量占比', CHART_FILES.visualizePie),

  {
    name: 'suggest',
    needsKey: true,
    args: (state) => ['suggest', state.id, '--count', '3'],
    check: (result) =>
      checkJson(result, (suggestions) => {
        if (!Array.isArray(suggestions)) return ['结果不是数组'];
        if (suggestions.length !== 3) return [`期望 3 条，实际 ${suggestions.length}`];
        const bad = suggestions.find((item) => typeof item?.query !== 'string' || !item.query.trim());
        return bad ? ['有一条建议缺少 query'] : [];
      }),
  },
  {
    name: 'translate',
    needsKey: true,
    needsSql: true,
    args: (state) => ['translate', state.id, '统计每个类别的记录数'],
    check: (result) =>
      checkJson(result, (translated) => {
        if (typeof translated?.dsl !== 'string') return ['缺少 dsl'];
        return /select/i.test(translated.dsl) ? [] : ['dsl 里没有 SELECT'];
      }),
  },
  {
    name: 'analyze',
    needsKey: true,
    args: (state) => ['analyze', state.id, '这张表一共有多少条记录？'],
    check: (result) =>
      checkJson(result, (analysis) => {
        if (!Array.isArray(analysis?.data)) return ['缺少 data 数组'];
        if (typeof analysis?.text !== 'string' || !analysis.text.trim()) return ['缺少 text'];
        if (!(Number(analysis.rowCount) >= 1)) return ['rowCount 异常'];
        return [];
      }),
  },
  {
    name: 'analyze/loop',
    needsKey: true,
    llmFull: true,
    args: (state) => ['analyze', state.id, '按类别统计记录数', '--strategy', 'loop'],
    check: (result) =>
      checkJson(result, (analysis) => {
        if (!Array.isArray(analysis?.data)) return ['缺少 data 数组'];
        if (typeof analysis?.text !== 'string' || !analysis.text.trim()) return ['缺少 text'];
        return [];
      }),
  },
  {
    name: 'analyze/subset',
    needsKey: true,
    needsGateway: true,
    llmFull: true,
    args: (state) => ['analyze', state.id, '按类别统计记录数', '--strategy', 'subset'],
    check: (result) =>
      checkJson(result, (analysis) => {
        if (!Array.isArray(analysis?.data)) return ['缺少 data 数组'];
        if (typeof analysis?.text !== 'string' || !analysis.text.trim()) return ['缺少 text'];
        return [];
      }),
  },
];

/* ------------------------------------------------------------------ */
/* custom cases                                                        */
/* ------------------------------------------------------------------ */

if (opts.cases) {
  const file = resolve(opts.cases);
  if (!existsSync(file)) die(`--cases 文件不存在: ${file}`);

  let extra;
  try {
    extra = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    die(`--cases 解析失败: ${error.message}`);
  }

  if (!Array.isArray(extra)) die('--cases 文件必须是 JSON 数组');

  for (const [index, item] of extra.entries()) {
    const expectFailure = item.expect === 'failure';

    CASES.push({
      name: item.name || `custom/${index + 1}`,
      needsKey: Boolean(item.needsKey),
      needsGateway: Boolean(item.needsGateway),
      needsSql: Boolean(item.needsSql),
      llmFull: Boolean(item.llmFull),
      timeout: item.timeout,
      args: (state) =>
        (item.args ?? []).map((arg) =>
          String(arg)
            .replaceAll('$ID', state.id)
            .replaceAll('$TEMP', state.tempId ?? '')
            .replaceAll('$ROWS', state.rowsFile)
            .replaceAll('$OUT', state.out)
        ),
      stdin: item.stdin,
      check: expectFailure
        ? (result) => checkError(result, item.error ? new RegExp(item.error) : undefined)
        : (result) => {
            if (result.timedOut) return [`超时（${result.ms}ms 后被杀掉）`];
            if (result.code !== 0) {
              return [`exit ${result.code}: ${firstLine(result.stderr) || '无输出'}`];
            }
            return [];
          },
    });
  }
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

if (opts.list) {
  const width = Math.max(...CASES.map((item) => item.name.length));
  for (const item of CASES) {
    const flags = [
      item.needsKey ? 'key' : '',
      item.needsGateway ? 'gateway' : '',
      item.needsSql ? 'sql' : '',
      item.llmFull ? 'llm-full' : '',
    ]
      .filter(Boolean)
      .join(',');
    console.log(`  ${item.name.padEnd(width)}  ${flags ? dim(`[${flags}]`) : ''}`);
  }
  console.log(dim(`\n${CASES.length} cases`));
  process.exit(0);
}

const AVA = resolveAva();
const datasetId = pickDataset(AVA);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = resolve(opts.out ?? join(process.cwd(), '.ava-feishu-test', stamp));
mkdirSync(out, { recursive: true });

const work = mkdtempSync(join(tmpdir(), 'ava-feishu-work-'));
const chartsDir =
  opts.artifacts === 'none' ? join(work, 'feishu-charts') : join(out, 'feishu-charts');
const logsDir = join(out, 'feishu-logs');
const failuresDir = join(out, 'feishu-failures');
mkdirSync(chartsDir, { recursive: true });

const staticSpecs = {};
for (const [type, spec] of Object.entries(STATIC_SPECS)) {
  const file = join(work, `spec-static-${type}.json`);
  writeFileSync(file, JSON.stringify(spec, null, 2));
  staticSpecs[type] = file;
}

const recommendSpecs = {
  column: join(work, 'spec-recommend-column.json'),
  pie: join(work, 'spec-recommend-pie.json'),
};

const state = {
  id: datasetId,
  out,
  chartsDir,
  rowsFile: join(work, 'rows.json'),
  staticSpecs,
  recommendSpecs,
  caseSql: join(work, 'case.sql'),
  tempId: null,
  tempDisposed: false,
  fence: null,
  fields: [],
  numField: null,
  textField: null,
  dateField: null,
};

writeFileSync(state.rowsFile, JSON.stringify(STATIC_ROWS));
writeFileSync(state.caseSql, 'SELECT 2 AS value\n');

const llmTimeout = opts.llmTimeout ?? Math.max(opts.timeout, 150_000);

console.log(`${bold('AVA × Feishu CLI batch test')}`);
console.log(`  ${dim('ava      ')} ${AVA.label}`);
console.log(`  ${dim('dataset  ')} ${state.id}`);
console.log(
  `  ${dim('env      ')} ${
    envFile ? `${envFile} (${envTotal} keys, ${envLoaded} newly loaded)` : 'none'
  } · OPENAI_API_KEY ${hasKey ? green('set') : yellow('missing')}`
);
console.log(`  ${dim('llm      ')} ${opts.llm ? (hasKey ? 'on' : 'on (skipped: no key)') : 'off'}`);
console.log(`  ${dim('gateway  ')} ${hasGateway ? green('set') : yellow('missing')} ${dim('(subset)')}`);
console.log(`  ${dim('artifacts')} ${opts.artifacts}${opts.keepWork ? ' · keep work' : ''}`);
console.log(`  ${dim('out      ')} ${out}`);

/* -- preflight: fail fast if the dataset is unreachable ---------------- */

const preflight = await run(AVA, ['schema', state.id], { timeout: opts.timeout });

if (preflight.timedOut) {
  die(`schema ${state.id} 超时，数据集可能已失效。重新运行 ava source 后再试。`);
}
if (preflight.code !== 0) {
  die(
    `连不上数据集 ${state.id}: ${firstLine(preflight.stderr) || '未知错误'}\n` +
      `  用 \`ava schema ${state.id}\` 确认，或重新 ava source 后指定新的 id。`
  );
}

const preflightSchema = parseJson(preflight.stdout);
if (preflightSchema) applySchema(state, preflightSchema);
else die('schema 返回的不是 JSON，无法继续。');

/* -- run -------------------------------------------------------------- */

const results = [];
const selected = CASES.filter((item) => {
  if (opts.filter && !item.name.includes(opts.filter)) return false;
  if (opts.skip && item.name.includes(opts.skip)) return false;
  return true;
});

for (const item of selected) {
  const skipReason =
    (item.needsKey && !opts.llm && '需要 --llm（会调用模型，消耗 token）') ||
    (item.needsKey && !hasKey && '没有 OPENAI_API_KEY') ||
    (item.needsGateway && !process.env.AI_GATEWAY_API_KEY && '需要 AI_GATEWAY_API_KEY（subset 走 AI Gateway 选上下文）') ||
    (item.llmFull && !opts.llmFull && '需要 --llm-full') ||
    (item.needsSql && state.fence !== 'sql' && `查询引擎是 ${state.fence ?? '未知'}，不是 SQL`) ||
    item.skip?.(state) ||
    null;

  if (skipReason) {
    results.push({ name: item.name, status: 'SKIP', ms: 0, note: skipReason });
    console.log(`  ${yellow('SKIP')}  ${item.name} ${dim(`(${skipReason})`)}`);
    continue;
  }

  const timeout = item.timeout ?? (item.needsKey ? llmTimeout : opts.timeout);
  const args = typeof item.args === 'function' ? item.args(state) : item.args;
  const stdin = typeof item.stdin === 'function' ? item.stdin(state) : item.stdin;
  const result = await run(AVA, args, { timeout, stdin });

  let problems;
  try {
    problems = item.check(result, state);
  } catch (error) {
    problems = [`校验抛错: ${error.message}`];
  }

  const failed = problems.length > 0;
  const logDir =
    opts.artifacts === 'all'
      ? logsDir
      : failed && opts.artifacts === 'summary'
        ? failuresDir
        : null;

  if (logDir) {
    mkdirSync(logDir, { recursive: true });
    const base = join(logDir, safeName(item.name));
    writeFileSync(`${base}.cmd.txt`, `${AVA.label} ${args.join(' ')}\n`);
    writeFileSync(`${base}.out.txt`, result.stdout);
    if (result.stderr.trim()) writeFileSync(`${base}.err.txt`, result.stderr);
  }

  if (!failed) {
    results.push({ name: item.name, status: 'PASS', ms: result.ms });
    console.log(`  ${green('PASS')}  ${item.name} ${dim(`${result.ms}ms`)}`);
  } else {
    results.push({
      name: item.name,
      status: 'FAIL',
      ms: result.ms,
      problems,
      args,
      stdout: cap(result.stdout),
      stderr: cap(result.stderr),
    });
    console.log(`  ${red('FAIL')}  ${item.name} ${dim(`${result.ms}ms`)}`);
    for (const problem of problems) console.log(`        ${red('·')} ${problem}`);
  }
}

/* -- clean up any leftover throwaway dataset -------------------------- */

if (state.tempId && !state.tempDisposed) {
  const cleanup = await run(AVA, ['dispose', state.tempId], { timeout: 15_000 });
  if (cleanup.code === 0) console.log(dim(`\n清理临时数据集 ${state.tempId}`));
}

/* -- work dir cleanup -------------------------------------------------- */

if (opts.artifacts !== 'none' && existsSync(chartsDir) && readdirSync(chartsDir).length === 0) {
  rmSync(chartsDir, { recursive: true, force: true });
}

if (opts.keepWork) {
  console.log(dim(`\nWork dir kept: ${work}`));
} else {
  rmSync(work, { recursive: true, force: true });
}

/* -- summary ----------------------------------------------------------- */

const passed = results.filter((item) => item.status === 'PASS').length;
const failed = results.filter((item) => item.status === 'FAIL').length;
const skipped = results.filter((item) => item.status === 'SKIP').length;
const totalMs = results.reduce((sum, item) => sum + item.ms, 0);
const chartCount = existsSync(chartsDir) ? readdirSync(chartsDir).length : 0;
const chartFiles = chartCount ? readdirSync(chartsDir).sort() : [];
const extras = [
  chartCount ? `feishu-charts/ (${chartCount})` : '',
  existsSync(failuresDir) ? 'feishu-failures/' : '',
  existsSync(logsDir) ? 'feishu-logs/' : '',
].filter(Boolean);

console.log(
  `\n${bold('Summary')}  ${results.length} cases · ${green(`${passed} passed`)} · ${red(
    `${failed} failed`
  )} · ${yellow(`${skipped} skipped`)} · ${(totalMs / 1000).toFixed(1)}s`
);
console.log(dim(`Artifacts: ${out}${extras.length ? ` · ${extras.join(' · ')}` : ''}`));

writeFileSync(
  join(out, 'feishu-summary.json'),
  JSON.stringify(
    {
      datasetId: state.id,
      ava: AVA.label,
      llm: opts.llm,
      fence: state.fence,
      startedAt: stamp,
      totalMs,
      passed,
      failed,
      skipped,
      artifacts: {
        mode: opts.artifacts,
        charts: chartCount ? chartsDir : null,
        chartFiles,
        failures: existsSync(failuresDir) ? failuresDir : null,
        logs: existsSync(logsDir) ? logsDir : null,
        work: opts.keepWork ? work : null,
      },
      results,
    },
    null,
    2
  )
);

process.exitCode = failed > 0 ? 1 : 0;
