/**
 * MongoDB loader: ATTACH a MongoDB database through the DuckDB mongo community
 * extension and register one view per collection so the LLM can query it with
 * SQL just like any other DuckDB data source.
 * https://duckdb.org/community_extensions/extensions/mongo
 *
 * Known limitations:
 * - **No indexes or constraints**: The extension does not map MongoDB indexes to
 *   duckdb_indexes()/duckdb_constraints(), so schema.indexes and schema.relations
 *   are always empty. Pushed-down filters still use indexes server-side; the gap
 *   is that the LLM cannot see them for query planning.
 * - **No remote catalog query**: The extension exposes only mongo_scan (data) and
 *   mongo_clear_cache — no listIndexes/listCollections equivalent. Validator
 *   $jsonSchema and collection options are unreachable from DuckDB SQL.
 * - **Schema is inferred, not declared**: Fields and types are inferred by sampling
 *   documents (default 100), so all columns are nullable=true and rarely-occurring
 *   fields may be missed.
 */

import { getDuckDBSchema } from '../util/schema';
import { sqlIdentifier, sqlStringLiteral } from '../../util/sql';

import type { LoadedSource, MongoDBSourceOptions } from '../../types';

const ATTACH_ALIAS = 'mongo_source';
const noopCleanup = async (): Promise<void> => {};

/**
 * Build a DuckDB mongo connection string from structured fields.
 * Produces the key-value format: `host=… port=… user=… password=… dbname=… …`
 */
function buildKeyValueString(options: MongoDBSourceOptions): string {
  const parts: Array<[string, string]> = [['host', options.host ?? 'localhost']];
  parts.push(['port', String(options.port ?? 27017)]);
  if (options.user) parts.push(['user', options.user]);
  if (options.password) parts.push(['password', options.password]);
  parts.push(['dbname', options.database]);
  if (options.authSource) parts.push(['authsource', options.authSource]);
  if (options.srv) parts.push(['srv', 'true']);
  if (options.tls || options.ssl) parts.push(['tls', 'true']);
  if (options.tlsCAFile) parts.push(['tls_ca_file', options.tlsCAFile]);
  if (options.tlsAllowInvalidCertificates) parts.push(['tls_allow_invalid_certificates', 'true']);
  return parts.map(([key, value]) => `${key}=${value}`).join(' ');
}

/**
 * Resolve a connection string from the two supported modes:
 * 1. If `connection` (advanced string) is provided, use it directly —
 *    appending `dbname=<database>` only when it doesn't already specify one.
 * 2. Otherwise, build a key-value string from the structured fields.
 */
function buildConnectionString(options: MongoDBSourceOptions): string {
  const { connection, database } = options;
  if (connection) {
    if (/(?:^|\s)(?:db|dbname|database)=/i.test(connection)) return connection;
    if (/^mongodb(?:\+srv)?:\/\//i.test(connection)) {
      const url = new URL(connection);
      if (url.pathname && url.pathname !== '/') return connection;
      url.pathname = `/${database}`;
      return url.toString();
    }
    return `${connection}${/\s$/.test(connection) ? '' : ' '}dbname=${database}`;
  }
  return buildKeyValueString(options);
}

export async function loadMongoDB(options: MongoDBSourceOptions): Promise<LoadedSource> {
  let tableNames: string[] = [];

  return {
    register: async (conn) => {
      await conn.run('INSTALL mongo FROM community');
      await conn.run('LOAD mongo');
      await conn.run('SET mongo_enable_direct_scan = false');
      await conn.run(
        `ATTACH ${sqlStringLiteral(buildConnectionString(options))} AS ${ATTACH_ALIAS} (TYPE MONGO)`
      );

      const tablesReader = await conn.runAndReadAll(
        `SELECT table_name FROM information_schema.tables
         WHERE table_catalog = ${sqlStringLiteral(ATTACH_ALIAS)}
           AND table_schema = ${sqlStringLiteral(options.database)}
         ORDER BY table_name`
      );
      tableNames = tablesReader.getRowObjectsJson().map((row: any) => String(row.table_name));

      for (const table of tableNames) {
        await conn.run(
          `CREATE OR REPLACE VIEW ${sqlIdentifier(table)} AS SELECT * FROM ${sqlIdentifier(
            ATTACH_ALIAS
          )}.${sqlIdentifier(options.database)}.${sqlIdentifier(table)}`
        );
      }
      return tableNames;
    },
    getSchema: (conn) => getDuckDBSchema(conn, tableNames),
    allowedDirectories: [],
    cleanup: noopCleanup,
  };
}
