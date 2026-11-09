# Environment Setup

## CLI

Use Node.js ≥22.13 on macOS or Linux and AVA CLI **4.x** (`@antv/ava`, not the `ava` test runner). Install only if a compatible CLI is unavailable:

```sh
npm install -g @antv/ava@4
```

Put the compatible Node's `bin` directory on the task's `PATH` so both `node` and `ava` use it.

Sessions require persistent background processes and Unix sockets. Run all calls, including cleanup, with the same user, runtime, and temporary directory. Report an environment blocker if these are unavailable.

## Sessions

Recover `datasetId` from saved session JSON across shell calls. Sessions expire after 30 idle minutes or disposal; reload the source, refresh schema, and reapply compatible saved semantic when access remains authorized.
