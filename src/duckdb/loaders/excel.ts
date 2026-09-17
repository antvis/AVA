/**
 * Excel loader: read an .xlsx workbook (local path or http(s) URL) through
 * DuckDB's excel extension, registering one view per sheet.
 * https://duckdb.org/docs/current/core_extensions/excel
 */

import { dirname } from 'node:path';

import AdmZip from 'adm-zip';

import { downloadToTempFile, removeTempFile } from '../../util/file';
import { escapeSql, sqlIdentifier, sqlStringLiteral } from '../../util/sql';

import type { ExcelSourceOptions, LoadedSource } from '../../types';

const noopCleanup = async (): Promise<void> => {};

/** Extract sheet names from an .xlsx file's xl/workbook.xml */
function readSheetNames(filePath: string): string[] {
  const workbookEntry = new AdmZip(filePath).getEntry('xl/workbook.xml');
  if (!workbookEntry) {
    throw new Error(`Not a valid .xlsx file (missing xl/workbook.xml): ${filePath}`);
  }
  const xml = workbookEntry.getData().toString('utf8');
  const names = [...xml.matchAll(/<sheet\b[^>]*\bname="([^"]*)"/g)].map((m) => m[1]);
  if (names.length === 0) {
    throw new Error(`Excel workbook has no sheets: ${filePath}`);
  }
  return names;
}

export async function loadExcel(options: ExcelSourceOptions): Promise<LoadedSource> {
  const { path: sourcePath, headers } = options;

  // Remote file — download to a temp file first (DuckDB stays offline)
  const isRemote = /^https?:\/\//.test(sourcePath);
  const filePath = isRemote ? await downloadToTempFile(sourcePath, 'xlsx', headers) : sourcePath;
  const cleanup = isRemote ? () => removeTempFile(filePath) : noopCleanup;

  return {
    register: async (conn) => {
      // The excel extension is dynamically loaded, not statically linked like
      // mysql/postgres, so it must be installed explicitly. EXTENSION_LOCKDOWN
      // only blocks *auto*-install; an explicit INSTALL of a known official
      // extension is allowed and is idempotent (a no-op once installed). This
      // keeps CI (fresh ~/.duckdb) working the same as a local machine.
      await conn.run('INSTALL excel');
      await conn.run('LOAD excel');
      const sheetNames = readSheetNames(filePath);
      for (const sheet of sheetNames) {
        await conn.run(
          `CREATE OR REPLACE VIEW ${sqlIdentifier(sheet)} AS SELECT * FROM read_xlsx('${escapeSql(
            filePath
          )}', sheet=${sqlStringLiteral(sheet)})`
        );
      }
      return sheetNames;
    },
    allowedDirectories: [dirname(filePath)],
    cleanup,
  };
}
