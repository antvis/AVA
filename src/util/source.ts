const fileSourceTypes = {
  csv: 'csv-file',
  json: 'json-file',
  parquet: 'parquet',
  xlsx: 'excel',
  sqlite: 'sqlite',
  sqlite3: 'sqlite',
  db: 'sqlite',
} as const;

/** Infer file formats without pulling Node's path module into integrations or browser bundles. */
export function inferFileSourceType(path: string): (typeof fileSourceTypes)[keyof typeof fileSourceTypes] | undefined {
  const pathname = /^https?:\/\//i.test(path) ? new URL(path).pathname : path;
  const extension = /\.([^./\\]+)$/.exec(pathname)?.[1].toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(fileSourceTypes, extension)) return undefined;
  return fileSourceTypes[extension as keyof typeof fileSourceTypes];
}
