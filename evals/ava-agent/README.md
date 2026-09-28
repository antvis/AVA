# AVA Agent — Skill evaluations with Eve

This is an **external evaluator around a generic Eve agent**. It does not replace DataBench:

- `../databench/`: evaluates AVA's internal analysis strategies.
- `ava-agent/`: evaluates a host agent using the real AVA Skill and CLI.

```text
Eve eval (task + expected answer + assertions, outside the sandbox)
  → Eve agent (generic instructions + optional AVA Skill)
    → Python tool → real AVA CLI in a session-owned Docker container
  ← final reply, actual output files, tool events
```

The agent is unaware of expected answers. It gets only the user task, the attached input data, the installed runtime tools, and optionally the Skill. The sample `evals/fixtures/sales.csv` belongs to the evaluator: each case loads it with Eve's native `session.sendFile()`. Eve stages the attachment in that session's sandbox and provides its path to the model. The agent workspace and ordinary `dev` sessions no longer preinstall this sample. There is no custom agent loop, planner, AVA-specific tool, or nested model call. Eve owns the loop, progressive skill loading, sessions, and evaluation reports.

## Setup

Prerequisites: **Node.js 24+**, a running Docker engine, and the main repository's dependencies installed. This package is independent; AVA's own Node requirement and dependencies are unchanged.

```bash
cd evals/ava-agent
nvm use                  # or otherwise select Node 24+
npm install
npm run sandbox:build
cp .env.example .env
```

`package-lock.json` stays local and is not committed to Git. The runner archives it when present but also works without it. Without a shared lock file, transitive dependency versions can differ between installations.

Set all three required variables in `.env`: `OPENAI_MODEL`, `OPENAI_API_KEY`, and `OPENAI_BASE_URL`. The URL must point to your OpenAI-compatible **Chat Completions** API base (for example, `https://your-provider.example.com/v1`); there is no default endpoint. Missing, empty, or whitespace-only values fail before a real `dev` or `eval` run starts. `--list`, `--help`, type checking, and sandbox builds do not require model credentials. Set `MODEL_CONTEXT_WINDOW` to the selected model's actual context window (default: 128000).

The runner also reads `../.env` for compatibility with existing eval configuration. Process environment variables take precedence, followed by this package's `.env`, then `../.env`. Do not commit credentials. No Vercel account or cloud sandbox is required, and CLI telemetry is disabled for these runs.

`sandbox:build` builds the current repository's `lib/` and `esm/`, then creates an image containing Node, Python, pandas, pyarrow, and that AVA build. The Docker build context contains only runtime files, not the repository, credentials, or evaluator. Network is allowed during dependency installation but **disabled in live agent containers**. The runner uses the recorded immutable image ID. Rebuild after changing AVA source or the sandbox Dockerfile; the runner checks both. No rebuild is needed for Skill-only changes.

## Run

```bash
# Interactive generic host with the real AVA Skill
npm run dev

# Independent, comparable evaluations
npm run eval -- --skill ava
npm run eval -- --skill none

# Inspect/filter the native Eve evals
npm run eval -- --list
npm run eval -- aggregate --skill ava
npm run eval -- --skill ava --tag qa --json
```

`--skill ava` is the default. Both variants use the same model, data, Python tool, CLI image, and budgets:

| Variant | Instructions | Execution tools | Skill |
| --- | --- | --- | --- |
| `none` | Generic | Python | None |
| `ava` | Same generic instructions | Python | Exact snapshot of `../../skills/ava/` |

With `ava`, Eve additionally exposes its native `load_skill` context tool. Only the description is initially advertised; the model chooses whether to load the full instructions and read references. The Skill is not rewritten or pre-injected as a workflow. Default bash, file, web, and subagent tools are disabled.

Each invocation creates a separate `.runs/<timestamp>-<variant>-<id>/` Eve project. Agent, Skill, helper, and eval files are copied, so concurrent variants cannot overwrite each other's configuration. Dependencies are shared through a node_modules symlink. `eve dev` edits affect only this generated project: change the source templates here and restart to make lasting changes.

## External evaluation

Native `.eval.ts` files are evaluation cases, **not development unit/integration tests**. No separate test suite is included.

The initial small suite covers:

- Paid amount aggregation by region, excluding refunds.
- Distinct customer count and average line amount, distinguishing missing values from zero.
- Correct totals plus an actual HTML chart file.

Cases specify output contracts, not which tools or commands to use. Expected answers remain in the host-side evaluator. The agent returns the requested JSON object directly in its final reply; the evaluator parses `turn.message` and compares it with the expected object. Invalid JSON, Markdown fences, or extra prose fail the format check. There is no answer-file requirement, repair model, or artifact polling in ordinary QA scoring.

Skill activation is a **soft diagnostic metric**, separate from answer correctness. Use Eve's native tool traces, timing, and provider-reported usage for inspection. `ava` points directly to the real CLI entry point: there is no audit wrapper, extra CLI log, or metric that treats a help call as evidence of analysis.

Only the chart case waits for a file snapshot. An observe-only hook in eval runs copies a bounded `chart.html` from the sandbox without adding model context or another agent turn. QA scoring does not depend on this hook, and `dev` runs omit it entirely.

Chart checks currently verify the answer data and HTML artifact structure, **not visual correctness, field mapping, or browser rendering**. AVA-generated HTML loads GPT-Vis from a CDN when opened; producing the file works offline, but browser rendering needs access to that CDN. Passing these few cases is a smoke result, not proof of general Skill effectiveness. Use repeated matched runs and additional tasks before drawing quality conclusions.

## Reports and limits

Under each `.runs/<id>/`:

- `run.json`: variant, model endpoint, Skill/agent/helper/eval hashes, AVA source/build and sandbox recipe hashes, and Docker image identity.
- `.eve/evals/<run>/`: native Eve summary, assertion outcomes, event streams, usage when reported by the provider, and logs.
- `artifacts/<session>/`: optional `chart.html` and a bounded snapshot receipt in eval runs. The single-turn chart case rejects missing/truncated files or collection failures. Ordinary QA is scored from the final reply, not these files.
- `exit.json`: process exit code, signal, and completion time.

Defaults: one concurrent eval, 180 seconds per case, 60 seconds per Python call, and 32 KiB retained per stdout/stderr stream. Python starts fresh each call, but files, temporary directory, and AVA background processes persist within that session. Eve's session token budgets are 200k input / 24k output tokens (checked before subsequent model calls, not hard per-call ceilings). A parked quota approval is not a successful eval. The 30-tool-call assertion is a post-run efficiency gate, not an execution cutoff.

Docker isolates evaluator files and model credentials from execution; it is not a claim of hardened multi-tenant isolation. Do not mount host secrets or the Docker socket into the agent image. Configure Docker CPU/memory limits for large or untrusted workloads. Eve stops session containers on evaluator shutdown; stopped filesystem state, templates, local images, and run artifacts can remain for inspection and need periodic cleanup. Do not run broad Docker prune commands against unrelated workloads.

For static validation, use `npm run typecheck`. A real Skill evaluation requires a model API key; deterministic/mock model wiring checks are not evidence of Skill effectiveness.

References: [Eve skills](https://eve.dev/docs/skills), [Eve evals](https://eve.dev/docs/evals/overview), [Docker sandbox](https://eve.dev/docs/sandbox/docker). Eve is pinned to 0.67.2; the installed `node_modules/eve/docs/` is the version-matched API reference.
