# Business Semantics

Use this reference to select, store, and load reusable business definitions. The main skill covers deciding when a question needs clarification. Semantic files contain meaning and calculation rules; schema contains structure, and profile contains observed statistics.

## Select the Applicable Definition

Read the session's current definition with:

```sh
ava semantic "$DATASET_ID" > semantic-session.json
```

Use the user's location or an existing project convention for durable files. Otherwise use `.ava/semantics/<source-key>.json` under the analysis project. Choose a stable key for the logical source and reporting scope, not the temporary `datasetId`. Search there before creating a file, and keep learned definitions outside the installed skill and disposable output folders.

Check the source identity (project-relative file, database/schema/table, or Bitable table), reporting scope, effective period when relevant, referenced fields/types, and dialect. Identical field names do not establish source identity. Monthly exports may share a known contract; another tenant or changed refund meaning needs rechecking. Refresh schema for a new session and revisit only affected definitions.

When definitions overlap, distinguish different scopes or effective periods from actual conflicts. Resolve material conflicts before combining them. An explicit request may override a rule for the current task without changing the saved default. For a permanent correction, retain history or use version control; confirmation date and effective date are different facts.

## Represent Meaning as Semantic JSON

Use AVA's `Semantic` shape. A `description` plus `properties` is enough for a plain-language rule. Add structured objects when they make the calculation reusable:

| Object | Purpose and constraints |
| --- | --- |
| `models` | Source/field meaning and calculated expressions. Match discovered names and preserve physical qualifiers. Each model requires exactly one of `tableReference`, `refSql`, or `baseObject`; columns require `name` and `type`. |
| `relationships` | Verified join conditions and cardinality. Observed uniqueness alone is not a permanent key contract. |
| `views` | Reusable read-only query statements. |
| `cubes` | Aggregation expressions, dimensions, and time dimensions. Put eligibility rules in the measure or its base so regrouping retains them. |

Record source identity and scope in `properties`, and evidence/provenance and confirmation date at the level of the rule they support. Attribute documentation to its actual source; use `confirmedBy: "user"` only for a user confirmation. Preserve provenance for unchanged rules. Add effective dates only when supplied. These property keys are agent conventions, not CLI-enforced applicability checks.

For example, a user confirms that this export contains one row per order, amounts are USD, revenue includes paid and refunded orders minus cumulative refunds, null refunds mean zero, and reporting follows the original order date:

```json
{
  "description": "One row per order. USD revenue follows the original order date and subtracts cumulative refunds; null refunds mean zero.",
  "properties": {
    "source": { "type": "csv-file", "path": "data/orders.csv" },
    "scope": "Sales operations order reporting",
    "confirmedBy": "user",
    "confirmedAt": "2026-11-02"
  },
  "cubes": [{
    "name": "sales",
    "baseObject": "data",
    "measures": [{
      "name": "net_revenue",
      "expression": "SUM(CASE WHEN status IN ('paid', 'refunded') THEN amount - COALESCE(refund_amount, 0) ELSE 0 END)",
      "type": "DOUBLE",
      "description": "Paid and refunded orders after refunds; pending and cancelled orders do not count.",
      "properties": { "unit": "USD", "synonyms": ["revenue", "net sales"] }
    }],
    "dimensions": [{ "name": "region", "expression": "region", "type": "VARCHAR" }],
    "timeDimensions": [{ "name": "order_date", "expression": "CAST(ordered_at AS DATE)", "type": "DATE" }]
  }]
}
```

Adapt names, types, dialect, and rules to the actual source and evidence. `baseObject: "data"` refers to the discovered model; a separate semantic model is unnecessary unless adding model/field meaning or mappings. The example records one confirmation at the shared level; place later independent confirmations on the affected objects.

Save the reusable rule rather than the entire request. “Revenue is paid amount minus refunds” can be reused; “show last month in East” remains a query parameter unless it defines a recurring report. Keep pending guesses, computed answers, profiling `metrics`, credentials, raw personal records, and chat transcripts out of semantic.

## Replace a Complete Session Definition

`--file` replaces the **whole** session definition. Read the saved file and session first, reconcile by name and scope, and preserve unrelated entries and properties. Do not shallow-merge arrays or load several files sequentially expecting them to merge. When multiple files apply, build a combined task-local JSON after resolving overlaps; keep each durable file within its own source/scope.

Write a complete candidate to a temporary JSON file, then load and read it back:

```sh
ava semantic "$DATASET_ID" --file semantic-candidate.json > semantic-applied.json
ava semantic "$DATASET_ID" > semantic-readback.json
```

Pass a plain path without `@`. The command validates structure and returns the saved definition. Invalid input leaves the old session definition intact. Verify readback against the intended snapshot before replacing the canonical local file. Preserve history where needed. On load/save failure, retain the previous durable file and report what actually succeeded. If the user requests no persistence, keep task context without a durable file.

Structure validation does not establish SQL correctness, source compatibility, or business truth. Verify new expressions with targeted queries or known examples covering the relevant exclusions, refunds, nulls, denominators, and joins. Keep user confirmation distinct from expression execution-validation. If evidence conflicts with a rule, investigate or clarify instead of rewriting the meaning silently.

## Reuse Across Calls and Sessions

`analyze`, `translate`, and `suggest` receive loaded semantic as model context. `query` executes the supplied DSL: expand measures, logical views, and calculated columns in SQL/CTEs or implement them in Python/JavaScript. Semantic creates no physical database objects and enforces no filters or permissions.

Reading semantic returns the saved value, initially `{}`, without model calls or statistical computation. A file containing `{}` explicitly clears session semantic without deleting local files. Schema/profile updates retain it; disposal or session expiry loses it. Keep the durable JSON and reload applicable definitions for each new session.

If the installed CLI lacks `semantic`, use an updated build or upgrade it. Until available, apply known definitions in agent-written queries and disclose that session injection is unavailable. Do not substitute `schema --file` for semantic.
