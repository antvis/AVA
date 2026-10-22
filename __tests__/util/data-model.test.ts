import { describe, expect, it } from 'vitest';

import {
  buildDataModel,
  dataModelMetadataSchema,
  semanticMetadataSchema,
  stringifyDataModel,
} from '../../src/util/data-model';

import type { DataModel, Profile, Schema, Semantic } from '../../src/types';

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

  it.each([{ tables: [] }, { catalog: 'analytics' }, { schema: 'sales' }])(
    'rejects obsolete root fields instead of silently discarding data: %j',
    (fields) => {
      expect(() => dataModelMetadataSchema.parse({ models: [], ...fields })).toThrow();
    }
  );
});

describe('semantic metadata', () => {
  const input: Semantic = {
    description: 'Sales definitions',
    models: [
      {
        name: 'orders',
        tableReference: { catalog: 'warehouse', schema: 'public', table: 'raw_orders' },
        dialect: 'duckdb',
        columns: [
          { name: 'id', type: 'INTEGER', isPrimaryKey: true },
          { name: 'cost', type: 'DOUBLE' },
        ],
      },
    ],
    views: [{ name: 'sales', statement: 'SELECT * FROM orders', dialect: 'duckdb' }],
    cubes: [
      {
        name: 'revenue',
        baseObject: 'sales',
        measures: [
          {
            name: 'total_revenue',
            expression: 'SUM(amount)',
            type: 'DOUBLE',
            description: 'Recognized revenue',
            properties: { unit: 'USD' },
          },
        ],
        dimensions: [{ name: 'status', expression: 'status', type: 'VARCHAR' }],
        timeDimensions: [{ name: 'ordered_at', expression: 'ordered_at', type: 'TIMESTAMP' }],
        hierarchies: { calendar: ['ordered_at'] },
        properties: { description: 'Revenue by order status' },
      },
    ],
  };

  it('validates and copies semantic definitions without filling defaults or mixing them with observations', () => {
    const result = semanticMetadataSchema.parse(input);
    expect(result).toEqual(input);
    expect(result.cubes[0].measures).not.toBe(input.cubes[0].measures);
    expect(result.models[0].columns).not.toBe(input.models[0].columns);
    expect(result.models[0]).not.toHaveProperty('metrics');
  });

  it.each([
    { name: 'orders', baseObject: 'raw_orders', metrics: { row_count: 2 } },
    {
      name: 'orders',
      baseObject: 'raw_orders',
      columns: [{ name: 'amount', type: 'DOUBLE', metrics: { mean: 3 } }],
    },
  ])('rejects profiling observations in semantic definitions: %j', (model) => {
    const value = { models: [model] };
    expect(() => semanticMetadataSchema.parse(value)).toThrow();
    expect(() => buildDataModel({ schema: { models: [] }, semantic: value })).toThrow();
    expect(dataModelMetadataSchema.parse(value)).toEqual(value);
  });

  it('includes description and cubes in model context without mutating it', () => {
    const original = structuredClone(input);
    const result = stringifyDataModel(input);
    for (const value of ['Sales definitions', '## Cubes', 'total&#95;revenue', 'SUM(amount)', 'ordered&#95;at']) {
      expect(result).toContain(value);
    }
    expect(input).toEqual(original);
  });

  it.each([
    { models: [{ name: 'missing_source' }] },
    { models: [{ ...input.models[0], refSql: 'SELECT 1' }] },
    { cubes: [{ name: 'empty', baseObject: 'orders', measures: [] }] },
    { cubes: [{ name: 'invalid', measures: [{ name: 'total', expression: 'SUM(amount)', type: 'DOUBLE' }] }] },
    { cubes: [{ ...input.cubes[0], measures: [{ name: 'total', type: 'DOUBLE' }] }] },
    { cubes: [{ ...input.cubes[0], hierarchies: { calendar: [] } }] },
  ])('rejects malformed semantic metadata: %j', (value) => {
    expect(() => semanticMetadataSchema.parse(value)).toThrow();
  });

  it.each([
    { models: [{ ...input.models[0], cached: false }] },
    { models: [{ ...input.models[0], refreshTime: '1h' }] },
    { models: [{ ...input.models[0], rowLevelAccessControls: [] }] },
    { cubes: [{ ...input.cubes[0], refreshTime: '30m' }] },
    {
      models: [{ ...input.models[0], columns: [{ name: 'cost', type: 'DOUBLE', isHidden: true }] }],
    },
    {
      models: [
        {
          ...input.models[0],
          columns: [
            {
              name: 'cost',
              type: 'DOUBLE',
              columnLevelAccessControl: {
                name: 'cost_access',
                operator: 'EQUALS',
                requiredProperties: [{ name: 'role', required: true }],
              },
            },
          ],
        },
      ],
    },
  ])('rejects unsupported execution metadata: %j', (value) => {
    expect(() => semanticMetadataSchema.parse(value)).toThrow();
    expect(() => dataModelMetadataSchema.parse(value)).toThrow();
    expect(() => buildDataModel({ schema: { models: [] }, semantic: value })).toThrow();
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

  it('merges semantic models and columns by name while retaining structure and observations', () => {
    const semantic: Semantic = {
      description: 'Sales definitions',
      properties: { currency: 'USD' },
      models: [
        {
          name: 'orders',
          tableReference: { catalog: 'sales', schema: 'public', table: 'raw_orders' },
          properties: { description: 'Customer orders' },
          columns: [
            { name: 'amount', type: 'DOUBLE', properties: { unit: 'USD' } },
            { name: 'amount_with_tax', type: 'DOUBLE', isCalculated: true, expression: 'amount * 1.1' },
          ],
        },
        { name: 'order_totals', refSql: 'SELECT SUM(amount) AS total FROM orders' },
      ],
      relationships: [],
      views: [{ name: 'all_orders', statement: 'SELECT * FROM orders' }],
      cubes: [
        {
          name: 'revenue',
          baseObject: 'orders',
          measures: [{ name: 'total', type: 'DOUBLE', expression: 'SUM(amount)' }],
        },
      ],
    };
    const original = structuredClone({ schema, profile, semantic });
    const result = buildDataModel({ schema, profile, semantic });

    expect(result.description).toBe('Sales definitions');
    expect(result.properties).toEqual({ currency: 'USD' });
    expect(result.models.map((model) => model.name)).toEqual(['orders', 'customers', 'order_totals']);
    expect(result.models[0]).toMatchObject({
      primaryKey: ['id', 'customer_id'],
      uniqueKeys: ['id'],
      metrics: { row_count: 0 },
      properties: { description: 'Customer orders' },
    });
    expect(result.models[0].columns.map((column) => column.name)).toEqual([
      'id',
      'customer_id',
      'amount',
      'amount_with_tax',
    ]);
    expect(result.models[0].columns[2]).toEqual({
      name: 'amount',
      type: 'DOUBLE',
      notNull: false,
      metrics: { min: null, max: 0, top_values: [], custom: [{ value: false, count: 1 }] },
      properties: { logicalType: 'numeric', unit: 'USD' },
    });
    expect(result.models[2]).toEqual(semantic.models[1]);
    expect(result.relationships).toEqual([]);
    expect(result.views).toEqual(semantic.views);
    expect(result.cubes).toEqual(semantic.cubes);

    result.models[0].columns[2].properties.unit = 'changed';
    result.cubes[0].measures[0].expression = 'COUNT(*)';
    expect({ schema, profile, semantic }).toEqual(original);
  });

  it('replaces a discovered model source without retaining a conflicting table reference', () => {
    const result = buildDataModel({
      schema,
      semantic: { models: [{ name: 'orders', refSql: 'SELECT * FROM raw_orders' }] },
    });

    expect(result.models[0].refSql).toBe('SELECT * FROM raw_orders');
    expect(result.models[0]).not.toHaveProperty('tableReference');
    expect(result.models[0].columns).toEqual(schema.models[0].columns);
  });

  it.each(['model', 'column'])('rejects duplicate semantic %ss', (kind) => {
    const model = { ...schema.models[0] };
    if (kind === 'column') model.columns = [model.columns[0], model.columns[0]];

    expect(() => buildDataModel({ schema, semantic: { models: kind === 'model' ? [model, model] : [model] } })).toThrow(
      `Duplicate semantic ${kind}`
    );
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
