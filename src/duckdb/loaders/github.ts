import { githubOptionsSchema } from '../../contracts/source/github';
import { sqlIdentifier, sqlStringLiteral } from '../../util/sql';
import { getDuckDBSchema } from '../util/schema';

import { GitHubClient } from './github/client';
import { githubSince, parseRepository } from './github/config';
import { convertItem, issuesTable, pullRequestsTable } from './github/convert';

import type { GitHubColumn, GitHubRow, GitHubTable } from './github/convert';
import type { DuckDBConnection, GitHubSourceOptions, LoadedSource } from '../../types';

/** Categorical columns are ENUMs, so the schema lists the values that generated SQL can use. */
function columnType(column: GitHubColumn, rows: GitHubRow[]): string {
  if (!column.values) return column.type;
  const values = new Set(column.values);
  for (const row of rows) {
    const value = row[column.name];
    if (typeof value === 'string') values.add(value);
  }
  return `ENUM(${[...values].sort().map(sqlStringLiteral).join(', ')})`;
}

async function createTable(conn: DuckDBConnection, table: GitHubTable, rows: GitHubRow[]): Promise<void> {
  const name = sqlIdentifier(table.name);
  const columns = table.columns.map(
    (column) => `${sqlIdentifier(column.name)} ${columnType(column, rows)}${column.notNull ? ' NOT NULL' : ''}`
  );
  await conn.run(`CREATE TABLE ${name} (${columns.join(', ')}, PRIMARY KEY (number))`);
  // Bind the rows and their explicit structure as parameters: no temporary files or interpolated values.
  // Categorical values are read as text and cast to the column's ENUM on insert.
  const structure = Object.fromEntries(
    table.columns.map((column) => [
      column.name,
      column.values ? 'VARCHAR' : column.type === 'VARCHAR[]' ? ['VARCHAR'] : column.type,
    ])
  );
  await conn.run(`INSERT INTO ${name} SELECT item.* FROM (SELECT unnest(from_json_strict($1::JSON, $2)) AS item)`, [
    JSON.stringify(rows),
    JSON.stringify([structure]),
  ]);
}

/** Read one repository's issues and pull requests into the tables `issues` and `pull_requests`. */
export async function loadGitHub(input: GitHubSourceOptions): Promise<LoadedSource> {
  const options = githubOptionsSchema.parse(input);
  const { owner, name } = parseRepository(options.repository);
  const since = options.since === undefined ? undefined : githubSince(options.since);
  const maxRecords = options.maxRecords ?? 10000;
  const client = new GitHubClient(options.token, options.timeoutMs ?? 60000);
  const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues`;
  const tooMany = `${owner}/${name} has more than ${maxRecords} issues and pull requests${
    since ? ` that are open or updated since ${since}` : ''
  }`;

  // The issues endpoint lists pull requests too. With since, every open item is still read, so
  // the current backlog stays complete; closed items are those updated since then.
  const items = await client.list(path, { state: since ? 'open' : 'all' }, maxRecords, tooMany);
  if (since) items.push(...(await client.list(path, { state: 'closed', since }, maxRecords - items.length, tooMany)));

  // An item read twice, for example closed while loading, keeps its later state.
  const rows = { issues: new Map<number, GitHubRow>(), pull_requests: new Map<number, GitHubRow>() };
  for (const item of items) {
    const { table, row } = convertItem(item);
    rows[table].set(row.number as number, row);
  }

  return {
    register: async (conn) => {
      await createTable(conn, issuesTable, [...rows.issues.values()]);
      await createTable(conn, pullRequestsTable, [...rows.pull_requests.values()]);
      return [issuesTable.name, pullRequestsTable.name];
    },
    getSchema: (conn) => getDuckDBSchema(conn, [issuesTable.name, pullRequestsTable.name]),
    allowedPaths: [],
    cleanup: async () => {},
  };
}
