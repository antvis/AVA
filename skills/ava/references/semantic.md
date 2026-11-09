# Semantic

## Establish Definitions

Read existing session definitions and saved files alongside the actual schema. Confirm source identity, scope, effective period, and fields. Resolve the relevant business choices:

- Row grain and keys; join cardinality and whether joins can multiply amounts.
- Eligible records, formulas, numerator/denominator, null handling, currency, and units.
- Business timestamp, timezone, aggregation grain, and attribution of refunds or adjustments.

Use user-confirmed or authoritative documented definitions within their applicable scope. A value appearing in a saved file or session alone does not establish that it was confirmed. Data checks can verify uniqueness or reconcile totals but do not establish business meaning.

## Resolve and Confirm

```text
Read request + schema + saved/session Semantic
  |
  +-- Confirmed and applicable ----------> Reuse -> SQL
  |
  +-- Missing / unclear / conflicting
        |
        v
      Propose definition + scope; ask user
        |
        +-- Confirmed for reuse --------> Merge -> load/save -> SQL
        +-- Authorized for this task ---> Task context only -> SQL
        +-- Unresolved / no reply ------> Wait; no Semantic writes
```

- A clear, scoped user instruction counts as confirmation. Recheck applicability when the source, schema, or reporting period changes.
- Ask only about unresolved choices, showing their consequences and whether the rule is task-only or reusable.
- Partial confirmation resolves only the agreed parts. Without a clear answer, continue independent data checks but wait on dependent analysis. Pending rules stay in the conversation, never in session Semantic, saved files, or candidate JSON.
- Temporary filters, task-only definitions, and authorized provisional assumptions stay in task context, labeled in results. Do not load or save them as Semantic; honor requests not to save.

## JSON Type Contract

```ts
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Properties = Record<string, JsonValue>;
type Key = string | [string, ...string[]];
type JoinType = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

interface Semantic {
  description?: string;
  properties?: Properties;
  models?: Model[];
  relationships?: Relationship[];
  views?: View[];
  cubes?: Cube[];
}
```

| Type | Required fields | Optional fields |
| --- | --- | --- |
| `Model` | `name: string`; exactly one of `tableReference: TableReference`, `refSql: string`, `baseObject: string` | `columns: Column[]`, `primaryKey: Key`, `uniqueKeys: Key[]`, `dialect: string`, `properties: Properties` |
| `TableReference` | `table: string` | `catalog: string`, `schema: string`; source-specific JSON fields |
| `Column` | `name: string`, `type: string` | `relationship: string`, `isCalculated: boolean`, `isPrimaryKey: boolean`, `notNull: boolean`, `expression: string \| null`, `properties: Properties` |
| `Relationship` | `name: string`, `models: [string, string]`, `joinType: JoinType`, `condition: string` | `properties: Properties`; additional JSON fields |
| `View` | `name: string`, `statement: string` | `dialect: string`, `properties: Properties`; additional JSON fields |
| `Cube` | `name: string`, `baseObject: string`, `measures: [Measure, ...Measure[]]` | `dimensions: Measure[]`, `timeDimensions: Measure[]`, `hierarchies: Record<string, [string, ...string[]]>`, `properties: Properties` |
| `Measure` / dimension / time dimension | `name: string`, `expression: string`, `type: string` | `description: string`, `properties: Properties` |

Names, type labels, and SQL definitions must be nonempty; column `expression` may also be empty or null. Custom annotations belong in `properties`; unknown fields are rejected except the JSON extensions listed above. Profiling `metrics` do not belong in Semantic.

`tableReference` identifies a physical source; `refSql` defines source rows with SQL; `baseObject` refers to another model or view. Reuse a schema model's name to enrich it. `Column.relationship` names a relationship, not a foreign-key column; a relationship column's `type` names its target model. `joinType` describes the first model relative to the second, not `LEFT` versus `INNER JOIN`. Hierarchies list dimension names from coarse to fine.

## Example: Paid-Order Sales

Example assumptions (DuckDB): one row per order/customer; non-null CNY payments; null refunds mean zero; `paid_at` is already business-local time. Cumulative refunds are attributed to the original payment period, not their refund date.

```json
{
  "description": "Net revenue and order value for paid orders, by payment time and customer geography.",
  "properties": {
    "source": "sales warehouse: orders and customers",
    "scope": "Paid-order reporting",
    "definitionSource": "Project sales definitions (example)",
    "currency": "CNY",
    "timezone": "Asia/Shanghai"
  },
  "models": [
    {
      "name": "orders",
      "tableReference": { "table": "orders" },
      "primaryKey": "order_id",
      "properties": { "grain": "One row per order" },
      "columns": [
        { "name": "order_id", "type": "BIGINT", "isPrimaryKey": true, "notNull": true },
        { "name": "customer_id", "type": "BIGINT" },
        { "name": "status", "type": "VARCHAR" },
        { "name": "paid_at", "type": "TIMESTAMP", "properties": { "timezone": "Asia/Shanghai" } },
        { "name": "paid_amount", "type": "DECIMAL(18,2)", "notNull": true, "properties": { "unit": "CNY" } },
        { "name": "refund_amount", "type": "DECIMAL(18,2)", "properties": { "nullMeaning": "No refund" } },
        {
          "name": "net_revenue",
          "type": "DECIMAL(18,2)",
          "isCalculated": true,
          "expression": "paid_amount - COALESCE(refund_amount, 0)",
          "properties": { "unit": "CNY" }
        }
      ]
    },
    {
      "name": "customers",
      "tableReference": { "table": "customers" },
      "primaryKey": "customer_id",
      "columns": [
        { "name": "customer_id", "type": "BIGINT", "isPrimaryKey": true, "notNull": true },
        { "name": "country", "type": "VARCHAR" },
        { "name": "region", "type": "VARCHAR" }
      ]
    }
  ],
  "relationships": [{
    "name": "order_customer",
    "models": ["orders", "customers"],
    "joinType": "MANY_TO_ONE",
    "condition": "orders.customer_id = customers.customer_id",
    "properties": { "joinPolicy": "LEFT JOIN; retain orders without a matching customer" }
  }],
  "views": [{
    "name": "eligible_orders",
    "dialect": "duckdb",
    "statement": "SELECT o.order_id, o.paid_at, o.paid_amount - COALESCE(o.refund_amount, 0) AS net_revenue, COALESCE(c.country, 'Unknown') AS country, COALESCE(c.region, 'Unknown') AS region FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id WHERE o.status = 'paid'",
    "properties": { "eligibility": "status = 'paid'", "grain": "One row per paid order" }
  }],
  "cubes": [{
    "name": "paid_order_sales",
    "baseObject": "eligible_orders",
    "measures": [
      { "name": "net_revenue", "expression": "SUM(net_revenue)", "type": "DECIMAL(38,2)", "properties": { "unit": "CNY" } },
      { "name": "paid_orders", "expression": "COUNT(DISTINCT order_id)", "type": "BIGINT" },
      {
        "name": "average_order_value",
        "expression": "SUM(net_revenue) / NULLIF(COUNT(DISTINCT order_id), 0)",
        "type": "DOUBLE",
        "description": "Net revenue per paid order; undefined when there are no paid orders.",
        "properties": { "unit": "CNY/order" }
      }
    ],
    "dimensions": [
      { "name": "country", "expression": "country", "type": "VARCHAR" },
      { "name": "region", "expression": "region", "type": "VARCHAR" }
    ],
    "timeDimensions": [{ "name": "paid_month", "expression": "DATE_TRUNC('month', paid_at)", "type": "TIMESTAMP" }],
    "hierarchies": { "geography": ["country", "region"] }
  }]
}
```

The example's `properties` keys are conventions, not executable CLI settings.

## Apply Definitions in SQL

Semantic does not create database views, calculated columns, or cubes. Expand their SQL/CTEs explicitly in `query`; a relationship declaration does not perform the join. For the example:

```sql
WITH eligible_orders AS (
  SELECT o.order_id, o.paid_at,
         o.paid_amount - COALESCE(o.refund_amount, 0) AS net_revenue,
         COALESCE(c.country, 'Unknown') AS country,
         COALESCE(c.region, 'Unknown') AS region
  FROM orders o
  LEFT JOIN customers c ON o.customer_id = c.customer_id
  WHERE o.status = 'paid'
)
SELECT DATE_TRUNC('month', paid_at) AS paid_month, country, region,
       SUM(net_revenue) AS net_revenue,
       COUNT(DISTINCT order_id) AS paid_orders,
       SUM(net_revenue) / NULLIF(COUNT(DISTINCT order_id), 0) AS average_order_value
FROM eligible_orders
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;
```

Check customer-key uniqueness and reconcile counts/amounts before and after joins. Keep prior-period definitions separately scoped when a new rule does not replace them.

## Load and Maintain

Save established reusable definitions in the user's/project's location, otherwise `.ava/semantics/<source-key>.json`, keyed by stable source and scope. Keep definitions and provenance outside disposable outputs and the installed skill; exclude pending assumptions, results, temporary filters, credentials, and personal records.

After confirmation, re-read saved files and `ava semantic "$DATASET_ID"`. Merge agreed changes by object/member name, preserving unrelated definitions and provenance. Record source, scope, and any confirmed effective period in `properties`. Resolve new conflicts before writing; skip unchanged files.

Keep different source/reporting scopes distinct. Save a complete merged candidate containing only established definitions, then load it with a plain path (no `@`):

```sh
ava semantic "$DATASET_ID" --file semantic-candidate.json
```

`--file` replaces the entire session value. Check the response before updating the durable file; retain the old file if loading fails. If saving fails after loading, report that only the session was updated. Without an active session, save confirmed JSON for later loading and disclose that it has not been loaded or execution-validated.

New sessions start empty; reload applicable saved definitions. Loading validates structure, not formulas or business meaning.
