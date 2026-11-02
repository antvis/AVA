# Validation record

Date: 2026-11-02 (Asia/Shanghai). This is a local verification record, not a claim that upstream CI has passed.

## Environment

- Base: `origin/oss-camp2026`, commit `ac19d54d4155edc9a98d6db44024ab6bf2ce283f`.
- The maintainer-feedback follow-up includes the latest target-branch changes through `3b664834` (merged in `63c33a81`).
- Development branch: `codex/tencent-docs-source`.
- Windows, Node.js 22.21.0, npm 10.9.4.
- Linux verification: Debian Bookworm userland from the official Node `22-bookworm-slim` image, Node.js 22.23.4 / npm 10.9.9, running in a temporary chroot on WSL2 Linux 6.6.87.2. This was a genuine Linux process/socket environment, not a mocked `process.platform`. Docker Desktop's daemon was unavailable, so no Docker-engine validation is claimed.
- AVA 4.0.0 for the latest follow-up checks (initial integration: 4.0.0-beta.1); `@modelcontextprotocol/client` 2.4.0.
- Tencent Docs official MCP service, an authorized dedicated SmartSheet.
- Model: DeepSeek `deepseek-flash`, discovered through the provider's models endpoint and called through its OpenAI-compatible Chat Completions endpoint.
- No real credentials, document IDs or provider response traces are included in this report.

## Live source and deterministic checks

The authorized test sheet initially contained five empty records and five fields: text, number, single select, date and image. After explicit owner approval, `seed.mjs --seed` appended eight fictional sales records. The original five rows were not changed or deleted. The connector exposes the four supported fields plus `_record_id`; the image field is omitted by the documented support policy.

Using `pageSize: 2` exercised seven record pages for thirteen source records. AVA's in-memory DuckDB reported:

- Source records: 13, including the five empty records.
- Non-null sales amounts: 8.
- Total sales: 900.
- 华西: 4 synthetic orders, total sales 550.
- 华东: 4 synthetic orders, total sales 350.
- January 2026: 500; February 2026: 400.

The live opt-in Vitest test also passed. Only text, number, single select and date conversions were verified against this live table. Other documented scalar types have mock-based conversion coverage, not a claim of live verification for every type.

## Two real natural-language examples

Executed `node --env-file=.env.local examples/tencent-docs/analyze.mjs`. Both questions were translated by the real model and executed by AVA, followed by real model-generated Chinese summaries. No hand-written SQL was substituted for these analysis calls.

### 1. Regional sales and order count

The question explains the field meanings, scopes records to `AVA-DEMO-`, and asks for regions ordered by sales. Requested aliases: `region`, `orders`, `sales`.

Model-generated SQL:

```sql
SELECT "单选" AS region, COUNT(*) AS orders, SUM("数字") AS sales
FROM memory.main.data
WHERE "文本" LIKE 'AVA-DEMO-%'
GROUP BY "单选"
ORDER BY sales DESC;
```

Actual result matched the independently specified fixture expectation:

| region | orders | sales |
| --- | ---: | ---: |
| 华西 | 4 | 550 |
| 华东 | 4 | 350 |

### 2. January-to-February change

The question asks for January/February 2026 sales, absolute change and percentage change, using UTC dates. Requested aliases: `jan_sales`, `feb_sales`, `change`, `change_pct`.

Model-generated SQL:

```sql
WITH sales AS (
  SELECT
    SUM(CASE WHEN YEAR("日期" AT TIME ZONE 'UTC') = 2026
      AND MONTH("日期" AT TIME ZONE 'UTC') = 1 THEN "数字" ELSE 0 END) AS jan_sales,
    SUM(CASE WHEN YEAR("日期" AT TIME ZONE 'UTC') = 2026
      AND MONTH("日期" AT TIME ZONE 'UTC') = 2 THEN "数字" ELSE 0 END) AS feb_sales
  FROM memory.main.data
  WHERE "文本" LIKE 'AVA-DEMO-%'
)
SELECT jan_sales, feb_sales,
  feb_sales - jan_sales AS change,
  (feb_sales - jan_sales) / NULLIF(jan_sales, 0) * 100 AS change_pct
FROM sales;
```

| jan_sales | feb_sales | change | change_pct |
| ---: | ---: | ---: | ---: |
| 500 | 400 | -100 | -20 |

The script asserts the computed rows and numerical tolerance rather than relying on the summary text. This is a small reproducibility fixture, not a benchmark of model generalization or repeated-run reliability.

## Automated checks

- `npm run build`: passed CommonJS and ESM builds.
- `npx vitest run tencent __tests__/duckdb/util/file.test.ts`: 112 tests passed and 3 skipped on Windows (one opt-in live test and two Unix-only filesystem tests).
- Explicit live read-only test: 1 passed with `AVA_TENCENT_INTEGRATION=1`.
- ESLint on all changed/new TypeScript files: passed.
- `git diff --check`: passed.
- Updated source documentation compiled successfully with `@mdx-js/mdx` and `remark-gfm` (syntax/table validation only, not a full Next.js build).
- Full repository lint: passed on Windows and Linux after the focused baseline fixes described below.
- Windows `npm test`: **615 passed, 56 skipped**, zero failures or unhandled worker errors. Skips include optional external-service/model integration suites and the two Unix-only filesystem tests.
- Linux `npm test -- --maxWorkers=2`: **617 passed, 54 skipped**, zero failures or unhandled worker errors, including the actual Unix mode and symlink tests. Linux build and lint also passed.
- Real Linux CLI E2E: passed `source → schema → query → analyze → dispose`, including both business questions against the real Tencent Docs source and DeepSeek model, plus rejection of schema access after disposal. Run with `node --env-file=.env.local examples/tencent-docs/cli-e2e.mjs --with-model` on Linux/macOS.
- Full documentation-site build: passed (`cd site && npm run build`, Next.js 16.4.3). `npm run check:docs` passed for 22 static MDX pages and 1,379 documentation links, including anchors, metadata, code blocks and the Tencent Docs option table.

## Baseline check failures resolved locally

The earlier baseline comparison remains useful historical evidence, but the identified failures are no longer current blockers:

1. Feishu credential tests now isolate both `HOME` and Windows `USERPROFILE`; production credential lookup behavior is unchanged.
2. The IPC startup payload unit test explicitly exercises the supported-platform branch. A separate test verifies that actual Windows sessions are still rejected; Windows CLI support is not falsely claimed.
3. Feishu live tests no longer log source records or dump them to a fixed `/tmp` file; reader quote/semicolon lint errors were fixed without changing its behavior.
4. The native worker exit was localized to the DuckDB timeout test. `interrupt()` requests cancellation but does not await native completion. The engine now drains the interrupted operation before returning the timeout, preventing immediate disposal from freeing an in-flight native connection. Both a delayed-cancellation regression and a real timeout/reuse test pass.
5. Default Windows test concurrency is capped at two workers. The three extension-dependent first-load tests have explicit 30-second budgets for extension installation instead of failing at the default five seconds. No assertions were removed to obtain passing checks.
6. Documentation-site verification exposed Windows file-URL/route-separator/CRLF handling issues. These now use `fileURLToPath`, normalized route separators and normalized Markdown newlines. The pinned `@ai-sdk/react` 4.0.145 brought its own older `ai` 7.0.141 types, conflicting with the installed `ai` 7.0.159. Updating the React SDK range to `^4.0.163` aligns those types; the real site build/type check now passes without casts or suppressed errors.

These baseline fixes are isolated from the Tencent Docs connector in a prerequisite commit so maintainers can review or extract them independently. The local results above do not imply that hosted upstream CI has passed.

## Copilot review follow-up

Both high-severity findings on PR #1055 were reproduced against the implementation and addressed:

1. The shared temporary-file helper now uses a random UUID and exclusive `wx` creation with mode `0600` before writing any content. Tests cover permissions under Unix umask `022`, preservation of pre-existing files/symlinks, and cleanup after a failed write. The permission and symlink tests passed in the real Linux environment described above, not just through mocked filesystem calls.
2. SmartSheet conversion now consumes validated pages incrementally, without retaining all raw records. Expanded JSON has an independent 16 MiB UTF-8 budget (including keys, nulls, record IDs, brackets and commas) and a 1,000,000-cell budget (including `_record_id`). Reported record totals are checked against the effective cell-based row cap before conversion. Regression tests cover a sparse 100,000-record / 1,000-field response and exact byte/cell boundaries; no partial snapshot is returned on rejection.

After these changes, the Windows and Linux full suites, lint/build checks, and documentation-site build/checks were rerun with the results recorded above. The real source `analyze.mjs --verify-only` also passed again with `pageSize: 2` and the same business totals. The two real model/CLI runs above are historical validation of the original integration; they were not rerun for this hardening-only follow-up.

## Maintainer feedback follow-up

- Renamed the source discriminator and loader file to `tencent-smartsheet` to match `feishu-bitable`. SDK/CLI registration, validation, tests, runnable examples and documentation use the same name. This is still an unreleased source, so no alias for the former draft name is retained.
- Preserve upstream codes/messages and diagnostic payloads, including unknown codes, `message`/`msg`, nested envelopes, plain-text MCP failures, and SDK/network error properties/cause chains. Known-code hints supplement rather than replace the upstream message. HTTP failures preserve the HTTP status separately, upstream codes where available, request IDs, and a bounded 8 KiB response body with a truncation marker. Only the configured credential is redacted; other upstream diagnostic context is deliberately retained.
- Added regressions for those diagnostic paths, nested credential redaction, bounded HTTP bodies, and a genuine SDK JSON-RPC error through the mocked wire (not a mocked SDK class). Existing retry, deadline, read-only and snapshot-budget tests remain enabled.
- Reran the full Windows/Linux checks and site checks above, plus the real read-only SDK fixture check and Linux CLI `source → schema → query → dispose` under the new source name. No new model calls or fixture writes were performed for this follow-up; the two real natural-language analyses above remain previous validation evidence.

## Maintainer review notes

1. Please confirm source naming, configuration and the new MCP SDK dependency during review.
2. The prerequisite verification fixes can be reviewed independently or extracted into a separate PR if preferred. Only Tencent Docs is added as a new SaaS platform.
3. Human/maintainer review remains necessary, particularly for credentials, quota handling, date/number semantics and unsupported-field behavior. Package/site builds and local Windows/Linux verification are complete; use the PR checks for the current hosted-CI status.
