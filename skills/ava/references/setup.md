# Environment Setup

## CLI

Requires AVA CLI **4.x**, Node.js ≥22.13, and macOS or Linux. The runtime must support long-lived background processes and Unix sockets. Calls must share the same user, runtime environment, and temporary directory.

Check the Node.js version and confirm that the CLI is available in the host agent's shell:

```sh
node --version
ava source --help
```

Prefer an existing installation or project build of this version. Otherwise, install:

```sh
npm install -g @antv/ava@4
```

A supported Node installation elsewhere on the machine does not change the agent's `PATH`. Use a task-local `PATH` or executable wrapper when necessary; do not change unrelated global settings. For the report script, `AVA_CLI` selects that executable. Follow the host's normal tool permissions. A missing shell, blocked Unix socket or unavailable attachment path is an environment blocker; do not claim AVA ran.

## Model-Backed Commands

`source` with type `text`, `analyze`, `translate`, `suggest`, `recommend`, and `visualize` use AVA's model integration. Set `OPENAI_API_KEY`; optionally set `OPENAI_MODEL` (default `gpt-4o-mini`) and `OPENAI_BASE_URL`. For session commands, set these before creating the session; later environment changes do not update its model configuration. Loading structured data, running `query`, managing semantic, and rendering a supplied Spec with `viz` do not require a model API key.

## Sessions

Save session IDs and query outputs in a task-specific directory. For example:

```sh
ava source /absolute/path/sales.csv > session.json
DATASET_ID=$(node -p 'JSON.parse(require("fs").readFileSync("session.json", "utf8")).datasetId')
ava schema "$DATASET_ID" > schema.json
```

Across terminals, recover the ID from the file instead of relying on another process's environment variables.

Sessions expire after 30 idle minutes or disposal. If access remains authorized, reload the same source, refresh schema, and reapply compatible saved semantic. Recompute statistics only as needed.

When finished or after failure, close task-created sessions that are no longer needed with `ava dispose "$DATASET_ID"`. Keep a session if analysis will continue. Close a user-provided session only when explicitly asked.
