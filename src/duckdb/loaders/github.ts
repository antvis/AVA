import { githubOptionsSchema } from '../../contracts/source/github';
import { sqlIdentifier, sqlQualifiedName, sqlStringLiteral } from '../../util/sql';
import { getDuckDBSchema } from '../util/schema';

import { GitHubClient, GitHubError } from './github/client';
import { githubSince, parseRepository } from './github/config';
import { convertItem, issuesTable, pullRequestsTable, utc } from './github/convert';

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

async function createTable(
  conn: DuckDBConnection,
  table: GitHubTable,
  rows: GitHubRow[],
  namespace?: string
): Promise<void> {
  const name = sqlQualifiedName(table.name, namespace);
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
  const cutoff = utc(since);
  const maxRecords = options.maxRecords ?? 10000;
  const client = new GitHubClient(options.token, options.timeoutMs ?? 60000);
  const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues`;
  const tooMany = `${owner}/${name} has more than ${maxRecords} issues and pull requests${
    since ? ` that are open or updated since ${since}` : ''
  }`;

  // Convert immediately so only the selected fields survive pagination. A repeated item
  // keeps its later state, including an item that closed between the two scans.
  const records = new Map<number, ReturnType<typeof convertItem>>();
  const append = (item: unknown) => {
    const record = convertItem(item);
    if (cutoff && record.row.state === 'closed' && record.row.updated_at < cutoff) {
      records.delete(record.row.number);
      return;
    }
    records.set(record.row.number, record);
    if (records.size > maxRecords) {
      throw new GitHubError(`${tooMany}. Set a later "since", or raise "maxRecords".`);
    }
  };

  if (since) {
    // Start one second earlier so GitHub's strict cutoff also covers the first request's second.
    const startedAt = githubSince(new Date(Date.now() - 1000).toISOString());
    await client.forEachItem(path, { state: 'open' }, append);
    // Fetch both states to catch an item reopened after the first scan.
    await client.forEachItem(path, { state: 'all', since: since < startedAt ? since : startedAt }, append);
  } else {
    await client.forEachItem(path, { state: 'all' }, append);
  }

  const rows: Record<GitHubTable['name'], GitHubRow[]> = { issues: [], pull_requests: [] };
  for (const { table, row } of records.values()) rows[table].push(row);

  const tableNames = [issuesTable.name, pullRequestsTable.name];
  return {
    register: async (conn, namespace) => {
      await createTable(conn, issuesTable, rows.issues, namespace);
      await createTable(conn, pullRequestsTable, rows.pull_requests, namespace);
      return tableNames;
    },
    getSchema: (conn, namespace) => getDuckDBSchema(conn, tableNames, namespace),
    allowedPaths: [],
    cleanup: async () => {},
  };
}
