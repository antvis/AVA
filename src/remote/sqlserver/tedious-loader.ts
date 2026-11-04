/**
 * Lazy, cross-format loader for the optional `tedious` TDS driver. Isolating
 * it keeps the connector free of environment-specific module loading and lets
 * tests substitute a structural fake module.
 */
/** Structural subset of the tedious column metadata object. */
export interface TediousColumnMetadata {
  colName?: string;
  type?: { name?: string };
  typeName?: string;
}

/** A single result cell: tedious pairs each value with its column metadata. */
export interface TediousCell {
  value: unknown;
  metadata?: TediousColumnMetadata;
  type?: { name?: string };
  typeName?: string;
}

export interface TediousConnection {
  connect(cb: (error?: Error) => void): void;
  execSql(request: TediousRequest): void;
  close(): void;
  closed: boolean;
  on(event: 'end', cb: () => void): unknown;
  on(event: 'error', cb: (error: Error) => void): unknown;
}

export type TediousRequestCtor = new (
  sql: string,
  cb: (error?: Error, rowCount?: number) => void
) => TediousRequest;

export interface TediousRequest {
  on(event: 'columnMetadata', cb: (columns: TediousColumnMetadata[]) => void): unknown;
  on(event: 'row', cb: (row: TediousCell[]) => void): unknown;
}

export interface TediousModule {
  Connection: new (config: unknown) => TediousConnection;
  Request: TediousRequestCtor;
}

let cachedModule: TediousModule | null | undefined;

/** Load (and cache) the tedious bindings, throwing a clear error when absent. */
export async function loadTedious(): Promise<TediousModule> {
  if (cachedModule !== undefined) return cachedModule;
  try {
    // A dynamic import compiles to `require()` in the CJS build and stays a
    // real import in the ESM build, so both published formats can load the
    // optional driver (a bare `require` is undefined inside an ES module).
    const loaded = (await import('tedious')) as TediousModule & { default?: TediousModule };
    cachedModule = loaded.default ?? loaded;
  } catch {
    throw new Error(
      'SQL Server adapter requires the optional "tedious" dependency. ' +
        'Install it (npm i tedious) or set adapter: "mock" to use the in-memory connector.'
    );
  }
  return cachedModule;
}
