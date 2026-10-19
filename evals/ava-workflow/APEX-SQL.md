# APEX-SQL in AVA

This is an independent TypeScript implementation of the core methodology in [APEX-SQL: Talking to the Data via Agentic Exploration for Text-to-SQL](https://arxiv.org/pdf/2602.16720v2), arXiv v2, 2026-05-31. The reference code inspected was [Tencent/APEX-SQL-Project](https://github.com/Tencent/APEX-SQL-Project/tree/8611d3cda9e439a8af00da1153eda1017f5e3bae), commit `8611d3cda9e439a8af00da1153eda1017f5e3bae`.

This implementation reproduces the core method, not the published benchmark scores. Prompts and operation guidance were independently written. It does not import benchmark-specific examples, cached schema selections, candidate answers or gold SQL from the reference repository. No training is required.

## Usage

```ts
const result = await ava.analyze(question, {
  includeSummary: false,
  strategy: {
    type: 'apex',
    evidence: 'Optional domain definitions or question-specific reference material',
    schemaDescriptions: 'Optional table and column descriptions',
    samples: 1,
    maxSteps: 40,
    concurrency: 2,
  },
});
```

Call `source()` first. There is no need to call `profile()`; the workflow evaluator skips static profiling for `apex`. SQL engines only; Python and JavaScript engines are rejected. The model must support tool calls and structured JSON output. Existing `direct`, `loop` and `subset` strategies retain their behavior.

Keep the raw question separate from `evidence` and `schemaDescriptions`. The initial two logical plans and their merger see only the question. Planning temperature is 0.8, aggregation and structured linking stages use 0.2.

Structured stages include the output JSON schema in the prompt as well as the SDK response format. Malformed structured output gets one format-repair retry at temperature zero; both attempts count toward usage. Transport retries remain controlled by `llm.maxRetries`.

## Method mapping

| Paper component | Implementation | Validation |
| --- | --- | --- |
| Logical planning | Two independent plans followed by synthesis | Planning inputs exclude schema and evidence |
| Dual-pathway pruning | Per-table batches; `(columns - deleted) union preserved` | Positive selections rescue columns; unknown identifiers are rejected |
| Semantic linking | Hypothesized functional roles for the pruned schema | Stored in trace |
| Parallel data profiling | Per-table ToolLoopAgents with bounded SQL exploration | Concurrent inference, serial execution on the shared engine |
| Global synthesis | Evidence-based column selection and restoration of declared join paths | Composite foreign keys and bridge tables tested |
| Deterministic guidance | SQL realization keywords mapped to generic operation directives | Stable rules tested for joins, ranking, division and other operations |
| SQL generation | ToolLoopAgent tools `explore`, `consolidate`, `sql`, `confirm` | Real SDK tool execution tested, including error recovery |
| Confirmation | Only a successful, complete result from an earlier turn can be confirmed | Text-only completion, same-turn confirmation and truncated answers rejected |
| Candidate selection | Result voting; model tie-break; optional external selector | Row order, column order, output width and duplicate multiplicity preserved |

Schema identifiers are validated against the engine's discovered metadata. Declared foreign keys can restore bridge columns that pruning discarded. Undeclared joins remain hypotheses for the model to verify; the implementation does not invent metadata constraints from similarly named columns.

## Budgets and evidence

- SQL generation defaults to 40 turns per candidate. Each turn accepts at most one action, even if the model requests multiple tools. The last two turns force SQL synthesis/confirmation.
- Context defaults to 56 × 1024 estimated tokens. Estimation is UTF-8 bytes divided by three, not a provider tokenizer. Near the limit, generation forces SQL/confirmation; exceeding it fails the candidate.
- Each table profiling agent gets four turns, with a report required on the last turn. Table inference concurrency defaults to two.
- Exploratory queries return at most 1,000 rows and 64 KiB. More than 30 returned rows become ten sample rows plus type, distinct-count and NULL-ratio statistics. Statistics explicitly describe only returned rows if truncated; they never claim to describe unseen rows. Long string previews are marked truncated.
- Consolidation removes outdated reasoning/tool messages but retains executed SQL observations and the newest findings/plan. Complete final results remain outside the model context for return and voting.
- The execution engine enforces read-only SQL, query timeouts and answer-result limits. A truncated answer is not eligible for confirmation or voting.
- Errors are fed back for correction. A failed replacement SQL clears the previous candidate. There is no fallback that silently returns an unconfirmed answer.

`result.apex` contains the plan, selected schema, guidance, candidate SQLs/failures, selected candidate index and stage events. `onQueryUsage` receives all successful planning, linking, profiling, generation and tie-break calls. Token usage from a model call that fails before SDK step completion may not be available. Events are also emitted through `reasonend`, allowing evaluators to retain traces when every candidate fails.

## Candidates and ablations

The default is one candidate for development. Set `samples: 8` for eight independent SQL trajectories sharing the linked schema. Each candidate is evaluated against the live engine and must be confirmed before selection. Failed candidates remain visible in the trace.

Voting is deliberately conservative: equal cell values, output width, row order, column order and duplicate multiplicity are required. Column aliases do not affect votes. Ties are resolved by a separate model call. This is an engineering variation from benchmark-specific result normalization; it may split logically equivalent unordered answers.

For BIRD's paper-style reward selection, supply `selectCandidate(candidates)` returning a zero-based index among successful candidates. The callback receives executed results, SQL and confirmation. **The published reward model is not bundled or run automatically**; default voting must not be labelled the paper's BIRD reward-selection configuration.

`ablation` can be `no-planning`, `no-exploration` or `no-guidance`. `no-exploration` disables both table profiling and SQL-agent exploratory queries; candidate SQL execution and correction remain enabled. Keep models, inputs, subsets and candidate budgets identical when comparing runs.

## Evaluation

Requires Node 22.18+ for TypeScript evaluation entry points and a built AVA package.

```sh
npm run build
node evals/cli.js run ava-workflow --benchmark bird --strategy apex \
  --limit 3 --database-description --samples 1 \
  --output evals/ava-workflow/results/bird-apex-smoke

node evals/cli.js run ava-workflow --benchmark bird --strategy apex \
  --limit 147 --samples 8 --ablation no-guidance \
  --output evals/ava-workflow/results/bird-apex-no-guidance

node evals/cli.js run ava-workflow --benchmark spider2lite --strategy apex \
  --limit 3 --samples 1 \
  --output evals/ava-workflow/results/spider2lite-apex-smoke
```

`--limit 147` selects the first 147 cases of the configured dataset; it is **not** the paper's curated 147-case subset. Use explicitly matched IDs for paper comparisons. Model credentials use the existing evaluation configuration. `records/<id>.json` retains APEX traces; manifests include the strategy and implementation hashes for resume validation. DataBench also accepts `--strategy apex --engine duckdb`.

The benchmark adapters continue to use their existing scorers. Gold SQL, answer CSVs and scoring conditions never enter the APEX model input. BIRD passes question, evidence and optional descriptions separately; Spider-Lite separates question and external documents. Final execution accuracy is provided by the existing benchmark report. Schema-recall and Pass@8 require separately verified gold-column annotations and scoring every candidate; the default report does not claim those metrics.

## Reproduction boundaries

The current implementation is an AVA/DuckDB method reproduction. A published-score reproduction still requires:

1. Pinning the exact BIRD dataset (AVA currently defaults to New Dev), IDs, model versions and evaluator revision.
2. Running BIRD candidates natively in SQLite instead of assuming DuckDB equivalence, and installing/running the published reward model.
3. Adding the Spider 2.0-Snow/Snowflake runtime and official evaluation configuration. AVA's existing Spider-Lite SQLite subset is a different task.
4. Matching the original prompt library, tokenizer, exploration allowances, documentation filtering and identical-schema merging. This implementation batches tables but does not yet merge identical schemas or prefilter long reference documents; it uses its own generic directives and a four-turn table exploration budget.
5. Collecting schema-recall annotations and running full-scale experiments/ablations. Small smoke tests establish execution, not accuracy gains or reproduction of headline scores.

Unit/integration checks: `npx vitest run __tests__/apex.test.ts __tests__/subset.test.ts`. These use the real ToolLoopAgent with scripted model responses and a real DuckDB integration fixture, without model credentials.

## Validation on 2026-10-19

- CJS and ESM builds and changed-source ESLint checks passed.
- Offline suite: 333 tests passed, 50 skipped (online/environment-dependent suites disabled). APEX's 16 targeted tests also passed after the final schema validation change.
- Evaluation adapters: all 15 tests passed, including question/evidence separation, skipped static profiling and exclusion of gold inputs.
- Live smoke test: GLM-5.1, BIRD New Dev IDs 0, 1, 2, DuckDB execution, database descriptions enabled, one candidate, 12 generation turns, concurrency three. All three returned confirmed SQL; result accuracy was **1/3 (33.33%)**, with zero missing answers and zero execution errors.

The first exploratory run scored 0/3 and included a structured-planning failure. Subsequent fixes separated free-text planning from structured selections, added one bounded format retry and nonempty final-schema validation, and clarified preservation of explicit formula operands. Earlier run directories were retained. This is a development smoke test on the same three questions, not an independent generalization evaluation, an accuracy-gain claim or a reproduction of the paper's score.

Local run artifacts are under `evals/ava-workflow/results/bird-apex-smoke-final/`: `manifest.json` pins resources/settings/implementation hashes, `records/` contains traces and usage, and `report.json` contains the actual result scores. These generated files are ignored by Git.
