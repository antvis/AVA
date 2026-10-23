import { sqlIdentifier } from '../../util/sql';
import { getDuckDBSchema } from '../util/schema';

import { FeishuFieldType } from './feishu/convert';
import { readFeishuTable } from './feishu/read';
import { loadJson } from './json';

import type { FeishuField } from './feishu/convert';
import type { FeishuBitableSourceOptions, LoadedSource } from '../../types';

function sqlType(type: number): string {
  switch (type) {
    case FeishuFieldType.Text:
      return 'TEXT';
    case FeishuFieldType.Number:
      return 'DOUBLE';
    case FeishuFieldType.SingleSelect:
      return 'TEXT';
    case FeishuFieldType.MultiSelect:
      return 'TEXT';
    case FeishuFieldType.DateTime:
      return 'TIMESTAMP';
    case FeishuFieldType.Checkbox:
      return 'BOOLEAN';
    case FeishuFieldType.Phone:
      return 'TEXT';
    case FeishuFieldType.Url:
      return 'TEXT';
    case FeishuFieldType.User:
    case FeishuFieldType.CreatedUser:
    case FeishuFieldType.ModifiedUser:
      return 'TEXT';
    case FeishuFieldType.Attachment:
      return 'TEXT';
    case FeishuFieldType.SingleLink:
    case FeishuFieldType.DuplexLink:
      return 'TEXT';
    case FeishuFieldType.Lookup:
    case FeishuFieldType.Formula:
      return 'TEXT';
    case FeishuFieldType.Location:
      return 'TEXT';
    case FeishuFieldType.GroupChat:
      return 'TEXT';
    case FeishuFieldType.CreatedTime:
      return 'TIMESTAMP';
    case FeishuFieldType.ModifiedTime:
      return 'TIMESTAMP';
    case FeishuFieldType.AutoNumber:
      return 'TEXT';
    default:
      return 'VARCHAR';
  }
}

function emptyTable(fields: FeishuField[]): LoadedSource {
  const columns = fields.map((field) => `NULL::${sqlType(field.type)} AS ${sqlIdentifier(field.name)}`).join(',');
  return {
    register: async (conn) => {
      await conn.run(`CREATE OR REPLACE VIEW data AS SELECT ${columns} WHERE FALSE`);
      return ['data'];
    },
    getSchema: (conn) => getDuckDBSchema(conn, ['data']),
    allowedDirectories: [],
    cleanup: async () => {},
  };
}

export async function loadFeishuBitable(options: FeishuBitableSourceOptions): Promise<LoadedSource> {
  const { fields, rows } = await readFeishuTable(options);
  if (fields.length === 0) {
    throw new Error('Feishu Bitable has no supported fields');
  }
  if (rows.length === 0) {
    return emptyTable(fields);
  }
  return loadJson({ data: rows });
}
