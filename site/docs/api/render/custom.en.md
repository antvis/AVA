---
title: Custom Renderer
order: 3
redirect_from:
  - /en/docs/api/render
---

## GPT-Vis Component Library On-Demand Rendering

`@antv/gpt-vis` includes 25+ chart types with a full bundle size of approximately 420 KB. In scenarios where most pages only need 1-3 chart types, importing the entire library causes unnecessary bundle size and first-screen execution overhead. "On-demand rendering" (or "lazy loading") means:
1. Only import the chart components actually needed for the current interaction.
2. Dynamically select corresponding components at runtime based on ava recommendations or business-specified spec.type.
3. Combine with build tools' Tree Shaking, ESM, and dynamic import for code splitting to further reduce initial loading.

Core Concepts
- Static on-demand: Manually import needed components (e.g., Line / Area / Pie). Unimported types won't be included in the bundle.
- Dynamic on-demand: Lazy load rarely used or large charts: const Pie = await import('@antv/gpt-vis/lib/pie'); generates independent chunks.
- Runtime mapping: Match and render through a dictionary (type -> component) in custom renderer.
- Fallback handling: Provide clear error messages when spec.type is not registered to avoid blank areas.

Advantages
- Reduce first-screen bytes: Only load components that are actually used.
- Faster parsing & initialization: Fewer React nodes, styles, and side effects.
- Better for progressive feature expansion: Adding new charts only requires adding mappings without affecting deployed pages.
- SSR / Edge friendly: Smaller bundles enable faster uploads and cold starts.

Implementation Points
- bindRenderer(demandRender) connects AVA's unified render process with custom rendering logic.
- Use spec.type for component selection in demandRender; clear old container (mount.innerHTML = '') to avoid residuals.
- For multiple instances or frequent updates, cache ReactRoot; use root.unmount() for resource cleanup when not reusing.
- Combine with build tools: Vite / Webpack support ESM Tree Shaking by default; ensure using import { Line } from '@antv/gpt-vis' instead of entire namespace aggregation.

The following example is based on the "static on-demand" strategy, registering four commonly used chart types and rendering by type.

```js
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AVA, bindRenderer } from '@antv/ava';
import { Line, Area, Bar, Pie } from '@antv/gpt-vis';

const renderer = (container, spec) => {
  const { type, ...chartProps } = spec;
  const chartType = type as 'line' | 'area' | 'bar' | 'pie';

  const mount = document.querySelector(container);
  if (!mount) return;

  const VISComps = {
    line: Line,
    area: Area,
    bar: Bar,
    pie: Pie,
  };
  const Comp = VISComps[chartType];

  if (!Comp) {
    message.error(`Unsupported chart type: ${chartType}`);
    throw new Error(`Unknown chart type: ${chartType}`);
  }

  mount.innerHTML = '';
  const chartElement = React.createElement(Comp, chartProps);
  const root = ReactDOM.createRoot(mount);
  root.render(chartElement);
};

const ava = new AVA();
const chartSpec = {
  type: 'area',
  data: [
    { time: '2018', value: 91.9 },
    { time: '2019', value: 99.1 },
    { time: '2020', value: 101.6 },
    { time: '2021', value: 114.4 },
    { time: '2022', value: 121 },
  ],
};

const RenderChart = () => {

  useEffect(() => {
    bindRenderer(renderer);
    ava.render('#chart', chartSpec);
  }, []);
 
  return (
    <div id="chart"/>
  );
};

export default RenderChart;
```

## Rendering with GPTVis Protocol

The GPTVis protocol is a chart rendering protocol based on Markdown syntax. By extending the `vis-chart` code block syntax, it enables embedding and rendering visualization charts within Markdown documents. The protocol allows developers to describe chart configurations using a unified markup language and supports custom rendering components to meet different scenario requirements.

**Core Features**

- **Native Markdown Integration**: Embed chart configurations using standard code block syntax (` ```vis-chart `), seamlessly integrating with document content
- **JSON Configuration Driven**: Describe chart type, data, and styles through JSON objects in a concise and intuitive way
- **Component-Based Rendering**: Based on React ecosystem, supports `<GPTVis>` full component and `<GPTVisLite>` lightweight component
- **Flexible Extension**: Supports custom registration of required chart types for on-demand loading and rendering

**How It Works**

1. **Protocol Parsing**: GPTVis component identifies `vis-chart` code blocks in Markdown
2. **Configuration Extraction**: Parses JSON configuration within code blocks (including type, data fields, etc.)
3. **Component Mapping**: Matches corresponding chart components based on the `type` field
4. **Dynamic Rendering**: Passes configuration to chart components and renders to specified container

**Protocol Format Example**

```markdown
`## Title
\`\`\`vis-chart
{
  "type": "line",
  "data": [
    { "time": "2018", "value": 91.9 },
    { "time": "2019", "value": 99.1 }
  ]
}
\`\`\``
```
**Application Scenarios**
- **AI Conversation Systems**: Directly embed data visualizations in LLM-generated Markdown responses
- **Document Automation**: Integrate data analysis results as charts into report documents
- **Content Management Systems**: Editor support for rich text editing with visualization content
- **Knowledge Base Construction**: Dynamically display chart examples in technical documentation

### Basic Usage
The following example demonstrates the most streamlined integration approach. The core idea is: prepare a chart configuration spec, use a custom renderer to wrap it in a Markdown string with a vis-chart code block, then pass it to the GPTVis component for parsing and rendering.

Steps
1. Define chart configuration: Include fields like type and data.
2. Write renderer: Query mount node, clear content, concatenate Markdown (containing ```vis-chart code block + JSON).
3. bindRenderer: Inject custom logic into AVA's unified rendering process.
4. Call ava.render('#chart', spec): Drive final chart generation.
5. In React, only need a placeholder container div#chart.

Key Points
- JSON.stringify(spec) ensures configuration is valid JSON.
- Clear innerHTML before re-rendering to the same container to avoid residuals.
- Markdown can include titles, descriptions, and other document content alongside code blocks.
- For on-demand loading, replace GPTVis with GPTVisLite and register specific chart components.

Below is the complete minimal example.

```js
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AVA, bindRenderer } from '@antv/ava';
import { GPTVis } from '@antv/gpt-vis';

const renderer = (container: string, spec: any) => {
  const mount = document.querySelector(container) as HTMLElement;
  if (!mount) return;

  mount.innerHTML = '';

  const content = `## GPT-VIS 
  Components for GPTs, generative AI, and LLM projects. Not only UI Components.
  \`\`\`vis-chart
  ${JSON.stringify(spec)}
  \`\`\``;
  const root = ReactDOM.createRoot(mount);
  root.render(<GPTVis>{content}</GPTVis>);
};

const ava = new AVA();
const chartSpec = {
  type: 'area',
  data: [
    { time: '2018', value: 91.9 },
    { time: '2019', value: 99.1 },
    { time: '2020', value: 101.6 },
    { time: '2021', value: 114.4 },
    { time: '2022', value: 121 },
  ],
};

const RenderChart = () => {

  useEffect(() => {
    bindRenderer(renderer);
     ava.render('#chart', chartSpec);
  }, []);
 
  return (
    <div id="chart"/>
  );
};

export default RenderChart;
```

### On-Demand Usage

```js
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AVA, bindRenderer } from '@antv/ava';
import { GPTVisLite, Pie, withChartCode, ChartType } from '@antv/gpt-vis';

const components = {
  code: withChartCode({
    components: { [ChartType.Pie]: Pie }, // register a pie chart
  }),
};

const renderer = (container, spec) => {
  const mount = document.querySelector(container) as HTMLElement;
  if (!mount) return;

  mount.innerHTML = '';

  const content = `## GPT-VIS 
  Components for GPTs, generative AI, and LLM projects. Not only UI Components.
  \`\`\`vis-chart
  ${JSON.stringify(spec)}
  \`\`\``;
  
  const root = ReactDOM.createRoot(mount);
  root.render(<GPTVisLite components={components}>{content}</GPTVisLite>);
};

const ava = new AVA();
const chartSpec = {
  type: 'area',
  data: [
    { time: '2018', value: 91.9 },
    { time: '2019', value: 99.1 },
    { time: '2020', value: 101.6 },
    { time: '2021', value: 114.4 },
    { time: '2022', value: 121 },
  ],
};

const RenderChart = () => {

  useEffect(() => {
    bindRenderer(renderer);
    ava.render('#chart', chartSpec);
  }, []);
 
  return (
    <div id="chart"/>
  );
};

export default RenderChart;
```

## GPT-Vis Server-Side Rendering (SSR)

GPT-Vis also supports server-side chart rendering. The following example demonstrates how to use `@antv/gpt-vis-ssr` for SSR rendering in a Node.js environment.

**API**
- `render(spec)` -> `Promise<ChartInstance>`
- `chart.exportToFile(name, { format?: 'png' | 'jpeg' | 'svg' })`
- `chart.toBuffer(format?)` -> `Promise<Buffer>`
- `chart.toDataURL(format?)` -> `Promise<string>`
- `chart.destroy()`

**Use Cases**
- Auto-generate chart images (PNG / SVG) for reports/weekly summaries
- Return visualization results in LLM / ChatBot tool calls
- Pre-build first-screen images for static sites to reduce client-side rendering costs
- Generate visualization snapshots on-demand in Lambda / Edge functions
- Cache hot charts to reduce redundant frontend calculations

**Advantages**
- Zero browser dependency: Pure Node.js runtime, no Puppeteer needed
- Consistency: Output results visually similar to frontend components
- Multi-format: Supports PNG / JPEG / SVG / Buffer / DataURL
- Updatable: Reuse context with repeated updates on same instance
- Controllable size / theme / background


### Basic Example

```ts
import { render } from '@antv/gpt-vis-ssr';

async function main() {
  const spec = {
    type: 'line',
    data: [
      { time: '2018', value: 91.9 },
      { time: '2019', value: 99.1 },
      { time: '2020', value: 101.6 },
      { time: '2021', value: 114.4 },
      { time: '2022', value: 121 },
    ],
  };

  const chart = await render(spec);
  // Export PNG file (chart.png)
  await chart.exportToFile('chart', { format: 'png' });
  // Get binary Buffer, can be written to object storage or HTTP response
  const buf = await chart.toBuffer('png');
  // Get DataURL (suitable for direct embedding in JSON / Markdown)
  const dataURL = await chart.toDataURL('png');
  // Release resources
  chart.destroy();
}

main();
```
This generates a visualization in approximately 400ms as shown below, essentially identical to browser-side rendering.

<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*XqCnTbkpAkQAAAAAAAAAAAAADmJ7AQ/fmt.webp" alt="gpt-vis-ssr" width="600" />

### Integration with AVA

Common server-side workflow: Use AVA for recommendations first, then render and output images.
```ts
import { AVA } from '@antv/ava';
import { render } from '@antv/gpt-vis-ssr';

async function advisorSSR(data) {
  const ava = new AVA();
  const advises  = ava.advise(data);
  const spec =  advises[0].charts[0].spec;
  const chart = await render(spec);
  return chart.toBuffer('png');
}
```  





