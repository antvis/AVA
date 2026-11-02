# Semantic

Semantic stores reusable business meaning, such as metric formulas, eligible records, units, time conventions, and join rules. It grows incrementally as analysis clarifies these meanings.

## Keep a Local Definition

Use the user's location or existing project convention; otherwise use `.ava/semantics/<source-key>.json`. Choose a stable key for the source and reporting scope, not the temporary session ID. Keep the file outside disposable outputs and the installed skill.

Start with a plain-language definition:

```json
{
  "description": "Revenue is paid amount minus cumulative refunds. Null refunds mean zero.",
  "properties": {
    "source": "data/orders.csv",
    "scope": "Sales operations order reporting",
    "confirmedBy": "user",
    "confirmedAt": "2026-11-02"
  }
}
```

Adapt this example to the actual evidence. Record documentation as its source rather than labeling it user-confirmed. Add structured `models`, `relationships`, `views`, or `cubes` only when useful. Model names must match the schema; each model needs exactly one of `tableReference`, `refSql`, or `baseObject`, and columns need `name` and `type`. Put measure eligibility rules in its expression or base.

## Read, Merge, and Write

1. Read the existing local file and `ava semantic "$DATASET_ID"`. Check source identity, scope, effective period, and required fields before reuse; matching field names alone are insufficient.
2. Add newly established rules or revise affected ones. Preserve unrelated definitions and their provenance. Temporary report overrides stay in task context; clarify material conflicts before changing a reusable default. Preserve history for lasting corrections.
3. Write the complete candidate to a temporary file and load it:

   ```sh
   ava semantic "$DATASET_ID" --file semantic-candidate.json
   ```

4. Check the returned definition, then replace the local file with the accepted candidate. If loading or saving fails, retain the previous durable file and report what succeeded.

Knowledge is maintained incrementally, but `--file` **replaces the entire session definition**. It takes a plain path without `@`. Do not load partial files sequentially expecting a merge; combine applicable rules first and keep each durable file within its source/scope. Keep temporary filters, guesses, answers, profile statistics, credentials, and personal records out of semantic.

## Apply and Reuse

Structure validation does not verify business meaning or SQL correctness. Check new expressions with targeted queries and relevant edge cases. `analyze`, `translate`, and `suggest` use loaded semantic as model context; agent-written `query` code must implement the rules explicitly.

Reading returns the current definition, initially `{}`. Invalid writes preserve the previous value; loading `{}` clears it. Schema/profile updates retain semantic. New sessions start empty, so reload compatible local definitions. If the installed CLI lacks `semantic`, use an updated build; do not substitute `schema --file`.
