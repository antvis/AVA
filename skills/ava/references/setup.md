# Environment Setup

## CLI

Use Node.js ≥22.13 on macOS, Linux, or native Windows and the AVA CLI from `@antv/ava`. Install only if a compatible CLI is unavailable:

```sh
npm install -g @antv/ava
```

Put the compatible Node's `bin` directory on the task's `PATH` so both `node` and `ava` use it.

Sessions require persistent background processes. The CLI uses Unix sockets on macOS/Linux and named pipes on Windows. Run all calls, including cleanup, as the same user with the same Node runtime. On macOS/Linux also keep the same temporary directory. If the host blocks background processes or IPC, report the environment blocker.

### PowerShell 7 (Windows)

```powershell
ava source ".\sales.csv" > session.json
$datasetId = (Get-Content -Raw session.json | ConvertFrom-Json).datasetId
ava schema $datasetId > schema.json
# Inspect schema and establish Semantic before writing query.sql.
ava query $datasetId --dsl "@query.sql" > result.json
```

## Sessions

Recover `datasetId` from saved session JSON across shell calls. Sessions expire after 30 idle minutes or disposal; reload the source, refresh schema, and reapply compatible saved semantic when access remains authorized.
