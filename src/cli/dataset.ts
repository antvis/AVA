import { stat } from 'fs/promises';
import { extname, resolve } from 'path';

import { AVA } from '..';


import { llmConfig } from './config';

import type { Schema } from '../types';

export async function describeSchema(ava: AVA, schema?: Schema) {
  const dialect = ava.engine!.dialect;
  if (!dialect.id) throw new Error('Query dialect must provide a non-empty id');
  return {
    ...(await ava.schema(undefined, schema === undefined ? undefined : () => schema)),
    language: dialect.id,
    ...(dialect.rules ? { instructions: dialect.rules } : {}),
  };
}

/** Own the engine within this command so the local mode needs no session process. */
export async function withLocalCSV<T>(file: string, operation: (ava: AVA) => Promise<T>): Promise<T> {
  if (extname(file).toLowerCase() !== '.csv' || /^(?:[a-z][\w+.-]*:\/\/|[/\\]{2})/i.test(file)) {
    throw new Error('--local requires a local CSV file path.');
  }
  const path = resolve(file);
  if (!(await stat(path)).isFile()) throw new Error('--local requires a local CSV file path.');

  const ava = new AVA({ llm: llmConfig(), engine: { type: 'duckdb' } });
  try {
    await ava.source({ type: 'csv-file', options: { path } });
    return await operation(ava);
  } finally {
    await ava.dispose();
  }
}
