# AVA Agent

Evaluate a generic [Eve](https://github.com/vercel/eve) agent with and without the AVA Skill. Python executes the real AVA CLI in Docker.

## Setup

Requires **Node.js 24+**, a running Docker engine, and the main repository's dependencies installed.

```bash
cd evals/ava-agent
nvm use
npm install
npm run sandbox:build
test -f .env || cp .env.example .env
```

Fill in all three required variables in `.env`:

```dotenv
OPENAI_MODEL=your-model
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://your-provider.example.com/v1
```

Use an OpenAI-compatible **Chat Completions** API. `MODEL_CONTEXT_WINDOW` is optional (default: `128000`). Configuration priority: process environment → `.env` → `../.env`. Do not commit credentials or lock files.

## Run

```bash
npm run typecheck                         # Static check; no model call
npm run eval -- --list                    # List cases; no model call
npm run eval -- --limit 1 --skill ava     # Try one question
npm run eval -- --skill ava               # Require AVA Skill (default)
npm run eval -- --skill none              # Same cases without Skill
npm run dev                              # Interactive UI; open the printed URL
```

`--skill ava` instructs the agent to load AVA before other tools and follow the Skill using the CLI; evaluation fails if loading does not succeed. `--skill none` removes the Skill and its loading tool.

DataBench is the only evaluation. Each case attaches a Parquet file; expected answers stay outside the sandbox and final JSON replies are scored directly. `dev` has no preloaded sample data or automatic scoring; use `--skill none` for a manual comparison without the Skill.

## DataBench adapter

The shared DataBench plugin provides question selection and answer scoring. `evals/` contains only `databench.eval.ts`, which handles command options, host snapshots, Eve configuration, and cases. Eve requires an `evals.config.ts` entry point; it is generated only inside each run snapshot and re-exports the configuration from `databench.eval.ts`. The shared `scripts/run.mjs` handles Eve and sandbox lifecycle without DataBench-specific logic. Download the dataset once and run from the repository root:

```bash
node evals/databench/fetch.js
node evals/cli.js run ava-agent --benchmark databench --limit 20 --skill ava
node evals/cli.js run ava-agent --benchmark databench --limit 20 --skill none
node evals/cli.js run ava-agent --benchmark databench --limit 2 --list
```

Selection matches AVA Workflow: `--dataset databench-lite|databench` (default: `databench-lite`), `--suite`, `--offset` (default: `0`), and `--limit <number|all>` (default: `20`). Other execution options are forwarded to Eve. `--help` lists adapter options without running a model.

Each selected question gets its own session and Parquet attachment. Benchmark code, selected questions, and data files are snapshotted on the host; gold answers are never sent to the agent. The final reply must be a JSON value and is scored using the shared `databench-answer` rule. Skill and tool checks remain separate assertions.

Predictions are written to `.runs/<id>/predictions.csv` (`id`, `predicted_answer`, `error`) and can be scored by `node evals/cli.js score --predictions <file.csv>`. Each invocation is a fresh run; there is no resume support. `npm run eval -- [options]` calls the same DataBench adapter from this directory. Download DataBench before listing or running cases.

## Results and maintenance

- Reports: `.runs/<id>/.eve/evals/`; predictions: `.runs/<id>/predictions.csv`.
- DataBench measures tabular answer accuracy, not chart quality or open-ended analysis.
- After changing AVA source or the sandbox Dockerfile, rerun `npm run sandbox:build`. Agent, Skill, and eval changes only require restarting.
- Each invocation copies a new project into `.runs/`. Edit source files here, not generated copies. Sandbox execution has no network access.
