import { describe, expect, it } from 'vitest';

import { buildDataModel, dataModelMetadataSchema, stringifyDataModel } from '../../src/util/data-model';

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
    expect(stringifyDataModel({ properties: {}, models: [], relationships: [], views: [] })).toBe('# Data Model');
    expect(stringifyDataModel({ models: [{ name: 'data', baseObject: 'source' }] })).toBe(
      '# Data Model\n\n## Models\n\n### data\n\n| Attribute | Value |\n| --- | --- |\n| baseObject | source |'
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
    expect(result).toContain('### a&#124;b<br># heading');
    expect(result).toContain("| refSql | SELECT 'a&#124;b'<br>FROM data |");
  });
});

describe('dataModelMetadataSchema', () => {
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
    const result = dataModelMetadataSchema.parse(input);

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
    expect(() => dataModelMetadataSchema.parse({ models: [{ name: 'orders', ...source }] })).toThrow('exactly one');
  });

  it.each([Infinity, NaN, undefined, BigInt(1), () => 1])(
    'rejects non-JSON observations and properties: %s',
    (value) => {
      expect(() => dataModelMetadataSchema.parse({ properties: { invalid: value } })).toThrow();
      expect(() =>
        dataModelMetadataSchema.parse({ models: [{ name: 'data', baseObject: 'source', metrics: { invalid: value } }] })
      ).toThrow();
    }
  );

  it('accepts an incomplete description without inventing sources, columns or statistics', () => {
    expect(dataModelMetadataSchema.parse({})).toEqual({});
    const input = { models: [{ name: 'data', refSql: 'SELECT 1' }] };
    expect(dataModelMetadataSchema.parse(input)).toEqual(input);
  });

  it('rejects obsolete root fields instead of silently discarding data', () => {
    expect(() => dataModelMetadataSchema.parse({ models: [], tables: [] })).toThrow();
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
    expect(result.models[0].columns[2].metrics).toEqual({
      min: null,
      max: 0,
      top_values: [],
      custom: [{ value: false, count: 1 }],
    });
    expect(result.models[0].columns[1]).not.toHaveProperty('metrics');
    expect(result.models[0].columns[1]).not.toHaveProperty('properties');
  });

  it('accepts absent, empty and partial profiles without inventing observations', () => {
    expect(buildDataModel({ schema })).toEqual(schema);
    expect(buildDataModel({ schema, profile: { models: [] } })).toEqual(schema);
    expect(buildDataModel({ schema: { models: [] } })).toEqual({ models: [] });

    const result = buildDataModel({ schema, profile: { models: [profile.models[0]] } });

    expect(result.models[0]).toEqual(schema.models[0]);
    expect(result.models[1].metrics).toEqual({});
  });

  it('accepts an in-memory source without inventing a catalog or schema', () => {
    const input: Schema = {
      models: [{ name: 'data', tableReference: { table: 'data' }, columns: [] }],
    };

    expect(buildDataModel({ schema: input })).toEqual(input);
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

    expect(result.models[0].metrics).toEqual({ row_count: 10 });
    expect(result.models[0].columns).toEqual(schema.models[0].columns);
    expect(result.models[1]).not.toHaveProperty('metrics');
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
