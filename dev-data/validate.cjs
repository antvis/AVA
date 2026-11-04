// Run after npm run build:cjs. No model/API request is made.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { AVA } = require('../lib');
const { semanticMetadataSchema, buildDataModel } = require('../lib/util/data-model');

async function main() {
  const semantic = semanticMetadataSchema.parse(JSON.parse(readFileSync(join(__dirname, 'semantic.json'), 'utf8')));
  const sql = readFileSync(join(__dirname, 'financial-model.sql'), 'utf8');
  const ava = new AVA({ llm: { model: 'validation-only', apiKey: 'not-used' } });
  try {
    await ava.source({ type: 'sqlite', options: { path: join(__dirname, 'sales-investment.sqlite') } });
    const schema = await ava.schema();
    assert.equal(schema.models.length, 18);
    for (const physical of schema.models) {
      const definition = semantic.models.find(m => m.name === physical.name);
      assert.ok(definition, physical.name);
      assert.deepEqual(definition.tableReference, physical.tableReference);
      assert.deepEqual(definition.primaryKey, physical.primaryKey);
      assert.deepEqual(definition.columns.map(c => [c.name, c.type, c.notNull]),
        physical.columns.map(c => [c.name, c.type, c.notNull]));
    }
    assert.equal(semantic.relationships.length, schema.relationships.length);
    for (const relationship of schema.relationships) {
      assert.ok(semantic.relationships.some(r => r.condition === relationship.condition &&
        r.joinType === relationship.joinType && JSON.stringify(r.models) === JSON.stringify(relationship.models)),
      relationship.condition);
    }
    await ava.semantic(undefined, () => semantic);
    assert.deepEqual(await ava.semantic(), semantic);
    assert.equal(buildDataModel({ schema, semantic }).models.length, 19);
    const financial = semantic.models.find(m => m.name === 'delivered_sales');
    assert.equal(financial.refSql, sql);
    const execute = async query => (await ava.engine.execute(query, { maxRows: 100 })).data;
    const withSales = `WITH delivered_sales AS (${sql}) `;
    const [grain] = await execute(withSales + `SELECT COUNT(*) AS n, COUNT(DISTINCT fulfillment_id) AS distinct_n,
      MIN(gross_settlement_cents - refund_cents) AS minimum_settlement, MIN(net_cogs_cents) AS minimum_cogs
      FROM delivered_sales`);
    assert.equal(grain.n, grain.distinct_n);
    assert.ok(Number(grain.n) > 10000);
    assert.ok(Number(grain.minimum_settlement) >= 0 && Number(grain.minimum_cogs) >= 0);
    for (const cube of semantic.cubes) {
      const dimensions = [...(cube.dimensions || []), ...(cube.timeDimensions || [])];
      const projection = [...cube.measures, ...dimensions].map(m => `${m.expression} AS "${m.name}"`).join(', ');
      const groupBy = dimensions.length ? ` GROUP BY ${dimensions.map(d => d.expression).join(', ')}` : '';
      const result = await execute(withSales + `SELECT ${projection} FROM ${cube.baseObject}${groupBy} LIMIT 1`);
      assert.equal(result.length, 1, cube.name);
      for (const hierarchy of Object.values(cube.hierarchies || {})) {
        for (const name of hierarchy) assert.ok(dimensions.some(d => d.name === name));
      }
    }
    const totals = await execute(withSales + `SELECT
      CASE WHEN delivered_date BETWEEN '2026-08-03' AND '2026-08-30' THEN 'baseline' ELSE 'current' END AS period,
      SUM(net_sales_cents) AS net_sales_cents, SUM(contribution_before_ads_cents) AS contribution_before_ads_cents
      FROM delivered_sales WHERE delivered_date BETWEEN '2026-08-03' AND '2026-09-27' GROUP BY period ORDER BY period`);
    assert.ok(Number(totals[1].net_sales_cents) < Number(totals[0].net_sales_cents));
    console.log(`Validated ${schema.models.length} physical models, 1 SQL model, ${semantic.relationships.length} relationships and ${semantic.cubes.length} cubes through AVA.`);
    console.log(JSON.stringify(totals, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  } finally {
    await ava.dispose();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
