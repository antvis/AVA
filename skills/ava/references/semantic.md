# Business Semantics

Semantic records reusable business meaning: metric formulas, field meanings, eligible records, units, time conventions, and join rules. Schema describes structure; profile contains observations such as row counts. Keep computed answers and profiling statistics out of semantic.

## Resolve Meaning Before Calculation

First inspect relevant session and saved definitions, source documentation, the user's explicit instructions, and the actual schema. Use targeted queries to establish physical facts such as status values or duplicate join keys. Queries cannot establish which statuses the business intends to count.

Ask when plausible interpretations could materially change the requested answer and the available context does not resolve them. Clarify only the relevant gaps:

| Ambiguity | What to resolve |
| --- | --- |
| Population and grain | Orders or order lines; eligible statuses; test records; distinct entity and deduplication rules. |
| Formula | Gross or net amount; refunds, taxes, and discounts; ratio numerator and denominator; weighted or unweighted average. |
| Time | Order, payment, or refund date; timezone; calendar or fiscal periods; period boundaries. |
| Units and missing values | Currency and conversion rule; amount scale; whether null means zero, unknown, or excluded. |
| Joins | Join keys and cardinality; unmatched records; prevention of double counting. |

Do not turn this table into a questionnaire. For example: “Revenue could mean paid amount or paid amount minus refunds. Which should this report use? Should refunds follow the original order date or the refund date?” Mention existing definitions when they conflict. Ask about the scope of a correction when it is unclear whether it applies only to this report or changes the reusable definition.

An explicit definition in the current request needs no repeated confirmation. Applicable documented definitions may also be reused with attribution. Samples, inferred names, and an agent's recommended default are not user confirmation. If a material answer is pending, wait on the affected computation. If the user delegates the choice, disclose the task-specific assumption without promoting it to a confirmed reusable rule. For noninteractive tasks, report the unresolved definition or clearly separate alternative calculations rather than silently choosing one.

## Find and Reuse Definitions

Read the current session:

```sh
ava semantic "$DATASET_ID" > semantic-session.json
```

Use an established project location or one supplied by the user. Otherwise keep reusable files in `.ava/semantics/<source-key>.json` under the analysis project, outside a disposable output folder. Choose a stable, descriptive key for the logical source and reporting scope, not the temporary `datasetId`. Search this location before creating a new file. Do not store learned definitions inside the installed skill.

Check applicability before loading: source identity (such as project-relative file, database/schema/table, or Bitable table), business scope, effective period when relevant, required fields/types, and query dialect. Matching column names alone do not make two sources equivalent. A new monthly export may reuse a known contract; a different tenant or changed refund meaning needs rechecking. Rediscover schema after reloading a source and revisit only the definitions affected by changes.

Use the current explicit request for this task. If it differs from a saved rule, make the difference visible; do not silently change the shared default. An unclear conflict between saved or documented definitions needs clarification before use. Distinguish temporary overrides, permanent corrections, and rules that apply from a given date. Keep historical versions or use version control when changing an established definition; do not erase a valid historical rule.

## Record Confirmed Meaning

Save only the reusable portion of a confirmation. “Revenue is paid amount minus cumulative refunds” can be reused; “show last month in East” is a query parameter unless the user defines it as a recurring reporting rule. Never save a pending guess as confirmed or include credentials, raw personal records, or full chat transcripts.

Use AVA's `Semantic` JSON shape. Start with `description` and `properties`; add structured objects only when useful:

- `models`: source/field descriptions and calculated expressions. Model names must match discovered names; each model needs exactly one of `tableReference`, `refSql`, or `baseObject`. Preserve physical qualifiers. Columns need `name` and `type`.
- `relationships`: verified join conditions and cardinality. Observed uniqueness alone is not a permanent key contract.
- `views`: reusable read-only query statements.
- `cubes`: measures with aggregation expressions, dimensions, and time dimensions. Include eligibility rules in the measure or its base so a later grouping does not lose them.

Record source identity, reporting scope, confirmation evidence, and date in `properties`, at the level of the rule being confirmed. Preserve provenance for unchanged rules rather than marking the entire file newly confirmed. Record effective dates only when supplied, and distinguish them from the confirmation date. These properties are conventions for the agent, not CLI-enforced scope checks.

For example, after a user confirms one row per order, USD net revenue from paid and refunded orders, cumulative refunds on the original order, order-date attribution, and zero for missing refunds, save:

```json
{
  "description": "Order reporting definitions for the sales export.",
  "properties": {
    "source": { "type": "csv-file", "path": "data/orders.csv" },
    "scope": "Sales operations order reporting"
  },
  "models": [
    {
      "name": "data",
      "tableReference": { "table": "data" },
      "properties": {
        "grain": "One row per order; refunds are cumulative on the original order.",
        "confirmedBy": "user",
        "confirmedAt": "2026-11-02"
      }
    }
  ],
  "cubes": [
    {
      "name": "sales",
      "baseObject": "data",
      "measures": [
        {
          "name": "net_revenue",
          "expression": "SUM(CASE WHEN status IN ('paid', 'refunded') THEN amount - COALESCE(refund_amount, 0) ELSE 0 END)",
          "type": "DOUBLE",
          "description": "Net revenue; pending and cancelled orders do not count.",
          "properties": {
            "unit": "USD",
            "synonyms": ["revenue", "net sales"],
            "confirmedBy": "user",
            "confirmedAt": "2026-11-02",
            "confirmation": "Count paid and refunded orders, subtract cumulative refunds, and treat null refunds as zero. Attribute to the original order date."
          }
        }
      ],
      "dimensions": [{ "name": "region", "expression": "region", "type": "VARCHAR" }],
      "timeDimensions": [{ "name": "order_date", "expression": "CAST(ordered_at AS DATE)", "type": "DATE" }]
    }
  ]
}
```

Adapt the example to the actual schema, dialect, and confirmation; its names and rules are not defaults. A rule may be confirmed before its expression has been execution-validated; do not confuse the two.

## Load, Validate, and Maintain

Each setter replaces the **complete** session definition. Read both the saved file and session first, reconcile definitions by name and scope, and preserve unrelated entries and properties. Do not shallow-merge arrays or replace the session with only the latest metric. When several files apply, build a combined task-local Semantic JSON after resolving overlaps; do not load them sequentially expecting a merge.

Write the complete candidate to a temporary JSON file, then load it:

```sh
ava semantic "$DATASET_ID" --file semantic-candidate.json > semantic-applied.json
ava semantic "$DATASET_ID" > semantic-readback.json
```

`--file` takes a plain path, without `@`. The command validates structure and returns the saved definition. An invalid definition leaves the previous session value intact. Readback should match the intended full definition. After successful loading, replace the canonical local file with the validated candidate, preserving history where needed. If loading or saving fails, retain the previous reusable file and report what succeeded. If the user asks not to persist, keep task-specific context without creating a reusable file.

Structure validation does not check SQL correctness, source compatibility, or business truth. Validate new expressions with targeted queries and known examples, including exclusions, refunds, nulls, empty populations, and join multiplication as relevant. Compare the query with the confirmed rule. If evidence contradicts it, investigate the mapping or ask about the conflict; do not silently rewrite business meaning to fit the data.

`analyze`, `translate`, and `suggest` use the loaded definitions as model context. `query` executes exactly the DSL supplied by the agent: expand measure expressions, logical views, and calculated columns in SQL/CTEs or implement their meaning in Python/JavaScript. Semantic does not create physical columns or views, enforce filters, or grant access.

Schema/profile updates retain semantic. Disposal or session expiry loses it; keep the local JSON and reload applicable definitions for each new session. Reading semantic without `--file` returns the current value (initially `{}`), without model calls or statistical computation. A file containing `{}` explicitly clears the session definition; it does not delete saved files. If an installed CLI lacks `semantic`, use the project's updated build or upgrade it; until then, apply definitions in agent-written queries and disclose that session injection is unavailable. Do not use `schema --file` as a substitute.
