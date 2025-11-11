# ava my-site (minimal)

This folder is a trimmed-down copy of the original `site` intended for local development.

What I kept/changed:
- dumi set to latest (devDependency)
- antd set to latest
- docs: only `docs/guide` retained
- examples: only the `advice/advise-summary/demo/common.tsx` example retained

Quick start:

```bash
cd my-site
npm install
npm run dev   # or npm run build
```

Notes:
- `@antv/ava` is referenced as a local file dependency to `../packages/ava` (existing in repo). If you prefer to use the published package, update `package.json` accordingly.
- Some TS/IDE lint warnings may appear until dependencies are installed.
