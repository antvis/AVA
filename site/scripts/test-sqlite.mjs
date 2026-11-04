import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const SQL = await require('sql.js')();
const fixture = new SQL.Database();
fixture.run(`PRAGMA foreign_keys=ON;
CREATE TABLE orders(id INTEGER PRIMARY KEY, paid INTEGER NOT NULL);
CREATE TABLE refunds(id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES orders(id), amount INTEGER NOT NULL);
INSERT INTO orders VALUES(1,10000),(2,5000);
INSERT INTO refunds VALUES(1,1,1000),(2,1,2000);
CREATE VIEW net_sales AS SELECT o.id,o.paid-COALESCE(r.refunded,0) AS net
FROM orders o LEFT JOIN (SELECT order_id,SUM(amount) AS refunded FROM refunds GROUP BY order_id) r ON r.order_id=o.id;`);
const bytes = fixture.export();
fixture.close();
const replies = [];
const self = { postMessage: (value) => replies.push(JSON.parse(JSON.stringify(value))) };
const context = vm.createContext({
  self,
  importScripts: () => {},
  initSqlJs: async () => SQL,
  TextEncoder,
  TextDecoder,
  Uint8Array,
  Map,
  BigInt,
});
vm.runInContext(await readFile(new URL('../ai/core/sqlite.worker.js', import.meta.url), 'utf8'), context);
let id = 0;
async function call(method, payload) {
  await self.onmessage({ data: { id: ++id, method, payload } });
  return replies.pop();
}
const loaded = await call('load', bytes);
assert.equal(loaded.result.models.length, 3);
assert.equal(loaded.result.relationships.length, 1);
assert.equal(loaded.result.relationships[0].joinType, 'MANY_TO_ONE');
const total = await call('query', { sql: 'SELECT SUM(net) AS total FROM net_sales' });
assert.deepEqual(total.result.data, [{ total: 12000 }]);
for (const sql of [
  'DELETE FROM orders',
  'PRAGMA query_only=OFF',
  'SELECT 1; SELECT 2',
  'WITH x AS (SELECT 1) DELETE FROM orders',
])
  assert.ok((await call('query', { sql })).error, sql);
assert.equal(
  (await call('query', { sql: 'SELECT * FROM orders', options: { maxRows: 1 } })).result.truncatedBy,
  'maxRows'
);
assert.equal(
  (await call('query', { sql: 'SELECT * FROM orders', options: { maxResultBytes: 2 } })).result.truncatedBy,
  'maxResultBytes'
);
assert.equal((await call('query', { sql: "SELECT 'DELETE FROM orders; hello' AS text" })).result.rowCount, 1);
assert.equal(
  (await call('query', { sql: 'SELECT 9007199254740993 AS exact_integer' })).result.data[0].exact_integer,
  '9007199254740993'
);
assert.equal((await call('profile')).result.models.find((m) => m.name === 'orders').metrics.row_count, 2);
assert.ok((await call('load', new Uint8Array([1, 2, 3]))).error);
console.log(
  'SQLite: multi-table/view totals, catalog FK, read-only, one statement, bounds, precision and invalid file checks passed.'
);

const { profileMetadataSchema } = require('../../lib/util/profile.js');
await call('load',bytes);
profileMetadataSchema.parse((await call('profile')).result);
console.log('AVA profile contract validated.');
