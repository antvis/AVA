/**
 * Excel loader: read an .xlsx workbook (local path or http(s) URL) through
 * DuckDB's excel extension, registering one view per sheet.
 * https://duckdb.org/docs/current/core_extensions/excel
 */

import { dirname } from 'node:path';

import AdmZip from 'adm-zip';
import { SaxesParser } from 'saxes';

import { excelOptionsSchema } from '../../util/excel';
import { downloadToTempFile, removeTempFile } from '../util/file';
import { getDuckDBSchema } from '../util/schema';
import { escapeSql, serializeOptions, sqlIdentifier, sqlStringLiteral } from '../../util/sql';

import type { ExcelSourceOptions, LoadedSource } from '../../types';

const noopCleanup = async (): Promise<void> => {};

/** Extract sheet names from an .xlsx file's xl/workbook.xml */
function readSheetNames(filePath: string): string[] {
  const workbookEntry = new AdmZip(filePath).getEntry('xl/workbook.xml');
  if (!workbookEntry) {
    throw new Error(`Not a valid .xlsx file (missing xl/workbook.xml): ${filePath}`);
  }
  const names: string[] = [];
  const parser = new SaxesParser({ xmlns: true });
  parser.on('doctype', () => {
    throw new Error('Excel workbook XML must not contain a DOCTYPE');
  });
  parser.on('opentag', (tag) => {
    if (tag.local !== 'sheet' || tag.uri !== 'http://schemas.openxmlformats.org/spreadsheetml/2006/main') return;
    const name = tag.attributes.name?.value;
    if (!name) throw new Error('Excel sheet is missing its name');
    names.push(name);
  });
  parser.write(workbookEntry.getData().toString('utf8')).close();
  if (names.length === 0) {
    throw new Error(`Excel workbook has no sheets: ${filePath}`);
  }
  return names;
}

export async function loadExcel(options: ExcelSourceOptions): Promise<LoadedSource> {
  const { path: sourcePath, headers, sheets } = excelOptionsSchema.parse(options);

  // Remote file — download to a temp file first (DuckDB stays offline)
  const isRemote = /^https?:\/\//.test(sourcePath);
  const filePath = isRemote ? await downloadToTempFile(sourcePath, 'xlsx', headers) : sourcePath;
  const cleanup = isRemote ? () => removeTempFile(filePath) : noopCleanup;

  let sheetNames: string[] = [];
  return {
    register: async (conn) => {
      // The excel extension is dynamically loaded, not statically linked like
      // mysql/postgres, so it must be installed explicitly. EXTENSION_LOCKDOWN
      // only blocks *auto*-install; an explicit INSTALL of a known official
      // extension is allowed and is idempotent (a no-op once installed). This
      // keeps CI (fresh ~/.duckdb) working the same as a local machine.
      await conn.run('INSTALL excel');
      await conn.run('LOAD excel');
      const available = readSheetNames(filePath);
      const selected = sheets ?? available.map((sheet) => ({ sheet, header: true }));
      sheetNames = selected.map(({ sheet }) => sheet);
      for (const sheet of sheetNames) {
        if (!available.includes(sheet)) throw new Error(`Excel sheet not found: ${sheet}`);
      }
      for (const sheet of available) {
        // shortcut: Until DuckDB fixes double decoding, reject ambiguous workbooks, including unselected sheets.
        if (/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/i.test(sheet)) {
          throw new Error(
            `DuckDB cannot safely read Excel sheet "${sheet}": rename it to remove XML entity text or use the Python engine`
          );
        }
      }
      for (const { sheet, ...readOptions } of selected) {
        await conn.run(
          `CREATE OR REPLACE VIEW ${sqlIdentifier(sheet)} AS SELECT * FROM read_xlsx('${escapeSql(
            filePath
          )}', sheet=${sqlStringLiteral(sheet)}${serializeOptions(readOptions)})`
        );
      }
      return sheetNames;
    },
    getSchema: (conn) => getDuckDBSchema(conn, sheetNames),
    allowedDirectories: [dirname(filePath)],
    cleanup,
  };
}
