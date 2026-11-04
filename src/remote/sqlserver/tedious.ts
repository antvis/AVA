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
        for (const cell of metadata) columns.push({ name: cell.colName ?? '', type: typeName(cell) });
      });

      request.on('row', (row) => {
        const record: Record<string, unknown> = {};
        // Tedious emits an array of cells; the column name lives in each
        // cell's metadata (not in the array index).
        row.forEach((cell, index) => {
          const name = cell.metadata?.colName ?? columns[index]?.name ?? String(index);
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
