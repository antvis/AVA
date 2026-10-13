# AVA Agent

Evaluate a generic [Eve](https://github.com/vercel/eve) agent with and without the AVA Skill. Bash executes the real AVA CLI in Docker; Python remains available for calculations and data processing. Both tools share session files, run in fresh processes, and have a 60-second timeout and 32 KiB limit per output stream. Bash uses errexit and pipefail.

## Setup

Requires **Node.js 24+**, a running Docker engine, and the main repository's dependencies installed.

```bash
cd evals/ava-agent
nvm use
npm install
npm run sandbox:build
test -f ../../.env || cp ../../.env.example ../../.env
```

Fill in all three required variables in the repository root `.env`:

```dotenv
OPENAI_MODEL=your-model
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://your-provider.example.com/v1
```

Use an OpenAI-compatible **Chat Completions** API. `MODEL_CONTEXT_WINDOW` is optional (default: `128000`). Model name, API key and base URL are read only from the repository root `.env`; inherited process values and package-local `.env` files are ignored. Do not commit credentials or lock files.

## Run

```bash
npm run typecheck                         # Static check; no model call
npm test                                  # SQL adapter checks; no model or Docker calls
npm run eval -- --list                    # List cases; no model call
npm run eval -- --limit 1 --skill ava     # Try one question
npm run eval -- --skill ava               # Require AVA Skill (default)
npm run eval -- --skill none              # Same cases without Skill
npm run dev                              # Interactive UI; open the printed URL
```

`--skill ava` instructs the agent to load AVA before other tools and follow the Skill using the CLI; evaluation fails if loading does not succeed. `--skill none` removes the Skill and its loading tool.

DataBench, BIRD dev, and the Spider2-Lite SQLite subset are supported. Each DataBench case attaches a Parquet file; expected answers stay outside the sandbox. Eve requires `{ answer: string, sql: string }` for each turn. The answer is DataBench text (scalars or JSON arrays), scored by the shared benchmark rule; numeric categories and null list elements are not rejected by an extra type gate. This avoids providers coercing nullable scalar/array tool arguments to strings. `dev` has no preloaded sample data or automatic scoring; use `--skill none` for a manual comparison without the Skill.

The HTTP channel accepts uploads up to 1 GiB per file. Restart `npm run dev` after changing `agent/channels/eve.ts` so the new run snapshot picks up the policy.

## DataBench adapter

The shared DataBench plugin provides question selection and answer scoring. `evals/databench.eval.ts` handles command options, host snapshots, Eve configuration, and cases. Eve requires an `evals.config.ts` entry point; it is generated only inside each run snapshot and re-exports the configuration from `databench.eval.ts`. The shared `scripts/run.mjs` handles Eve and sandbox lifecycle without DataBench-specific logic. Download the dataset once and run from the repository root:

```bash
node evals/databench/fetch.js
node evals/cli.js run ava-agent --benchmark databench --limit 20 --skill ava
node evals/cli.js run ava-agent --benchmark databench --limit 20 --skill none
node evals/cli.js run ava-agent --benchmark databench --limit 2 --list
```

Selection matches AVA Workflow: `--dataset databench-lite|databench` (default: `databench-lite`), `--suite`, `--offset` (default: `0`), and `--limit <number|all>` (default: `20`). Other execution options are forwarded to Eve. `--help` lists adapter options without running a model.

Use `--retry-errors <csv>` with the original dataset and full selection to rerun only rows with a nonempty `error`. Successful execution rows (including wrong answers) are preserved. Once all selected rows are present, the original CSV is atomically replaced; interrupted runs leave it intact. Do not combine this option with `--resume`.

Use `--resume <csv>` (repeatable) to import matching completed rows into a new run and execute only missing IDs. Imported rows, including failed answers, retain their original values. Duplicate IDs or incompatible columns are rejected. `run.json` records source CSV paths and the imported row count; results may therefore combine historical and current agent versions.

Each selected question gets its own session and Parquet attachment. Evaluation attachments use Eve URL references resolved from numbered Parquet files in the run snapshot, avoiding large base64 payloads in durable events. The resolver rejects arbitrary host paths and files over 1 GiB. Benchmark code, selected questions, and data files are snapshotted on the host; gold answers are never sent to the agent. The answer is scored using the shared `databench-answer` rule. Skill and tool checks remain separate assertions.

During execution, predictions are written to `.runs/<id>/predictions.csv`. After all selected questions have result rows, the final CSV is copied to `results/<dataset>-<id>.csv`, including runs with failed answers. Interrupted or incomplete runs retain partial results only in `.runs/`; `--list` does not publish a result. Each invocation uses a unique filename and does not overwrite previous results. Historical rows are imported only when `--resume` is supplied.

CSV columns match AVA Workflow: `id`, `predicted_answer`, `sql`, `error`, `model`, `duration_ms`, `input_tokens`, `output_tokens`, `total_tokens`. Both writers share the same column definition. `sql` contains the agent-reported SQL used for the answer, or an empty string when no SQL was used. Duration covers the entire question, including tools. Tokens sum all model steps for the question; incomplete or unavailable usage stays empty rather than being reported as zero. Failed questions retain usage when reported by Eve.

Score a final CSV with `node evals/cli.js score --dataset <dataset> --predictions <file.csv>`. `npm run eval -- [options]` calls the same DataBench adapter from this directory. Download DataBench before listing or running cases.

## BIRD and Spider2-Lite

`evals/bird.eval.ts` owns BIRD selection, typed JSON output, and exact row-set scoring against SQLite gold. `evals/spider2lite.eval.ts` owns SQLite-subset selection, reference context, CSV output, and official scoring. `evals/sql.ts` shares the Agent execution and run lifecycle; it does not choose a scoring rule.

Both benchmarks use the same isolated Eve agent and `--skill ava|none` comparison as DataBench. Download resources as described in [BIRD](../BIRD/README.md) and [Spider2-Lite](../spider2lite/README.md), then run from the repository root:

```bash
node evals/cli.js run ava-agent --benchmark bird --check --limit 1
node evals/cli.js run ava-agent --benchmark bird --skill ava --limit 20
node evals/cli.js run ava-agent --benchmark spider2lite --check --limit 1
node evals/cli.js run ava-agent --benchmark spider2lite --skill none --limit 20
```

Use `--list` to inspect questions, or `--help` for options. Both support `--root`, `--suite`, repeatable `--id`, `--offset`, and `--limit <number|all>`. `--check` validates resources and the host Python scorer without calling the model or Docker. It does not load/profile databases through AVA. Spider2-Lite covers only local SQLite questions and includes their external reference documents. BIRD includes question evidence. Gold answers remain on the host.

The adapter snapshots each selected database once and attaches the appropriate SQLite file to each session through the same `ava-fixture:` attachment channel as DataBench. Both HTTP uploads and evaluation attachments allow up to 1 GiB per file. The agent writes complete typed rows to `/workspace/output/result.json` and returns its executed SQL. The host retrieves that file before container cleanup; invalid, truncated, over-10,000-row, or over-64-MiB results fail explicitly. SQL is recorded, not re-executed for scoring. BIRD uses the shared exact row-set comparator against SQLite gold; Spider2-Lite uses the official CSV result comparator. Accuracy is reported in `report.json` after Eve finishes, separately from Eve's tool and Skill assertions.

Completed selections publish `results/<benchmark>-<run-id>/` containing `manifest.json`, `run.json`, `predictions.csv` (SQL, errors, timing and tokens), `sql/`, `exec_result/`, `records/`, and `report.json`. Incomplete runs remain in `.runs/`. These adapters do not support DataBench's `--resume` or `--retry-errors` options. Offline scoring uses the run directory:

```bash
node evals/cli.js score --dataset bird --predictions evals/ava-agent/results/<bird-run>
node evals/cli.js score --dataset spider2lite --predictions evals/ava-agent/results/<spider2lite-run>
```

Pass the original `--root` when using a custom dataset location. Scorer dependencies and `--python` follow the benchmark documentation. `npm run eval` remains the DataBench shortcut.

## Results and maintenance

Each completed or failed evaluation deletes its own Docker session containers after saving its CSV row. After the eval subprocess exits (including crashes and interrupts), the runner also reclaims leftover containers matched to that run's local session records. Other sessions, images, and volumes are preserved. Cleanup failures are logged without replacing the evaluation result; killing the runner itself may still require manual cleanup.

- Final predictions: `results/<dataset>-<id>.csv`; detailed reports: `.runs/<id>/.eve/evals/`.
- DataBench measures tabular answer accuracy, not chart quality or open-ended analysis.
- After changing AVA source or the sandbox Dockerfile, rerun `npm run sandbox:build`. Agent, Skill, and eval changes only require restarting.
- Each invocation copies a new project into `.runs/`. Edit source files here, not generated copies. Sandbox execution has no network access.
