# AVA website

The site uses Next.js App Router with static export (`site/out/`).

```bash
pnpm install
pnpm dev
pnpm build
```

Use Node.js 22.13 or newer. From a fresh checkout, build the root `@antv/ava` package before building the site.

## Documentation

Every topic is an independent MDX file in `content/docs/`:

```text
content/docs/
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
4. Add the route to `public/sitemap.xml` and `public/llms.txt`; keep the repository-root `llms.txt` synchronized with `public/llms.txt`.
5. Run `pnpm build` and `pnpm check:docs`.

`/documentation/` serves the introduction. Every other URL follows the MDX file path, for example `data/sources.mdx` becomes `/documentation/data/sources/`. All routes are statically generated for GitHub Pages.

`mdx-components.tsx` supplies shared headings, tables, callouts, and code blocks. Fenced code is highlighted at build time; only the copy control is a client component. The page outline is derived from rendered headings, so it stays synchronized with MDX content. Presentation lives in `app/documentation/docs.css` and `components/docs/`.

Use `<Callout>...</Callout>` for contextual notes. Link to other chapters with their full `/documentation/.../` path. Keep examples aligned with `src/`, and keep secrets out of snippets.

The reading order is introduction → quickstart → data → analysis → visualization → advanced usage → execution engines → API Reference. Keep each workflow self-contained: source parameter tables live with the source guide; analysis includes suggestions and direct queries, with advanced strategies in their own chapter; visualization includes recommendation and rendering. The API reference lists constructor fields directly. Use in-page anchors for related sections rather than splitting each option into its own chapter.
