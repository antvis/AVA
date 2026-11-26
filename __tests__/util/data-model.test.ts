import { describe, expect, it } from 'vitest';

import { buildDataModel, stringifyDataModel, dataModelInputSchema } from '../../src/util/data-model';
import { semanticOutputSchema, profileOutputSchema } from '../../src/contracts';
import { parseSemantic } from '../../src/contracts/semantic';
import { ossieModel } from '../fixtures/ossie';

import type { DataModel, Profile, Schema } from '../../src/types';

describe('stringifyDataModel', () => {
  it('renders physical sources, constraints and observations as Markdown tables', () => {
    const input: DataModel = {
      models: [
        {
          name: 'orders',
          tableReference: { schema: 'public', table: 'raw_orders' },
          primaryKey: ['id', 'customer_id'],
          uniqueKeys: ['id'],
          metrics: { row_count: 0 },
          columns: [
            { name: 'id', type: 'INTEGER', notNull: true },
            {
              name: 'amount',
              type: 'DOUBLE',
              notNull: false,
              metrics: { min: null, max: 0, top_values: [] },
              properties: { logicalType: 'numeric' },
            },
          ],
        },
        { name: 'customers', tableReference: { table: 'raw_customers' }, columns: [] },
      ],
      relationships: [
        {
          name: 'order_customer',
          models: ['orders', 'customers'],
          joinType: 'MANY_TO_ONE',
          condition: 'orders.customer_id = customers.id',
        },
      ],
      views: [{ name: 'all_orders', statement: 'SELECT * FROM orders' }],
    };
    const original = structuredClone(input);
    expect(stringifyDataModel(input)).toMatchSnapshot();
    expect(input).toEqual(original);
  });

  it('omits empty sections', () => {
    expect(stringifyDataModel({ models: [], relationships: [], views: [] })).toBe('# Data Model');
  });

  it('escapes Markdown, HTML, pipes and line breaks in headings and table cells', () => {
    const result = stringifyDataModel({
      models: [
        {
          name: 'a|b\n# heading',
          tableReference: { table: 'data' },
          columns: [{ name: '<field>', type: 'VARCHAR', notNull: true }],
        },
      ],
      views: [{ name: '<view>', statement: "SELECT '<script>|a**b'\rFROM data" }],
    });
    expect(result).toContain('### Model: a&#124;b<br># heading');
    expect(result).toContain('- &#60;field&#62; (VARCHAR) NOT NULL');
    expect(result).toContain('### View: &#60;view&#62;');
    expect(result).toContain("| statement | SELECT '&#60;script&#62;&#124;a&#42;&#42;b'<br>FROM data |");
  });

  it('omits obsolete metadata from manually constructed engine context', () => {
    const input = {
      description: 'obsolete root description',
      cubes: [{ name: 'obsolete cube' }],
      models: [
        {
          name: 'orders',
          tableReference: { table: 'data' },
          refSql: 'obsolete source override',
          columns: [{ name: 'amount', type: 'BIGINT', expression: 'obsolete calculation' }],
        },
      ],
      semantic: ossieModel,
    };
    const context = stringifyDataModel(input);
    expect(context).not.toContain('obsolete');
    expect(context).toContain('SUM(amount)');
    expect(() => stringifyDataModel({ models: [], semantic: { cubes: [] } as never })).toThrow();
  });

  it('retains complete context above the future retrieval threshold', () => {
    const description = '业务说明'.repeat(8_000);
    const result = stringifyDataModel({ models: [], semantic: { ...ossieModel, description } });
    expect(result.length).toBeGreaterThan(30_000);
    expect(result).toContain(description);
  });
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
    const context = stringifyDataModel({ models: [], semantic: parsed });
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

  it('rejects obsolete metadata in a physical schema', () => {
    expect(() => buildDataModel({ schema: { ...schema, cubes: [] } as Schema })).toThrow();

    const structure = structuredClone(schema);
    Object.assign(structure.models[0], { refSql: 'SELECT * FROM orders' });
    expect(() => buildDataModel({ schema: structure })).toThrow();
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
