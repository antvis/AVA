import { describe, expect, it } from 'vitest';

import { buildDataModel, stringifyDataModel, dataModelInputSchema } from '../../src/util/data-model';
import { dataModelStructure } from '../../src/contracts/shared/data-model';
import { semanticOutputSchema, profileOutputSchema } from '../../src/contracts';
import { parseSemantic } from '../../src/contracts/semantic';
import { ossieModel } from '../fixtures/ossie';

import type { DataModel, Profile, Schema } from '../../src/types';

describe('stringifyDataModel', () => {
  it('renders model sources, constraints, columns and metadata as Markdown tables', () => {
    const input: DataModel = {
      properties: { description: 'Sales data' },
      models: [
        {
          name: 'orders',
          tableReference: { schema: 'public', table: 'raw_orders' },
          primaryKey: ['id', 'customer_id'],
          uniqueKeys: ['id'],
          metrics: { row_count: 0 },
          properties: { description: 'Confirmed orders' },
          columns: [
            { name: 'id', type: 'INTEGER', notNull: true },
            {
              name: 'amount',
              type: 'DOUBLE',
              notNull: false,
              isCalculated: true,
              expression: 'price * quantity',
              metrics: { min: null, max: 0, top_values: [] },
              properties: { unit: 'USD' },
            },
            { name: 'customer', type: 'customers', relationship: 'order_customer', expression: null },
          ],
        },
        { name: 'customers', baseObject: 'raw_customers' },
        { name: 'recent_orders', refSql: 'SELECT * FROM orders\nWHERE id > 0' },
      ],
      relationships: [
        {
          name: 'order_customer',
          models: ['orders', 'customers'],
          joinType: 'MANY_TO_ONE',
          condition: 'orders.customer_id = customers.id',
          properties: { description: 'Buyer' },
          custom: false,
        },
      ],
      views: [{ name: 'all_orders', statement: 'SELECT * FROM orders', custom: { enabled: true } }],
    };
    const original = structuredClone(input);
    const result = stringifyDataModel(input);

    expect(result).toMatchSnapshot();
    expect(input).toEqual(original);
  });

  it('accepts empty and partial descriptions without inventing metadata', () => {
    expect(stringifyDataModel({})).toBe('# Data Model');
    expect(stringifyDataModel({ properties: {}, models: [], relationships: [], views: [], cubes: [] })).toBe(
      '# Data Model'
    );
    expect(stringifyDataModel({ models: [{ name: 'data', baseObject: 'source' }] })).toBe(
      '# Data Model\n\n## Models\n\n### Model: data\n\n| Attribute | Value |\n| --- | --- |\n| baseObject | source |'
    );
  });

  it('escapes Markdown, HTML, pipes and line breaks in headings and table cells', () => {
    const result = stringifyDataModel({
      properties: { 'a|b': '<script>\r\n**value** & `code` [link](url) \\' },
      models: [{ name: 'a|b\n# heading', refSql: "SELECT 'a|b'\rFROM data" }],
    });

    expect(result).toContain(
      '| a&#124;b | &#60;script&#62;<br>&#42;&#42;value&#42;&#42; &#38; &#96;code&#96; &#91;link&#93;(url) &#92; |'
    );
    expect(result).toContain('### Model: a&#124;b<br># heading');
    expect(result).toContain("| refSql | SELECT 'a&#124;b'<br>FROM data |");
  });

  it('expands column semantics, properties and observations beside the owning field', () => {
    const result = stringifyDataModel({
      models: [
        {
          name: 'orders',
          tableReference: { table: 'orders' },
          properties: { description: 'One row per order', dataScope: 'Paid orders' },
          columns: [
            {
              name: 'id',
              type: 'INTEGER',
              notNull: true,
              isPrimaryKey: true,
              properties: { description: 'Order identifier' },
            },
            {
              name: 'net',
              type: 'DOUBLE',
              isCalculated: true,
              expression: 'amount - refund',
              properties: { description: 'Net revenue', unit: 'USD', derivedFrom: ['amount', 'refund'] },
              metrics: { min: null, max: 0, top_values: [] },
            },
            {
              name: 'customer',
              type: 'customers',
              relationship: 'buyer',
              properties: { acceptedValues: ['retail', 'business'], custom: { enabled: false } },
            },
          ],
        },
      ],
    });
    expect(result).toContain('| dataScope | Paid orders |');
    expect(result).toContain('- id (INTEGER) NOT NULL PRIMARY KEY');
    const net = result.split('- net (DOUBLE)')[1].split('- customer (customers)')[0];
    expect(net).toContain('&#91;calculated: amount - refund&#93;');
    expect(net).toContain('| description | Net revenue |');
    expect(net).toContain('| unit | USD |');
    expect(net).toContain('| derivedFrom | &#91;"amount","refund"&#93; |');
    expect(net).toContain('| min | null |');
    expect(net).toContain('| max | 0 |');
    expect(net).toContain('| top&#95;values | &#91;&#93; |');
    const customer = result.split('- customer (customers)')[1];
    expect(customer).toContain('&#91;relationship: buyer&#93;');
    expect(customer).toContain('| acceptedValues | &#91;"retail","business"&#93; |');
    expect(customer).toContain('| custom | {"enabled":false} |');
  });

  it('describes cube members and drill-down paths without nesting their definitions in JSON', () => {
    const input: DataModel = {
      cubes: [
        {
          name: 'revenue',
          baseObject: 'orders',
          measures: [
            {
              name: 'total',
              type: 'DOUBLE',
              expression: 'SUM(amount - refund)',
              description: 'Net revenue',
              properties: { unit: 'USD' },
            },
          ],
          dimensions: [{ name: 'region', type: 'VARCHAR', expression: 'region' }],
          timeDimensions: [{ name: 'month', type: 'DATE', expression: "DATE_TRUNC('month', ordered_at)" }],
          hierarchies: { calendar: ['year', 'month'] },
          properties: { description: 'Sales reporting' },
        },
        { name: 'counts', baseObject: 'orders', measures: [{ name: 'count', type: 'BIGINT', expression: 'COUNT(*)' }] },
      ],
    };
    const original = structuredClone(input);
    const result = stringifyDataModel(input);
    expect(result).toMatchSnapshot();
    expect(result).toContain('#### Measures\n\n- total (DOUBLE)');
    expect(result).toContain('#### Dimensions\n\n- region (VARCHAR)');
    expect(result).toContain('#### Time dimensions\n\n- month (DATE)');
    expect(result).toContain('#### Hierarchies\n\n- calendar: year → month');
    expect(result).not.toContain('| measures |');
    expect(input).toEqual(original);
  });

  it('escapes column summaries, cube members and hierarchy paths', () => {
    const result = stringifyDataModel({
      models: [
        {
          name: 'data',
          tableReference: { table: 'data' },
          columns: [
            {
              name: '<field>',
              type: 'VARCHAR',
              isCalculated: true,
              expression: "'<script>\\n'",
              relationship: '[join]',
            },
          ],
        },
      ],
      cubes: [
        {
          name: '<cube>',
          baseObject: 'data',
          measures: [{ name: '[total]', type: 'DOUBLE', expression: 'SUM(value)' }],
          hierarchies: { '<path>': ['[year]', 'month\n# injected'] },
        },
      ],
    });
    expect(result).toContain('- &#60;field&#62; (VARCHAR) &#91;calculated:');
    expect(result).toContain('&#91;relationship: &#91;join&#93;&#93;');
    expect(result).toContain('### Cube: &#60;cube&#62;');
    expect(result).toContain('- &#91;total&#93; (DOUBLE)');
    expect(result).toContain('- &#60;path&#62;: &#91;year&#93; → month<br># injected');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('\n# injected');
  });

  it('retains complete context above the future retrieval threshold', () => {
    const description = '业务说明'.repeat(8_000);
    const result = stringifyDataModel({ description, views: [{ name: 'last_view', statement: 'SELECT 1' }] });
    expect(result.length).toBeGreaterThan(30_000);
    expect(result).toContain(description);
    expect(result).toContain('### View: last&#95;view');
  });
});

describe('dataModelStructure', () => {
  it('preserves and snapshots structure, observations and semantic metadata together', () => {
    const input: DataModel = {
      properties: { description: 'Orders', custom: { labels: ['sales'] } },
      models: [
        {
          name: 'orders',
          tableReference: { table: 'raw_orders', schema: 'public' },
          primaryKey: ['id'],
          uniqueKeys: [['external_id']],
          metrics: { row_count: 0 },
          properties: { description: 'Confirmed orders' },
          columns: [
            { name: 'id', type: 'INTEGER', notNull: true },
            { name: 'external_id', type: 'VARCHAR', metrics: { top_values: [] } },
            {
              name: 'amount',
              type: 'DOUBLE',
              isCalculated: true,
              expression: 'price * quantity',
              properties: { unit: 'USD' },
              metrics: { min: null, max: 0, custom: [{ value: false, count: 1 }] },
            },
          ],
        },
      ],
      relationships: [
        {
          name: 'parent_order',
          models: ['orders', 'orders'],
          joinType: 'MANY_TO_ONE',
          condition: 'child.parent_id = parent.id',
          properties: { description: 'Parent order' },
          aliases: ['child', 'parent'],
        },
      ],
      views: [{ name: 'large_orders', statement: 'SELECT * FROM orders WHERE amount > 100', custom: true }],
    };
    const result = dataModelStructure.parse(input);

    expect(result).toEqual(input);
    expect(result.models[0].columns[2].metrics.custom).not.toBe(input.models[0].columns[2].metrics.custom);
    expect(result.properties.custom).not.toBe(input.properties.custom);
  });

  it.each([
    {},
    { tableReference: { table: 'orders' }, refSql: 'SELECT 1' },
    { refSql: 'SELECT 1', baseObject: 'orders' },
    { baseObject: 'orders', tableReference: { table: 'orders' } },
  ])('rejects missing or ambiguous model sources: %j', (source) => {
    expect(() => dataModelStructure.parse({ models: [{ name: 'orders', ...source }] })).toThrow('exactly one');
  });

  it.each([Infinity, NaN, undefined, BigInt(1), () => 1])(
    'rejects non-JSON observations and properties: %s',
    (value) => {
      expect(() => dataModelStructure.parse({ properties: { invalid: value } })).toThrow();
      expect(() =>
        dataModelStructure.parse({ models: [{ name: 'data', baseObject: 'source', metrics: { invalid: value } }] })
      ).toThrow();
    }
  );

  it('accepts an incomplete description without inventing sources, columns or statistics', () => {
    expect(dataModelStructure.parse({})).toEqual({});
    const input = { models: [{ name: 'data', refSql: 'SELECT 1' }] };
    expect(dataModelStructure.parse(input)).toEqual(input);
  });

  it.each([{ tables: [] }, { catalog: 'analytics' }, { schema: 'sales' }])(
    'rejects obsolete root fields instead of silently discarding data: %j',
    (fields) => {
      expect(() => dataModelStructure.parse({ models: [], ...fields })).toThrow();
    }
  );
});

describe('Ossie semantic models', () => {
  const orders = ossieModel.datasets[0];
  const customers = {
    name: 'customers',
    source: 'sales.public.customers',
    fields: [{ name: 'id', expression: { sql: 'id' } }],
    primary_key: ['id'],
  };
  const relationship = {
    name: 'order_customer',
    from: 'orders',
    from_columns: ['amount'],
    to: 'customers',
    to_columns: ['ID'],
  };
  const related = { ...ossieModel, datasets: [orders, customers], relationships: [relationship] };

  it('round-trips portable and vendor metadata without sharing references', () => {
    const document = {
      ...related,
      ai_context: { instructions: 'Amounts are in USD.', scope: { report: 'finance' } },
      nonportable_extensions: [{ vendor_name: 'EXAMPLE', data: { warehouse: 'PRIVATE' } }],
    };
    const parsed = parseSemantic(JSON.stringify(document));
    expect(parsed).toEqual(document);
    parsed.nonportable_extensions[0].data.warehouse = 'changed';
    expect(document.nonportable_extensions[0].data.warehouse).toBe('PRIVATE');
    const context = stringifyDataModel({ semantic: parsed });
    for (const value of ['## Apache Ossie semantic model', 'Amounts are in USD.', 'SUM(amount)', 'order_customer']) {
      expect(context).toContain(value);
    }
    expect(context).not.toContain('nonportable_extensions');
    expect(context).not.toContain('changed');
  });

  it('accepts native dialect alternatives and rejects missing expressions', () => {
    const model = (expression: unknown) => ({
      ...ossieModel,
      datasets: [{ ...orders, fields: [{ name: 'amount', expression }], metrics: [] }],
    });
    expect(
      semanticOutputSchema.safeParse(model({ dialects: [{ dialect: 'DUCKDB', expression: 'value' }] })).success
    ).toBe(true);
    expect(() => semanticOutputSchema.parse(model({}))).toThrow();
    expect(() => semanticOutputSchema.parse(model({ sql: 'value', dialects: [] }))).toThrow();
  });

  it.each([
    { version: '0.1.1', semantic_model: [related] },
    { models: [], description: 'Legacy AVA definition' },
    { ...ossieModel, datasets: [] },
    { ...ossieModel, datasets: [{ ...orders, metrics: { row_count: 2 } }] },
    { ...related, relationships: [{ ...relationship, to: 'unknown' }] },
    { ...related, relationships: [{ ...relationship, to_columns: ['unknown'] }] },
    { ...related, relationships: [{ ...relationship, to_columns: ['id', 'id'] }] },
    { ...related, datasets: [orders, { ...customers, primary_key: ['unknown'] }] },
    { ...ossieModel, datasets: [{ ...orders, fields: [...orders.fields, ...orders.fields] }] },
    { ...ossieModel, datasets: [{ ...orders, metrics: [{ ...orders.metrics[0], name: 'AMOUNT' }] }] },
  ])('rejects invalid definitions %#', (value) => {
    expect(() => semanticOutputSchema.parse(value)).toThrow();
  });

  it('rejects duplicate keys in serialized models', () => {
    expect(() => parseSemantic('version: 0.3.0.dev0\nname: orders\nname: customers')).toThrow(/unique/i);
  });
});

describe('buildDataModel', () => {
  const schema: Schema = {
    models: [
      {
        name: 'orders',
        tableReference: { catalog: 'sales', schema: 'public', table: 'raw_orders' },
        primaryKey: ['id', 'customer_id'],
        uniqueKeys: ['id'],
        columns: [
          { name: 'id', type: 'INTEGER', notNull: true },
          { name: 'customer_id', type: 'INTEGER' },
          { name: 'amount', type: 'DOUBLE', notNull: false },
        ],
      },
      {
        name: 'customers',
        tableReference: { catalog: 'sales', schema: 'public', table: 'customers' },
        primaryKey: 'id',
        columns: [{ name: 'id', type: 'INTEGER', notNull: true }],
      },
    ],
    relationships: [
      {
        name: 'order_customer',
        models: ['orders', 'customers'],
        joinType: 'MANY_TO_ONE',
        condition: 'orders.customer_id = customers.id',
      },
    ],
    views: [{ name: 'large_orders', statement: 'SELECT * FROM raw_orders WHERE amount > 100' }],
  };

  const profile: Profile = {
    models: [
      {
        name: 'customers',
        metrics: {},
        columns: [{ name: 'id', metrics: { distinct_count: 0 }, properties: { logicalType: 'numeric' } }],
      },
      {
        name: 'orders',
        metrics: { row_count: 0 },
        columns: [
          {
            name: 'amount',
            metrics: { min: null, max: 0, top_values: [], custom: [{ value: false, count: 1 }] },
            properties: { logicalType: 'numeric' },
          },
          { name: 'id', metrics: { distinct_count: 1 }, properties: { logicalType: 'numeric' } },
        ],
      },
    ],
  };

  it('matches observations by model and column names while preserving schema order and structure', () => {
    const result = buildDataModel({ schema, profile });

    expect(result).toEqual({
      ...schema,
      models: [
        {
          ...schema.models[0],
          metrics: { row_count: 0 },
          columns: [
            {
              name: 'id',
              type: 'INTEGER',
              notNull: true,
              metrics: { distinct_count: 1 },
              properties: { logicalType: 'numeric' },
            },
            { name: 'customer_id', type: 'INTEGER' },
            {
              name: 'amount',
              type: 'DOUBLE',
              notNull: false,
              metrics: { min: null, max: 0, top_values: [], custom: [{ value: false, count: 1 }] },
              properties: { logicalType: 'numeric' },
            },
          ],
        },
        {
          ...schema.models[1],
          metrics: {},
          columns: [
            {
              name: 'id',
              type: 'INTEGER',
              notNull: true,
              metrics: { distinct_count: 0 },
              properties: { logicalType: 'numeric' },
            },
          ],
        },
      ],
    });
  });

  it('accepts absent, empty and partial profiles without inventing observations', () => {
    expect(buildDataModel({ schema })).toEqual(schema);
    expect(buildDataModel({ schema, profile: { models: [] } })).toEqual(schema);
    expect(buildDataModel({ schema: { models: [] } })).toEqual({ models: [] });

    const result = buildDataModel({ schema, profile: { models: [profile.models[0]] } });

    expect(result).toEqual({
      ...schema,
      models: [
        schema.models[0],
        {
          ...schema.models[1],
          metrics: {},
          columns: [
            {
              name: 'id',
              type: 'INTEGER',
              notNull: true,
              metrics: { distinct_count: 0 },
              properties: { logicalType: 'numeric' },
            },
          ],
        },
      ],
    });
  });

  it('accepts an in-memory source without inventing a catalog or schema', () => {
    const input: Schema = {
      models: [{ name: 'data', tableReference: { table: 'data' }, columns: [] }],
    };

    expect(buildDataModel({ schema: input })).toEqual(input);
  });

  it('keeps the logical model and its source mappings beside physical structure and observations', () => {
    const semantic = structuredClone(ossieModel);
    semantic.datasets[0].source = 'SELECT amount AS value FROM sales.public.raw_orders';
    const original = structuredClone({ schema, profile, semantic });
    const result = buildDataModel({ schema, profile, semantic });

    expect(result).toEqual({ ...buildDataModel({ schema, profile }), semantic });
    expect(result.models[0].tableReference).toEqual({ catalog: 'sales', schema: 'public', table: 'raw_orders' });
    expect(result.models[0].metrics).toEqual({ row_count: 0 });
    expect(result.semantic.datasets[0].source).toBe(semantic.datasets[0].source);

    result.semantic.datasets[0].fields[0].expression.sql = 'changed';
    expect({ schema, profile, semantic }).toEqual(original);
  });

  it('does not mutate or retain nested references to either input', () => {
    const structure = structuredClone(schema);
    const observations = structuredClone(profile);
    const result = buildDataModel({ schema: structure, profile: observations });

    expect(structure).toEqual(schema);
    expect(observations).toEqual(profile);

    result.models[0].tableReference.table = 'changed';
    (result.models[0].primaryKey as string[]).push('amount');
    result.models[0].columns[2].metrics.custom[0].value = true;
    result.models[0].columns[2].properties.logicalType = 'unknown';
    result.relationships[0].models.reverse();
    result.views[0].statement = 'SELECT 1';

    expect(structure).toEqual(schema);
    expect(observations).toEqual(profile);
  });

  it('rebuilds from the current profile without retaining previous observations', () => {
    buildDataModel({ schema, profile });
    const result = buildDataModel({
      schema,
      profile: { models: [{ name: 'orders', metrics: { row_count: 10 }, columns: [] }] },
    });

    expect(result).toEqual({
      ...schema,
      models: [{ ...schema.models[0], metrics: { row_count: 10 } }, schema.models[1]],
    });
  });

  it.each<[string, Profile]>([
    ['model', { models: [{ name: 'missing', metrics: {}, columns: [] }] }],
    [
      'column',
      {
        models: [
          {
            name: 'orders',
            metrics: {},
            columns: [{ name: 'missing', metrics: {}, properties: { logicalType: 'unknown' } }],
          },
        ],
      },
    ],
  ])('rejects an unknown profile %s', (kind, input) => {
    expect(() => buildDataModel({ schema, profile: input })).toThrow(`Unknown profile ${kind}`);
  });

  it.each(['schema model', 'schema column', 'profile model', 'profile column'])('rejects a duplicate %s', (kind) => {
    const structure = structuredClone(schema);
    const observations = structuredClone(profile);

    if (kind === 'schema model') structure.models.push(structure.models[0]);
    if (kind === 'schema column') structure.models[0].columns.push(structure.models[0].columns[0]);
    if (kind === 'profile model') observations.models.push(observations.models[0]);
    if (kind === 'profile column') observations.models[0].columns.push(observations.models[0].columns[0]);

    expect(() => buildDataModel({ schema: structure, profile: observations })).toThrow(`Duplicate ${kind}`);
  });

  it.each([Infinity, NaN, undefined, BigInt(1), () => 1])('rejects non-JSON profile values: %s', (value) => {
    const input = structuredClone(profile);
    input.models[0].metrics.invalid = value as never;

    expect(() => buildDataModel({ schema, profile: input })).toThrow();
  });

  it('rejects inputs that cross field ownership boundaries', () => {
    expect(() => buildDataModel({ schema: { ...schema, metrics: {} } as Schema })).toThrow();

    const input = structuredClone(profile);
    Object.assign(input.models[0].columns[0], { type: 'VARCHAR' });

    expect(() => buildDataModel({ schema, profile: input })).toThrow();
  });
});

describe('profile contract boundaries', () => {
  const profile = {
    models: [
      {
        name: 'data',
        metrics: {},
        columns: [{ name: 'value', metrics: {}, properties: { logicalType: 'numeric' as const } }],
      },
    ],
  };
  it('preserves the public projection while assembly rejects unsupported nested fields', () => {
    const input = structuredClone(profile);
    Object.assign(input.models[0].columns[0].properties, { unsupported: true });
    expect(profileOutputSchema.parse(input)).toEqual(profile);
    expect(() => dataModelInputSchema.parse({ schema: { models: [] }, profile: input })).toThrow();
  });
  it('keeps assembly model and column names nonempty', () => {
    for (const field of [profile.models[0], profile.models[0].columns[0]]) {
      const original = field.name;
      field.name = '';
      expect(() => dataModelInputSchema.parse({ schema: { models: [] }, profile })).toThrow();
      field.name = original;
    }
  });
});
