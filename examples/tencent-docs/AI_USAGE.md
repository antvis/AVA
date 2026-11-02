# AI usage strategy report

## Scope

AI assistance was used to inspect issue requirements and existing loaders, compare official MCP documentation with live read-tool schemas, draft the connector/tests/docs, and investigate validation failures. A real DeepSeek model was used for the two business questions through both the SDK and the real Linux CLI. A maintainer subsequently gave LGTM and requested naming/diagnostic refinements; this does not imply that maintainer source-availability testing or merge approval is complete.

## Guardrails

- Ground the implementation in the repository's existing `DataSourceConfig` → loader → DuckDB flow, rather than introducing a new agent framework or remote SQL engine.
- Discover actual MCP contracts before implementing conversion. Live `field_type` string enums supersede assumptions based on older REST numeric enums.
- Permit only field/record read tools inside the connector; do not offer arbitrary remote tools to the analysis model.
- Require explicit owner approval before writing synthetic fixtures. Keep fixture setup separate, require `--seed`, and do not automatically retry writes.
- Store development credentials only in the ignored local environment file. Do not include credentials, real file IDs or raw private records in tracked artifacts. Following maintainer feedback, retain upstream error diagnostics rather than blanket-suppressing them, redact the configured Token, and review provider-returned context before publishing logs.

## Verification strategy

- Test field conversion with independent edge cases: zero/false/null, empty strings/rows/tables, timestamps, invalid scalars, duplicate names and hostile object keys.
- Test pagination completeness and bounds, malformed/error responses, HTTP retries, cancellation, output-size limits and cleanup.
- Exercise the actual MCP SDK over mocked JSON-RPC wire responses and use a real in-memory DuckDB, in addition to isolated unit tests.
- Compare both real model-generated query results with fixed expected business totals, not an LLM's assessment of correctness.
- Report targeted success separately from repository-wide baseline failures. Reproduce identified pre-existing failures against an extracted unmodified base.

## Review still required

The maintainer-feedback follow-up uses `tencent-smartsheet` consistently and retains upstream error codes/messages, HTTP diagnostics and SDK/network causes, with configured-Token redaction instead of blanket suppression. Added tests include actual SDK wire-level JSON-RPC errors. Full Windows/Linux checks, the documentation-site build and live read-only SDK/Linux CLI source checks were rerun; model analysis was not rerun and no new fixture data was written.

Copilot subsequently identified two valid high-severity issues: shared temporary-file permissions and sparse-to-dense memory amplification. AI-assisted follow-up fixed both and added filesystem/budget regression tests. Verification included real Linux `0600`/symlink checks, full Windows/Linux suites, lint/build, the documentation site, and another live read-only deterministic source check. AI review is treated as evidence to investigate, not automatic approval; the real model/CLI business examples were not rerun for this follow-up.

The contributor and maintainers should review the code and supporting evidence before merge and confirm the public source/config contract. Real Linux CLI validation, local Windows/Linux root checks, the full documentation-site build and static documentation checks have passed; hosted upstream CI has not run. No performance, universal field-compatibility or transactional-snapshot guarantees are inferred from the small local fixture.
