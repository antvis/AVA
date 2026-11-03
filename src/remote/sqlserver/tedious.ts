/**
 * SQL Server connector built on the `tedious` TDS driver. Statements always
 * run through a connection locked to the configured database with
 * ApplicationIntent=ReadOnly. Because the login may still own write
 * privileges, SqlServerEngine additionally validates each statement as a
 * single read-only SELECT before it reaches this connector.
 *
 * The tedious package is loaded lazily via `require()` so this module
 * type-checks and is exercised by tests even where the bindings are optional;
 * tests stub the module with `vi.mock`.
 */
import { resolveTdsConfig } from './tds-config';

import type { SqlServerSourceOptions } from '../../types';
import type { QueryColumnMeta, QueryConnector, QueryResult, QueryResultRow } from './connector';

/** Structural subset of the tedious connection and request objects. */
interface TediousCell {
  value: unknown;
  type?: { name?: string };
  typeName?: string;
}

interface TediousConnection {
  connect(cb: (error?: Error) => void): void;
  execSql(request: TediousRequest): void;
  close(): void;
  closed: boolean;
  on(event: 'end', cb: () => void): unknown;
}

type TediousRequestCtor = new (sql: string, cb: (error?: Error, rowCount?: number) => void) => TediousRequest;

interface TediousRequest {
  on(event: 'columnMetadata', cb: (columns: TediousCell[]) => void): unknown;
  on(event: 'row', cb: (row: Record<string, TediousCell>) => void): unknown;
}

interface TediousModule {
  Connection: new (config: unknown) => TediousConnection;
  Request: TediousRequestCtor;
}

let cachedModule: TediousModule | null | undefined;

/** Load (and cache) the tedious bindings, throwing a clear error when absent. */
function loadTedious(): TediousModule {
  if (cachedModule !== undefined) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedModule = require('tedious') as TediousModule;
  } catch {
    throw new Error(
      'SQL Server adapter requires the optional "tedious" dependency. ' +
        'Install it (npm i tedious) or set adapter: "mock" to use the in-memory connector.'
    );
  }
  return cachedModule;
}

function typeName(cell: TediousCell): string {
  return cell.type?.name ?? cell.typeName ?? 'sql_variant';
}

export class TediousQueryConnector implements QueryConnector {
  private readonly options: SqlServerSourceOptions;
  private connection: TediousConnection | null = null;

  constructor(options: SqlServerSourceOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.connection && !this.connection.closed) return;

    const config = resolveTdsConfig(this.options);
    const { Connection } = loadTedious();
    const connection = new Connection(config);

    const ok = await new Promise<boolean>((resolve) => {
      connection.connect((error) => resolve(!error));
    });

    if (!ok) {
      throw new Error(`Failed to connect to SQL Server: ${config.server}`);
    }
    this.connection = connection;
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult & { rows: T[] }> {
    await this.connect();
    const { Request } = loadTedious();
    const connection = this.connection!;

    return new Promise<QueryResult & { rows: T[] }>((resolve, reject) => {
      const columns: QueryColumnMeta[] = [];
      const rows: T[] = [];

      const request = new Request(sql, (error) => {
        if (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
          return;
        }
        resolve({ columns, rows });
      });

      request.on('columnMetadata', (metadata) => {
        for (const cell of metadata) columns.push({ name: cell.typeName ?? '', type: typeName(cell) });
      });

      request.on('row', (row) => {
        const record: Record<string, unknown> = {};
        for (const key of Object.keys(row)) record[key] = row[key].value;
        rows.push(record as T);
      });

      connection.execSql(request);
    });
  }

  async close(): Promise<void> {
    if (!this.connection) return;
    const connection = this.connection;
    this.connection = null;
    if (connection.closed) return;

    await new Promise<void>((resolve) => {
      connection.on('end', () => resolve());
      try {
        connection.close();
      } catch {
        resolve();
      }
    });
  }
}