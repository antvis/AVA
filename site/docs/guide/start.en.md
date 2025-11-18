---
title: Quick Start
order:  1
redirect_from:
  - /en/docs/guide/start
---

Welcome to `@antv/AVA`! This guide will help you get started quickly and use `AVA` for intelligent visualization recommendations.

There are currently two ways to use `AVA`:
- Package Manager
- CDN

## Package Manager
If you are using a Node-based bundler like Webpack or Rollup, you can install `AVA` via a package manager like NPM or Yarn.
```bash
# Install with NPM
npm install @antv/ava
```
<br />

```bash
# Install with Yarn
yarn add @antv/ava
```
After successful installation, you can implement intelligent visualization recommendations with the following code:
```js
import { AVA } from "@antv/ava"
import { render } from '@antv/gpt-vis';

// 1. Register the chart renderer
AVA.bindRenderer(render);

// 2. Initialize
const advisor = new AVA({llm});

// 3. Extract structured information
const meta = advisor.extract("This is a text includes data and infomation.");

// 4. Advise charts based on structured information
const info = advisor.advise(meta);

// 5. Render the visualization
const vis = advisor.render(container, config);
```
## CDN
`AVA` also provides a UMD version that can be loaded directly via CDN. The `AVA` object can be accessed through the `AVA` namespace.
```html
<!-- Import UMD version -->
<script src="https://unpkg.com/@antv/ava@latest/dist/ava.umd.js"></script>
<script>
  // 1. Register the chart renderer
  AVA.bindRenderer(render);

  // 2. Initialize
  const advisor = new AVA({llm});

  // 3. Extract structured information
  const meta = advisor.extract("This is a text includes data and information.");

  // 4. Advise charts based on structured information
  const info = advisor.advise(meta);

  // 5. Render the visualization
  const vis = advisor.render(container, config);
</script>
```

