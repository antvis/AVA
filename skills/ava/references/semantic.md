# Semantic

Semantic stores reusable business meaning: metric formulas, eligible records, units, time conventions, and join rules. Knowledge grows incrementally; CLI writes replace a complete snapshot.

## File

| Item | Rule |
| --- | --- |
| Location | Use the user's location or project convention; otherwise `.ava/semantics/<source-key>.json`. |
| Identity | Use a stable source/reporting-scope key, not the temporary session ID. |
| Contents | Reusable definitions with their source, scope, and provenance. |
| Exclude | Temporary filters, guesses, answers, profile statistics, credentials, and personal records. |

Keep the file outside disposable outputs and the installed skill. Start with plain language:

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

Adapt the example to the actual evidence. Attribute documented rules to their source instead of labeling them user-confirmed. Add `models`, `relationships`, `views`, or `cubes` only when useful. Model names must match the schema; each model needs exactly one of `tableReference`, `refSql`, or `baseObject`, and columns need `name` and `type`. Put measure eligibility rules in its expression or base.

## Incremental Maintenance

```text
Local file + current session + established changes
                       |
                Check scope / merge
                       |
                Complete candidate
                       |
             ava semantic --file
                 /           \
              error         success
                |              |
         Keep old file   Check returned value
                               |
                        Replace local file
```

| Step | Operation |
| --- | --- |
| Read | Read the local file and `ava semantic "$DATASET_ID"`. Check source identity, scope, effective period, and required fields; matching field names alone are insufficient. |
| Merge | Add new rules or revise affected ones. Preserve unrelated definitions and provenance. Clarify material conflicts; temporary report overrides stay in task context. Preserve history for lasting corrections. |
| Load | Write a complete temporary candidate; run `ava semantic "$DATASET_ID" --file semantic-candidate.json`. Pass a plain path without `@`. |
| Save | Check the returned definition before replacing the local file. On load/save failure, retain the previous durable file and report what succeeded. |

`--file` replaces the **entire session definition**. Combine applicable rules before loading; partial files do not merge automatically. Keep each durable file within its source/scope. If the user requests no persistence, keep task context without a durable file.

## Runtime Behavior

| Operation | Behavior |
| --- | --- |
| Read | Returns the current definition, initially `{}`. |
| Invalid write | Preserves the previous session value. |
| Load `{}` | Clears session semantic. |
| Update schema/profile | Retains semantic. |
| New session | Starts empty; reload compatible local definitions. |
| `analyze`, `translate`, `suggest` | Receive loaded semantic as model context. |
| `query` | Executes supplied code; the agent must implement the business rules explicitly. |

Structure validation does not verify business meaning or SQL correctness. Check new expressions with targeted queries and relevant edge cases. If the CLI lacks `semantic`, use an updated build; do not substitute `schema --file`.
