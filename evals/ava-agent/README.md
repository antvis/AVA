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
npm run eval -- aggregate --skill ava     # Try one case
npm run eval -- --skill ava               # All cases with Skill (default)
npm run eval -- --skill none              # Same cases without Skill
npm run dev                              # Interactive UI; open the printed URL
```

Cases cover aggregation, distinct/null handling, and chart output. Each loads `evals/fixtures/sales.csv` as an attachment. Expected answers stay outside the sandbox; final JSON replies are scored directly. `dev` has no preloaded sample data or automatic scoring; use `--skill none` for a manual comparison without the Skill.

## Results and maintenance

- Reports: `.runs/<id>/.eve/evals/`; collected charts: `.runs/<id>/artifacts/`.
- Chart checks validate HTML structure, **not visual correctness**. These are smoke evaluations, not proof of Skill effectiveness.
- After changing AVA source or the sandbox Dockerfile, rerun `npm run sandbox:build`. Agent, Skill, and eval changes only require restarting.
- Each invocation copies a new project into `.runs/`. Edit source files here, not generated copies. Sandbox execution has no network access.
