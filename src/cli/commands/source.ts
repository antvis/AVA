import { resolve } from 'path';

import { inferFileSourceType } from '../../util/source';
import { isGitHubRepositoryUrl } from '../../duckdb/loaders/github/config';
import { createSession } from '../session/client';
import { engineTypeSchema } from '../session/protocol';
import { sourceInputSchema } from '../../contracts';
import { isFeishuBitableUrl, isFeishuHostUrl, feishuCredentials } from '../feishu';
import { llmConfig } from '../config';
import { readJSON } from '../io';
import { option } from '../options';
import { accent, badge, muted } from '../util';

import type { Options } from '../options';
import type { DataSourceConfig } from '../../types';

export const description = 'Load one or more sources and return a dataset ID';

export const definition = {
  positionals: { min: 1 },
  options: {
    type: { type: 'string', short: 't' },
    engine: { type: 'string' },
  },
} as const;

async function parseSourceArgument(dataset: string, options: Options): Promise<DataSourceConfig> {
  let input: unknown;

  if (dataset.startsWith('@') || dataset === '-') {
    if (options.type !== undefined) throw new Error('--type cannot be combined with a source config.');
    input = await readJSON(dataset);
  } else if (isFeishuBitableUrl(dataset)) {
    if (options.type !== undefined) throw new Error('--type cannot be combined with a feishu-bitable source.');
    input = { type: 'feishu-bitable', options: { url: dataset } };
  } else if (isFeishuHostUrl(dataset)) {
    throw new Error(
      'Only Feishu Bitable links are supported: /base/<appToken>?table=<tableId> or /wiki/<nodeToken>?table=<tableId>. Docx, Sheets, and other Feishu links cannot be loaded.'
    );
  } else if (isGitHubRepositoryUrl(dataset)) {
    if (options.type !== undefined) throw new Error('--type cannot be combined with a GitHub repository link.');
    input = { type: 'github', options: { repository: dataset } };
  } else {
    const type = option(options, 'type') ?? inferFileSourceType(dataset);
    if (!type) {
      if (/^https?:\/\/(www\.)?github\.com(\/|$)/i.test(dataset)) {
        throw new Error(
          'Only GitHub repository links are supported: https://github.com/<owner>/<repo>, or its /issues or /pulls page.'
        );
      }
      throw new Error('Cannot infer the source type. Pass --type.');
    }
    input = type === 'github' ? { type, options: { repository: dataset } } : { type, options: { path: dataset } };
  }

  const config = sourceInputSchema.parse(input);

  if (
    'path' in config.options &&
    typeof config.options.path === 'string' &&
    !/^https?:\/\//i.test(config.options.path)
  ) {
    config.options.path = resolve(config.options.path);
  }

  if (config.type === 'feishu-bitable') {
    const creds = await feishuCredentials(config.options);
    config.options.appId = creds.appId;
    config.options.appSecret = creds.appSecret;
  }

  if (config.type === 'github' && config.options.token === undefined) {
    const token = process.env.GH_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();
    if (token) config.options.token = token;
  }

  return config;
}

export async function run(datasets: string[], options: Options): Promise<{ datasetId: string }> {
  const engine = engineTypeSchema.optional().parse(option(options, 'engine'));
  if (datasets.indexOf('-') !== datasets.lastIndexOf('-')) {
    throw new Error('Use - at most once to read a source configuration from stdin.');
  }

  const sources: DataSourceConfig[] = [];
  for (const dataset of datasets) {
    sources.push(await parseSourceArgument(dataset, options));
  }

  if (engine !== undefined && engine !== 'duckdb' && sources.some(({ type }) => type === 'github')) {
    throw new Error('GitHub sources require the duckdb engine.');
  }

  return createSession(sources, llmConfig(sources.some(({ type }) => type === 'text')), engine);
}

/**
 * Guide terminal users through the next steps with their newly loaded dataset.
 */
export function formatResult({ datasetId }: { datasetId: string }): string {
  return `${accent('✦')} ${badge('AVA')} Ready to explore · ${accent(datasetId)}

${muted('View schema:')} ${accent(`ava schema ${datasetId}`)} ${muted('· More commands:')} ${accent('ava --help')}`;
}

export const help = `${description}.

Usage:
  ava source <dataset> [dataset...] [options]

Arguments:
  dataset           File/URL, @file containing a source config, or - for stdin.
                    Pass multiple inputs to load them into the same dataset.
                    Use - at most once per command.
                    Config format: { "type": "json", "options": { "data": [] } }
                    Relative paths resolve from the current working directory.

Options:
  -t, --type <type>  Set the type for all file paths, file URLs, or repository names.
                    Types: csv-file, json-file, parquet, excel, sqlite, github.
                    With github, dataset is owner/name.
                    Cannot be used with @file, stdin configs, Feishu or GitHub repository URLs.
  --engine <type>    duckdb, python, javascript, supabase, clickhouse, sqlserver, or snowflake.
                    Default: supabase/clickhouse/sqlserver/snowflake for those sources, otherwise duckdb.
                    Fixed for the session. Multiple sources require DuckDB.
                    feishu-bitable uses duckdb. The loaded view is named data.
  -h, --help         Show help.

Feishu Bitable:
  A /base/ or /wiki/ link from feishu.cn or larksuite.com is detected automatically:
    ava source "https://my.feishu.cn/base/<appToken>?table=<tableId>"
    ava source "https://my.feishu.cn/wiki/<nodeToken>?table=<tableId>"
  A wiki node is resolved to the Bitable it hosts, so the app also needs wiki
  read access and membership of the wiki space.
  Without ?table=, AVA uses the only table of the Bitable and lists the tables
  when there are several. Or pass a "feishu-bitable" config via @file or stdin.
  appId and appSecret are required. They are resolved from the config first,
  then AVA_FEISHU_APP_ID / AVA_FEISHU_APP_SECRET, then ~/.ava/feishu.json;
  in a terminal AVA offers to bind and save them.
  The whole table is loaded as one view named data; the view query is ignored.
  Docx and Sheets links are not supported.

Snowflake:
  Pass a "snowflake" config via @file or stdin (see snowflake.json below).
  Queries run in Snowflake on the given warehouse. Discovery covers one schema
  (default PUBLIC) and lists only tables and views the role can access, so
  connect with a read-only role. Key-pair authentication (SNOWFLAKE_JWT with
  privateKeyPath) keeps secrets out of the config; other snowflake-sdk
  connection options, such as PROGRAMMATIC_ACCESS_TOKEN or OAUTH with token,
  are passed through. queryTimeoutMs (default 30000) limits each statement.

Environment:
  OPENAI_API_KEY     Required for text sources and subsequent AI commands.
  OPENAI_MODEL       Model name (default: gpt-4o-mini).
  OPENAI_BASE_URL    Optional API base URL.
  GH_TOKEN           GitHub token for github sources; GITHUB_TOKEN is read next.
  AVA_FEISHU_APP_ID      Feishu app credentials for feishu-bitable sources.
  AVA_FEISHU_APP_SECRET
  Model settings are fixed when the dataset is loaded.

In a terminal, shows the dataset ID and suggested next commands.
When piped or redirected, returns JSON containing datasetId.
Each call creates a new session with a new dataset ID.
Requires Node.js 22.13+.
Sessions expire after 30 idle minutes; dispose releases them immediately.
Python requires python3 and pandas; local Python execution is not sandboxed.
JavaScript accepts inline csv/json/text configs. Use ava schema to inspect the query language.

Examples:
  ava source sales.csv
  ava source sales.csv customers.json costs.xlsx
  ava source sales.csv --engine python
  ava source @source.json
  echo '{ "type": "json", "options": { "data": [{ "sales": 10 }] } }' | ava source -
  ava source "https://my.feishu.cn/base/<appToken>?table=<tableId>"
  ava source "https://my.feishu.cn/wiki/<nodeToken>?table=<tableId>"
  ava source @feishu.json
  ava source @sqlserver.json
  ava source @snowflake.json
  ava source https://github.com/antvis/AVA

SQL Server:
  Pass a "sqlserver" config via @file or stdin; its engine is selected automatically.
  Required options: host, database, user, password. Use a read-only SQL login.
  TLS certificate verification is enabled by default. Queries use T-SQL.

feishu.json:
{
  "type": "feishu-bitable",
  "options": {
    "url": "https://my.feishu.cn/base/<appToken>?table=<tableId>",
    "appId": "<app-id>",
    "appSecret": "<app-secret>"
  }
}
    Provide url or both appToken and tableId; they must name the same table.
    Keep appSecret out of version control and logs.

snowflake.json:
{
  "type": "snowflake",
  "options": {
    "account": "<orgname>-<account_name>",
    "username": "<user>",
    "authenticator": "SNOWFLAKE_JWT",
    "privateKeyPath": "<path-to-rsa_key.p8>",
    "warehouse": "<warehouse>",
    "role": "<read-only-role>",
    "database": "<database>",
    "schema": "<schema>"
  }
}

GitHub (Node.js / DuckDB):
  A github.com repository link, or its /issues or /pulls page, is detected automatically;
  owner/name works with --type github. Loads the tables issues and pull_requests (read-only).
  Public repositories need no token, but unauthenticated requests share 60 per hour per IP.
  github.json:
    { "type": "github", "options": { "repository": "antvis/AVA", "since": "2026-01-01" } }
  since keeps every open item and the closed ones updated since then (UTC).
  More than maxRecords distinct items (default 10000) fail the load.
  Response bodies are capped at 16 MiB each and 64 MiB per load.
`;
