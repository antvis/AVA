# AI usage strategy report

## Scope

AI assistance was used to inspect the issue requirements and existing loaders (Tencent Docs SmartSheet and Feishu Bitable adopt the same DuckDB snapshot flow), compare the official Notion REST API contract with the property-value structures returned by `GET /v1/databases/:id` and `POST /v1/databases/:id/query`, draft the connector/tests/docs, and investigate validation failures.

## Guardrails

- Ground the implementation in the repository's existing `DataSourceConfig` → loader → DuckDB flow, matching `tencent-smartsheet` rather than introducing a new agent framework or remote SQL engine.
- Discover the actual Notion contract (property schema keys, page value shapes, cursor pagination, `has_more`/`next_cursor`) before implementing conversion; do not assume the older API shapes.
- Permit only the three read endpoints (database retrieve, database query, and page-property-item retrieval) inside the connector; do not offer page create/update/delete or any arbitrary request surface to the analysis model.
- Do not implement an embedded write/fixture script. Fixtures are entered manually in the Notion UI; the connector is strictly read-only.
- Store development credentials only in the ignored local environment file. Do not include credentials, real database ids or raw private records in tracked artifacts. Redact the configured token from diagnostics.

## Verification strategy

- Test field conversion with independent edge cases: zero/false/null, empty strings/pages/databases, dates with and without time/zone, invalid scalars, duplicate names, hostile `__proto__` names, computed date ranges, and formula/rollup result typing.
- Test page and property-item pagination completeness and bounds, including people and final-page rollup calculations, malformed/error responses, HTTP retries, cancellation, response-size limits and cleanup.
- Verify numeric computed aggregation, typed nulls, computed date structures, and multi-value `LIST` boundaries in real in-memory DuckDB, not only in intermediate JavaScript objects.
- Exercise the actual REST wire protocol over mocked `fetch` responses (auth header, `Notion-Version`, query body, cursor paging) and use a real in-memory DuckDB.
- Check the two natural-language examples against fixed expected business totals deterministically, not an LLM's assessment of its own correctness.

## Review still required

The contributor and maintainers should review the code and supporting evidence before merge and confirm the public source/config contract (option names, `databaseId`/`NOTION_TOKEN`, supported property mapping). Static TypeScript checks (`tsc --noEmit`) and the offline test suite pass; a live read against a real Notion database and the full documentation-site build have not been run here. No performance, universal-property or transactional-snapshot guarantees are inferred from the small synthetic fixture.