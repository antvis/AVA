/**
 * SQL Server connector built on the `tedious` TDS driver. Statements always
 * run through a connection locked to the configured database with
 * ApplicationIntent=ReadOnly. Because the login may still own write
 * privileges, SqlServerEngine additionally validates each statement as a
 * single read-only SELECT before it reaches this connector.
 *
 * The tedious package is loaded lazily through `./tedious-loader`; tests
 * substitute a structural fake module because the driver is optional.
 */
import { loadTedious } from './tedious-loader';
import { resolveTdsConfig } from './tds-config';

import type { SqlServerSourceOptions } from '../../types';
import type { QueryColumnMeta, QueryConnector, QueryResult, QueryResultRow } from './connector';
import type { TediousCell, TediousColumnMetadata, TediousConnection } from './tedious-loader';

function typeName(value: TediousColumnMetadata | TediousCell): string {
  const metadata = 'metadata' in value ? value.metadata : undefined;
  return metadata?.type?.name ?? value.type?.name ?? value.typeName ?? 'sql_variant';
}

/** Keep duplicate aliases addressable in object rows without overwriting earlier cells. */
function uniqueColumnName(name: string | undefined, index: number, used: Set<string>): string {
  const base = name || `column_${index + 1}`;
  let unique = base;
  let suffix = 2;
  while (used.has(unique)) {
    unique = `${base}_${suffix}`;
    suffix += 1;
  }
  used.add(unique);
  return unique;
}

export class TediousQueryConnector implements QueryConnector {
  private readonly options: SqlServerSourceOptions;
  private connection: TediousConnection | null = null;
  private pendingReject: ((error: Error) => void) | null = null;

  constructor(options: SqlServerSourceOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.connection && !this.connection.closed) return;

    const config = resolveTdsConfig(this.options);
    const { Connection } = await loadTedious();
    const connection = new Connection(config);

    // Tedious emits connection-level `error` events for socket drops and
    // transient outages. Without a listener, Node treats them as unhandled and
    // terminates the process, so install one before connecting.
    connection.on('error', (error) => this.handleConnectionError(connection, error));

    try {
      await new Promise<void>((resolve, reject) => {
        // Reject connection establishment on either the callback or an early
        // connection-level error; the lifecycle listener above remains active.
        connection.on('error', reject);
        connection.connect((error) => (error ? reject(error) : resolve()));
      });
      this.connection = connection;
    } catch (error) {
      try {
        connection.close();
      } catch {
        // Ignore cleanup failures for a connection that never came up.
      }
      const detail = error instanceof Error ? `: ${error.message}` : '';
      throw new Error(`Failed to connect to SQL Server: ${config.server}${detail}`);
    }
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult & { rows: T[] }> {
    await this.connect();
    const { Request } = await loadTedious();
    const connection = this.connection!;

    return new Promise<QueryResult & { rows: T[] }>((resolve, reject) => {
      const columns: QueryColumnMeta[] = [];
      const rows: T[] = [];
      const usedColumnNames = new Set<string>();

      this.pendingReject = (error) => {
        this.pendingReject = null;
        reject(error);
      };

      const request = new Request(sql, (error) => {
        this.pendingReject = null;
        if (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
          return;
        }
        resolve({ columns, rows });
      });

      request.on('columnMetadata', (metadata) => {
        metadata.forEach((cell, index) => {
          const name = uniqueColumnName(cell.colName, index, usedColumnNames);
          columns.push({ name, type: typeName(cell) });
        });
      });

      request.on('row', (row) => {
        const record: Record<string, unknown> = {};
        const usedRowNames = new Set(usedColumnNames);
        // Tedious emits an array of cells. Decode by position using the result
        // metadata so SQL aliases become keys and duplicate aliases stay distinct.
        row.forEach((cell, index) => {
          const name = columns[index]?.name ?? uniqueColumnName(cell.metadata?.colName, index, usedRowNames);
          record[name] = cell.value;
        });
        rows.push(record as T);
      });

      connection.execSql(request);
    });
  }

  async close(): Promise<void> {
    this.pendingReject = null;
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

  /** Invalidate the failed connection and surface the error to the active call. */
  private handleConnectionError(connection: TediousConnection, error: Error): void {
    if (this.connection === connection) this.connection = null;
    const pending = this.pendingReject;
    this.pendingReject = null;
    if (pending) pending(error);
  }
}
