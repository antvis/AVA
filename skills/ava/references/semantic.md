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
- Partial confirmation resolves only the agreed parts. Without a clear answer, continue independent data checks but wait on dependent analysis. Pending rules stay in the conversation, never in session Semantic, saved files, or candidate models.
- Temporary filters, task-only definitions, and authorized provisional assumptions stay in task context, labeled in results. Do not load or save them as Semantic; honor requests not to save.

## Apache Ossie Model

AVA accepts one Apache Ossie `0.3.0.dev0` core model in YAML or JSON. Map each logical dataset to a physical table, view or query with `source`. Use `fields` for row-level expressions, `relationships` for paired join fields and `metrics` for reusable calculations. Keys and relationship columns reference declared field names. A dataset metric can reference physical columns as `source.column`. A model metric qualifies fields as `dataset.field`.

`expression.sql` uses the `OSSIE_SQL_2026` dialect. `expression.dialects` holds engine-specific variants. Use `ai_context` for confirmed business usage and provenance. See the [core specification](https://github.com/apache/ossie/blob/aedf08651451306896d98e17657c16c99848ef78/core-spec/spec.md).

### Example

This source has one row per order. Amounts use CNY and missing refunds are zero.

```yaml
version: 0.3.0.dev0
name: paid_order_sales
description: Net revenue for paid orders, in CNY.
ai_context:
  instructions: Group by original payment date. Attribute cumulative refunds to that date.
  definition_source: Confirmed sales reporting rules
datasets:
  - name: orders
    source: orders
    primary_key: [order_id]
    fields:
      - name: order_id
        expression: { sql: order_id }
      - name: paid_date
        expression: { sql: "CAST(paid_at AS DATE)" }
        datatype: Date
    metrics:
      - name: net_revenue
        datatype: Decimal
        expression:
          sql: >-
            SUM(CASE WHEN source.status = 'paid'
              THEN source.paid_amount - COALESCE(source.refund_amount, 0)
              ELSE 0 END)
```

The associated SQL spells out the definition against the loaded source.

```sql
SELECT CAST(paid_at AS DATE) AS paid_date,
       SUM(CASE WHEN status = 'paid'
                THEN paid_amount - COALESCE(refund_amount, 0)
                ELSE 0 END) AS net_revenue
FROM orders
GROUP BY 1
ORDER BY 1;
```

Check that the declared key is unique and reconcile totals across joins and filters. Verify the generated query against known results when applying a new or changed definition.

## Load and Maintain

Save confirmed models in the user's or project's chosen location, otherwise under `.ava/semantics/<source-key>.yaml`. Keep a separate model per source and reporting scope. Record source, effective period and confirmation provenance in `ai_context` when known.

Re-read the saved file and the session model before incorporating a confirmed change. Preserve the applicable definitions and pass a complete model to the CLI.

```sh
ava semantic "$DATASET_ID" --file semantic-candidate.yaml
ava semantic "$DATASET_ID"
ava semantic "$DATASET_ID" --clear
```

The first command replaces the model. Readback returns JSON or `null` when empty. Check the response before updating the durable file. New sessions start empty. Reapply the saved model after loading a source and confirm that its mappings and scope still apply.

AVA checks the official schema and declared model references when loading. Run the [upstream reference validator](https://github.com/apache/ossie/blob/aedf08651451306896d98e17657c16c99848ef78/validation/validate.py) to check expression syntax, metric scoping and portability.
