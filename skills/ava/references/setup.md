# Environment Setup

## CLI

Use Node.js ≥22.13 and the AVA CLI from `@antv/ava`. Install only if a compatible CLI is unavailable:

```sh
npm install -g @antv/ava
```

Put the compatible Node's `bin` directory on the task's `PATH` so both `node` and `ava` use it.

### PowerShell 7 (Windows)

```powershell
ava source ".\sales.csv" > session.json
$datasetId = (Get-Content -Raw session.json | ConvertFrom-Json).datasetId
ava schema $datasetId > schema.json
# Inspect schema and establish Semantic before writing query.sql.
ava query $datasetId --dsl "@query.sql" > result.json
```

## Sessions

Use the same user and environment settings when accessing a session. Recover `datasetId` from saved session JSON across shell calls. Sessions expire after 30 idle minutes or disposal; reload the source, refresh schema, and reapply compatible saved semantic when access remains authorized.
