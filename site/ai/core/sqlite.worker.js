/* SQLite runs in a dedicated worker; the main thread can terminate runaway queries. */
importScripts('/vendor/sqlite/sql-wasm-browser.js');
let database;
const quote = (name) => '"' + name.replaceAll('"', '""') + '"';
function rows(sql) {
  const result = database.exec(sql)[0];
  return result ? result.values.map((row) => Object.fromEntries(result.columns.map((key, i) => [key, row[i]]))) : [];
}
function schema() {
  const tables = rows(
    "SELECT name,type FROM sqlite_schema WHERE type IN ('table','view') AND substr(name,1,7)!='sqlite_' ORDER BY name"
  );
  const models = tables.map(({ name }) => {
    const columns = rows(`PRAGMA table_info(${quote(name)})`);
    const primaryKey = columns
      .filter((c) => c.pk)
      .sort((a, b) => a.pk - b.pk)
      .map((c) => c.name);
    const uniqueKeys = rows(`PRAGMA index_list(${quote(name)})`)
      .filter((i) => i.unique && !i.partial)
      .map((i) => rows(`PRAGMA index_info(${quote(i.name)})`).map((c) => c.name))
      .filter((key) => key.length && key.every(Boolean));
    return {
      name,
      tableReference: { table: name },
      columns: columns.map((c) => ({
        name: c.name,
        type: c.type || 'NUMERIC',
        notNull: !!c.notnull || (primaryKey.length === 1 && c.pk === 1 && c.type.toUpperCase() === 'INTEGER'),
      })),
      ...(primaryKey.length ? { primaryKey } : {}),
      ...(uniqueKeys.length ? { uniqueKeys } : {}),
    };
  });
  const relationships = [];
  for (const model of models) {
    const groups = new Map();
    for (const fk of rows(`PRAGMA foreign_key_list(${quote(model.name)})`)) {
      const group = groups.get(fk.id) || [];
      group.push(fk);
      groups.set(fk.id, group);
    }
    for (const [id, group] of groups) {
      group.sort((a, b) => a.seq - b.seq);
      const parent = models.find((m) => m.name.toLowerCase() === group[0].table.toLowerCase());
      if (!parent) continue;
      const keys = [model.primaryKey, ...(model.uniqueKeys || [])].filter(Boolean);
      const unique = keys.some(
        (key) => key.length === group.length && key.every((c) => group.some((fk) => fk.from === c))
      );
      relationships.push({
        name: `${model.name}_fk_${id}`,
        models: [model.name, parent.name],
        joinType: unique ? 'ONE_TO_ONE' : 'MANY_TO_ONE',
        condition: group
          .map(
            (fk, i) =>
              `${quote(model.name)}.${quote(fk.from)} = ${quote(parent.name)}.${quote(
                fk.to || parent.primaryKey?.[i] || ''
              )}`
          )
          .join(' AND '),
      });
    }
  }
  return { models, relationships };
}
function execute(sql, options = {}) {
  const maxRows = options.maxRows ?? 200;
  const maxBytes = options.maxResultBytes ?? 1048576;
  if (!Number.isInteger(maxRows) || maxRows < 1 || maxRows > 1000000 || !Number.isInteger(maxBytes) || maxBytes < 1)
    throw new Error('Invalid query result limits.');
  const iterator = database.iterateStatements(sql);
  const first = iterator.next();
  if (first.done) throw new Error('Provide one read-only SELECT statement.');
  const statement = first.value;
  let result;
  try {
    const stripped = statement
      .getSQL()
      .replace(/^\s*(?:(?:--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)\s*)*/, '')
      .trim();
    if (!/^(SELECT|WITH|EXPLAIN)\b/i.test(stripped)) throw new Error('Only read-only SELECT queries are allowed.');
    const names = statement.getColumnNames();
    if (!names.length) throw new Error('The query must return columns.');
    const data = [];
    let bytes = 2,
      truncatedBy;
    while (statement.step()) {
      const row = statement.getAsObject(null, { useBigInt: true });
      for (const key of Object.keys(row)) {
        if (typeof row[key] === 'bigint')
          row[key] =
            row[key] <= BigInt(Number.MAX_SAFE_INTEGER) && row[key] >= BigInt(Number.MIN_SAFE_INTEGER)
              ? Number(row[key])
              : String(row[key]);
        if (row[key] instanceof Uint8Array)
          throw new Error('BLOB results must be converted with hex() before display.');
      }
      if (data.length === maxRows) {
        truncatedBy = 'maxRows';
        break;
      }
      const size = new TextEncoder().encode(JSON.stringify(row)).length + (data.length ? 1 : 0);
      if (bytes + size > maxBytes) {
        truncatedBy = 'maxResultBytes';
        break;
      }
      bytes += size;
      data.push(row);
    }
    result = {
      data,
      schema: names.map((name) => ({ name })),
      ...(truncatedBy ? { truncated: true, truncatedBy } : { rowCount: data.length }),
    };
  } finally {
    statement.free();
  }
  // Parsing a second statement is sufficient; it is never executed.
  const extra = iterator.next();
  if (!extra.done) {
    extra.value.free();
    throw new Error('Only one statement is allowed.');
  }
  return result;
}
self.onmessage = async ({ data: { id, method, payload } }) => {
  try {
    let result;
    if (method === 'load') {
      const bytes = new Uint8Array(payload);
      if (new TextDecoder().decode(bytes.slice(0, 16)) !== 'SQLite format 3\u0000')
        throw new Error('Not a valid SQLite database file.');
      const SQL = await initSqlJs({ locateFile: (name) => '/vendor/sqlite/' + name });
      database?.close();
      database = new SQL.Database(bytes);
      database.run('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');
      result = schema();
      if (!result.models.length) throw new Error('The database has no readable tables or views.');
    } else {
      if (!database) throw new Error('Load a SQLite file first.');
      if (method === 'schema') result = schema();
      else if (method === 'query') result = execute(payload.sql, payload.options);
      else if (method === 'profile')
        result = {
          models: schema().models.map((model) => ({
            name: model.name,
            metrics: { row_count: rows(`SELECT COUNT(*) AS n FROM ${quote(model.name)}`)[0].n },
            columns: model.columns.map((column) => ({ name: column.name, metrics: {}, properties: { logicalType: /INT|REAL|NUMERIC|DEC|DOUBLE|FLOAT/i.test(column.type) ? 'numeric' : /CHAR|TEXT|CLOB/i.test(column.type) ? 'string' : /DATE|TIME/i.test(column.type) ? 'date' : /BOOL/i.test(column.type) ? 'boolean' : 'unknown' } })),
          })),
        };
      else throw new Error('Unknown SQLite operation.');
    }
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
