# AVA website

The site uses Next.js App Router with static export (`site/out/`).

```bash
pnpm install
pnpm dev
pnpm build
```

The production build is a static export. Serve `out/` with a static web server; it does not use `next start`.

Use Node.js 22.13 or newer. From a fresh checkout, build the root `@antv/ava` package before building the site.

## Documentation

Every topic is an independent MDX file in `content/docs/en/`:

```text
content/docs/en/
├── introduction.mdx
├── quickstart.mdx
├── configuration.mdx
├── browser.mdx
├── data/              # Sources and parameters; schema and profiling
├── analysis/          # Analysis workflow and advanced strategies
├── visualization/     # One visualization guide: recommend and render
├── engines/           # Engine selection, runtime behavior, source extensions
└── reference/         # API, events, CLI, architecture
```

To add a chapter:

1. Add an MDX file in the appropriate folder. Use `##` / `###` headings; the page title comes from the navigation metadata.
2. Add its title, description, group, and slug to `lib/docs.ts`. Order controls the sidebar and previous/next links.
3. Add an explicit MDX import to `content/docs/index.ts`.
4. Add the route to `public/sitemap.xml` and `public/llms.txt`.
5. Run `pnpm build` and `pnpm check:docs`.

`/documentation/` serves the introduction. Every other URL follows the MDX file path, for example `data/sources.mdx` becomes `/documentation/data/sources/`. All routes are statically generated for GitHub Pages.

`mdx-components.tsx` supplies shared headings, tables, callouts, and code blocks. Fenced code is highlighted at build time; only the copy control is a client component. The page outline is derived from rendered headings, so it stays synchronized with MDX content. Presentation lives in `app/documentation/docs.css` and `components/docs/`.

Use `<Callout>...</Callout>` for contextual notes. Link to other chapters with their full `/documentation/.../` path. Keep examples aligned with `src/`, and keep secrets out of snippets.

The reading order is introduction → quickstart → data → analysis → visualization → advanced usage → execution engines → API Reference. Keep each workflow self-contained: source parameter tables live with the source guide; analysis includes suggestions and direct queries, with advanced strategies in their own chapter; visualization includes recommendation and rendering. The API reference lists constructor fields directly. Use in-page anchors for related sections rather than splitting each option into its own chapter.

## Languages

English keeps `/`, `/ai/`, and `/documentation/`. Chinese uses the corresponding `/zh/` paths. Both are exported as real HTML without middleware. Only `/` checks the browser's primary language before hydration: Chinese (`zh` or `zh-*`) opens `/zh/`, while other languages use English. An explicit choice from the language switch takes precedence and is saved in localStorage. If storage is blocked, skip automatic redirection so both languages remain reachable. Direct links to `/zh/`, documentation, or the AI playground keep their specified language; query strings and anchors survive homepage redirection.

- Shared presentation lives in `components/Home.tsx`, `ai/ui/AIPage.tsx`, and `components/docs/`; route files only choose the language.
- `messages/en.json` and `messages/zh.json` hold UI copy. Use `useTranslations` in client components and `getTranslator` for server-rendered text. Keep matching keys; write Chinese copy for Chinese readers.
- `content/docs/en/` and `content/docs/zh/` use matching slugs, heading levels, examples, tables, callouts, and custom layouts. Write Chinese explanations for Chinese readers rather than matching English sentences; preserve the information, API names, units, and behavior. Preserve stable heading IDs even when wording differs.
- Use `LocaleLink` for internal navigation. Assets and external URLs keep their original paths. Language switching opens the matching page, reloads the document, and starts a new AI conversation.
- When adding a chapter, update both locales, explicit MDX imports, `public/sitemap.xml`, and `public/llms.txt`. Run `pnpm build` and `pnpm check:docs` to verify both languages.

## SQLite uploads in AI Playground

The `/ai/` page accepts `.sqlite`, `.sqlite3` and `.db` files up to 25 MB. Tables, views, primary/unique keys and declared foreign keys are discovered from the database. SQLite runs locally in a dedicated sql.js Web Worker; multi-table SQL is generated from the discovered schema and user-supplied semantic model. `profile` currently reports row counts for each table/view, not column distribution statistics.

Queries are restricted to one read-only SELECT/CTE, with `query_only` enabled, result row/byte limits and a 30-second worker timeout. A timed-out database must be reloaded. Query data can be sent to the configured analysis model; the database file itself is not uploaded to a server.

The `predev` and `prebuild` scripts copy sql.js browser/WASM assets into `public/vendor/sqlite/`; deploy the generated `out/` directory as usual.

The SQLite worker is bundled through `new URL(..., import.meta.url)` so each build gives it a content-addressed asset URL. This prevents a previous worker build from surviving an SDK contract update in the browser cache. Run `node scripts/test-sqlite.mjs` to verify the worker and the AVA profile contract.
