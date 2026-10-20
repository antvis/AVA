#!/usr/bin/env node
/**
 * ava-chart — one command: natural-language question (or raw SQL) → chart HTML.
 *
 * Pipeline per run:
 *   1. `ava analyze <dataset> "<question>"`  (LLM writes SQL, DuckDB runs it)
 *      — or `ava query <dataset> --dsl "<sql>"` when --sql is given (no LLM)
 *   2. `ava visualize --query "<chart request>" --data @rows.json --output <html>`
 *
 * Usage:
 *   node scripts/ava-chart.mjs <dataset-id> "按类别统计总金额"
 *   node scripts/ava-chart.mjs <dataset-id> --sql "SELECT 1" --chart "用饼图展示"
 *   node scripts/ava-chart.mjs <dataset-id> "月度趋势" --chart "用折线图展示" --open
 *
 * Options:
 *   --sql <dsl>       Skip the LLM; run this SQL directly with `ava query`.
 *   --chart <text>    Chart request for `ava visualize` (default: the question,
 *                     or a generic "choose a suitable chart" for --sql).
 *   --out <dir|file>  Output dir (default ./.ava-charts) or an explicit .html path.
 *   --max-rows <n>    Row cap passed to analyze/query result (default 200).
 *   --ava <cmd>       CLI to run (default $AVA_BIN, else `ava`, else node lib/cli/index.js).
 *   --env <file>      Env file to load (default ./.env, then <repo>/.env).
 *   --open            Open the generated HTML (macOS `open`).
 *   -h, --help        Show this help.
 *
 * Notes:
 *   - `ava analyze` needs OPENAI_API_KEY exported (this script loads .env for you).
 *   - The model config is captured when a dataset session is created by `ava source`;
 *     if AI commands fail with AI_APICallError, reload the dataset.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

const HELP = `ava-chart — 一句话（或一段 SQL）直接出图

Usage:
  node scripts/ava-chart.mjs <dataset-id> "<问题>" [options]

Options:
  --sql <dsl>       跳过模型，直接用 ava query 执行这段 SQL
  --chart <text>    图表要求，交给 ava visualize（默认复用问题本身）
  --out <dir|file>  输出目录（默认 ./.ava-charts）或明确的 .html 路径
  --max-rows <n>    analyze 取回的最大行数（默认 200）
  --ava <cmd>       要调用的 CLI（默认 $AVA_BIN，其次 ava，最后 node lib/cli/index.js）
  --env <file>      要加载的 env 文件（默认 ./.env，其次 <repo>/.env）
  --open            生成后自动打开（macOS）
  -h, --help        显示帮助

Examples:
  node scripts/ava-chart.mjs ds_feishu-bitable_xxx "按类别统计总金额，从高到低"
  node scripts/ava-chart.mjs ds_feishu-bitable_xxx "按月份看金额趋势" --chart "用折线图展示"
  node scripts/ava-chart.mjs ds_feishu-bitable_xxx --sql "SELECT 1 AS value" --chart "用饼图展示"
`;

/* ------------------------------------------------------------------ */
/* args                                                                */
/* ------------------------------------------------------------------ */

function parse(argv) {
  const opts = {};
  const args = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      args.push(arg);
      continue;
    }
    if (arg === '-h' || arg === '--help') return { help: true };
    if (arg === '--open') {
      opts.open = true;
      continue;
    }

    const key = arg.replace(/^--/, '');
    const value = argv[i + 1];
    if (value === undefined) die(`选项 ${arg} 缺少值`);
    opts[key] = value;
    i += 1;
  }

  return { opts, args };
}

function die(message) {
  console.error(`✖ ${message}`);
  process.exit(2);
}

/* ------------------------------------------------------------------ */
/* runtime resolution                                                  */
/* ------------------------------------------------------------------ */

/** Major version of a node binary, or 0 when it cannot be probed. */
function nodeMajor(bin) {
  const probe = spawnSync(bin, ['-p', 'process.versions.node'], { encoding: 'utf8' });
  if (probe.status !== 0) return 0;
  return Number(probe.stdout.trim().split('.')[0]) || 0;
}

/**
 * `lib/cli/index.js` is CommonJS but depends on the ESM-only `ai` package,
 * so it needs require(esm) — Node >= 22.12. Prefer the current node, else a
 * newer one from nvm.
 */
function pickNode() {
  if (process.env.AVA_NODE) return process.env.AVA_NODE;
  if (nodeMajor(process.execPath) >= 22) return process.execPath;

  const roots = [join(homedir(), '.nvm/versions/node'), '/usr/local/nvm/versions/node'];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const candidates = readdirSync(root)
      .filter((name) => Number(name.replace(/^v/, '').split('.')[0]) >= 22)
      .sort((a, b) => Number(b.slice(1).split('.')[0]) - Number(a.slice(1).split('.')[0]));
    for (const name of candidates) {
      const bin = join(root, name, 'bin/node');
      if (existsSync(bin) && nodeMajor(bin) >= 22) return bin;
    }
  }

  return process.execPath;
}

/** Resolve the ava CLI into { node, entry } so children run on a working node. */
function pickAva(explicit) {
  const custom = explicit ?? process.env.AVA_BIN;
  const localEntry = join(REPO, 'lib/cli/index.js');

  if (custom) {
    return custom.endsWith('.js') || custom.endsWith('.mjs')
      ? { node: pickNode(), entry: resolve(custom) }
      : { node: null, entry: custom };
  }

  const found = spawnSync('ava', ['--help'], { encoding: 'utf8' });
  if (found.status === 0) return { node: null, entry: 'ava' };

  if (existsSync(localEntry)) return { node: pickNode(), entry: localEntry };

  die('找不到 ava：没有 $AVA_BIN、也没有全局 ava、仓库里也没有 lib/cli/index.js');
}

function run(ava, args, extraEnv) {
  const command = ava.node ? ava.node : ava.entry;
  const argv = ava.node ? [ava.entry, ...args] : args;

  const result = spawnSync(command, argv, {
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
    maxBuffer: 32 * 1024 * 1024,
  });

  if (result.error) die(`运行失败: ${result.error.message}`);

  if (result.status !== 0) {
    const stderr = (result.stderr || result.stdout || '').trim();
    const hint = /AI_APICallError|Failed after \d+ attempts/i.test(stderr)
      ? '\n提示：会话的模型配置在 `ava source` 加载数据集时就固定了。' +
        'AI 命令报错通常是那时环境变量不对，重新 `ava source` 一次即可。'
      : '';
    die(`${args[0]} 执行失败 (exit ${result.status}):\n${stderr}${hint}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    die(`ava ${args[0]} 返回的不是 JSON:\n${result.stdout.slice(0, 500)}`);
  }
}

/* ------------------------------------------------------------------ */
/* env                                                                 */
/* ------------------------------------------------------------------ */

/** Parse KEY=VALUE lines (quotes and `#` comments tolerated) without overriding. */
function loadEnv(file) {
  if (!file || !existsSync(file)) return 0;
  let loaded = 0;

  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || line.trim().startsWith('#')) continue;

    const [, key, raw] = match;
    const value = raw.replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded += 1;
    }
  }

  return loaded;
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

const { help, opts, args } = parse(process.argv.slice(2));
if (help) {
  process.stdout.write(HELP);
  process.exit(0);
}

if (args.length === 0) die(`缺少 dataset-id\n\n${HELP}`);

const datasetId = args[0];
const question = args.slice(1).join(' ').trim();
const sql = opts.sql?.trim();

if (!question && !sql) die('需要一个自然语言问题，或用 --sql 给一段 SQL');
if (question && sql) die('问题 和 --sql 只能二选一');

const envFile = opts.env
  ? resolve(opts.env)
  : existsSync(join(process.cwd(), '.env'))
    ? join(process.cwd(), '.env')
    : existsSync(join(REPO, '.env'))
      ? join(REPO, '.env')
      : null;

const envLoaded = loadEnv(envFile);
if (!process.env.OPENAI_API_KEY) console.warn('! OPENAI_API_KEY 未设置，AI 命令会失败');

const ava = pickAva(opts.ava);
const avaLabel = ava.node ? `${ava.node} ${ava.entry}` : ava.entry;

console.log(`› dataset  ${datasetId}`);
console.log(`› ava      ${avaLabel}`);
if (envFile) console.log(`› env      ${envFile} (+${envLoaded})`);

/* 1. rows + sql ------------------------------------------------------- */

let rows;
let usedSql;
let rowCount;

if (sql) {
  const result = run(ava, ['query', datasetId, '--dsl', sql]);
  rows = result.data ?? [];
  usedSql = sql;
  rowCount = rows.length;
  console.log('› 模式     直接执行 SQL（不调用模型）');
} else {
  console.log(`› 问题     ${question}`);
  const result = run(ava, [
    'analyze',
    datasetId,
    question,
    '--max-rows',
    String(opts['max-rows'] ?? 200),
  ]);
  rows = result.data ?? [];
  usedSql = result.sql ?? null;
  rowCount = rows.length;
}

if (!Array.isArray(rows) || rows.length === 0) {
  die('查询结果为空，无法出图。换个问题或检查 --sql');
}

console.log(`› SQL      ${usedSql ? usedSql.replace(/\s+/g, ' ').trim() : '(analyze 未返回 sql)'}`);
console.log(`› 数据     ${rowCount} 行 · ${Object.keys(rows[0] ?? {}).join(', ')}`);

/* 2. chart ------------------------------------------------------------ */

const chartRequest = opts.chart ?? question ?? '根据这些数据选择一个合适的图表展示';
const outDir = opts.out?.endsWith('.html') ? null : resolve(opts.out ?? join(process.cwd(), '.ava-charts'));
mkdirSync(outDir ?? dirname(resolve(opts.out)), { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const output = opts.out?.endsWith('.html')
  ? resolve(opts.out)
  : join(outDir, `chart-${stamp}.html`);

if (existsSync(output)) die(`${output} 已存在（ava 不覆盖已有 HTML），换个 --out`);

const rowsFile = join(outDir ?? dirname(output), `rows-${stamp}.json`);
writeFileSync(rowsFile, JSON.stringify(rows));

const rendered = run(ava, [
  'visualize',
  '--query',
  chartRequest,
  '--data',
  `@${rowsFile}`,
  '--output',
  output,
]);

if (!rendered) die('模型没有给出图表建议（visualize 返回 null）');

console.log(`› 图表     ${rendered.chartType}`);
console.log(`› 输出     ${output}`);

if (opts.open) spawnSync(shellOpen(), [output], { stdio: 'ignore' });

function shellOpen() {
  return process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
}
