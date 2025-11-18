---
title: 自定义渲染器
order: 3
redirect_from:
  - /zh/docs/api/render
---

## GPT-Vis 组件库按需渲染 

`@antv/gpt-vis` 内置 25+ 图表类型，完整打包体积约 420 KB。在多数页面只需要 1~3 种图表的场景下，全量引入会造成不必要的体积与首屏执行开销。所谓“按需渲染”（或“按需加载”）即：
1. 仅导入当前交互真正需要的图表组件。
2. 运行期根据 advisor 返回的推荐 / 业务指定的 spec.type 动态选择对应组件。
3. 可结合构建工具的 Tree Shaking、ESM 与动态 import 分割代码，进一步减少初始加载。

核心思路
- 静态按需：手动 import 需要的组件（如 Line / Area / Pie）。未导入的类型不会进入 bundle。
- 动态按需：对较少出现或体积较大的图表进行懒加载：const Pie = await import('@antv/gpt-vis/lib/pie'); 生成独立 chunk。
- 运行时映射：通过一个字典（type -> 组件）在自定义 renderer 中匹配并渲染。
- 失败兜底：当 spec.type 未被注册时给出明确报错，避免空白区域。

优势
- 减少首屏字节数：只加载用得上的组件。
- 加快解析 & 初始化：更少的 React 节点、样式与副作用。
- 更利于渐进功能扩展：后续新增图表仅需添加映射，不影响已上线页面。
- SSR / Edge 友好：更小的包可更快上传与冷启动。

实现要点
- bindRenderer(demandRender) 将 AVA 的统一 render 流程与自定义渲染逻辑衔接。
- 在 demandRender 中使用 spec.type 进行组件选择；清空旧容器 (mount.innerHTML = '') 避免残留。
- 若需多实例或频繁更新，可缓存 ReactRoot；不复用时可 root.unmount() 做资源释放。
- 结合构建工具：Vite / Webpack 默认支持 ESM Tree Shaking；确保使用 import { Line } from '@antv/gpt-vis' 而不是整包命名空间聚合。

下面的示例即基于“静态按需”策略，对常用四种图表进行注册并按类型渲染。

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
    message.error(`不支持的图表类型: ${chartType}`);
    throw new Error(`Unknown chart type: ${chartType}`);
  }

  mount.innerHTML = '';
  const chartElement = React.createElement(Comp, chartProps);
  const root = ReactDOM.createRoot(mount);
  root.render(chartElement);
};

const advisor = new AVA();
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
    advisor.render('#chart', chartSpec);
  }, []);
 
  return (
    <div id="chart"/>
  );
};

export default RenderChart;
```

## 使用 GPTVis 协议渲染

GPTVis 协议是一种基于 Markdown 语法的图表渲染协议，通过扩展 `vis-chart` 代码块语法，实现在 Markdown 文档中嵌入和渲染可视化图表。该协议允许开发者使用统一的标记语言描述图表配置，并支持自定义渲染组件来满足不同场景需求。

**核心特性**

- **Markdown 原生集成**：使用标准的代码块语法（` ```vis-chart `）嵌入图表配置，与文档内容无缝融合
- **JSON 配置驱动**：通过 JSON 对象描述图表类型、数据和样式，简洁直观
- **组件化渲染**：基于 React 生态，支持 `<GPTVis>` 完整组件和 `<GPTVisLite>` 轻量组件
- **灵活扩展**：可自定义注册所需图表类型，实现按需加载和渲染

**工作原理**

1. **协议解析**：GPTVis 组件识别 Markdown 中的 `vis-chart` 代码块
2. **配置提取**：解析代码块内的 JSON 配置（包含 type、data 等字段）
3. **组件映射**：根据 `type` 字段匹配对应的图表组件
4. **动态渲染**：将配置传递给图表组件并渲染到指定容器

**协议格式示例**

```markdown
`## 标题
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
**应用场景**
- **AI 对话系统**：LLM 生成的 Markdown 响应中直接嵌入数据可视化
- **文档自动化**：将数据分析结果以图表形式集成到报告文档
- **内容管理系统**：编辑器支持可视化内容的富文本编辑
- **知识库构建**：在技术文档中动态展示图表示例

### 基础使用
以下示例展示最精简的接入方式，核心思路是：准备一个图表配置 spec，利用自定义 renderer 将其包裹进带有 vis-chart 代码块的 Markdown 字符串，然后交给 GPTVis 组件解析与渲染。

步骤
1. 定义图表配置：包含 type 与 data 等字段。
2. 编写 renderer：查询挂载节点，清空内容，拼接 Markdown（内含 ```vis-chart 代码块 + JSON）。
3. bindRenderer：将自定义逻辑注入 AVA 的统一渲染流程。
4. 调用 advisor.render('#chart', spec)：驱动生成最终图表。
5. 在 React 中仅需一个占位容器 div#chart。

要点
- JSON.stringify(spec) 保证配置是合法 JSON。
- 同一容器重复渲染需先清空 innerHTML，避免残留。
- Markdown 中除代码块外可同时包含标题、描述等文档内容。
- 若后续要做按需加载，可将 GPTVis 改为 GPTVisLite 并注册特定图表组件。

下面即是完整最简示例。

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

const advisor = new AVA();
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
     advisor.render('#chart', chartSpec);
  }, []);
 
  return (
    <div id="chart"/>
  );
};

export default RenderChart;
```

### 按需使用

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

const advisor = new AVA();
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
    advisor.render('#chart', chartSpec);
  }, []);
 
  return (
    <div id="chart"/>
  );
};

export default RenderChart;
```

## GPT-Vis 服务端渲染（SSR）

GPT-Vis 也支持在服务端进行图表渲染，以下示例展示了如何在 Node.js 环境下使用 `@antv/gpt-vis-ssr` 进行 SSR 渲染。

**API**
- `render(spec)` -> `Promise<ChartInstance>`
- `chart.exportToFile(name, { format?: 'png' | 'jpeg' | 'svg' })`
- `chart.toBuffer(format?)` -> `Promise<Buffer>`
- `chart.toDataURL(format?)` -> `Promise<string>`
- `chart.destroy()`

**适用场景**
- 报告/周报自动生成图表图片 (PNG / SVG)
- LLM / ChatBot 在工具调用里返回可视化结果
- 静态站点预构建首屏图像，减轻客户端渲染成本
- Lambda / Edge 函数中按需生成可视化快照
- 缓存热点图表，降低前端重复计算

**优势**
- 零浏览器依赖：纯 Node.js 运行，无需 Puppeteer
- 一致性：输出结果与前端组件视觉近似
- 多格式：支持 PNG / JPEG / SVG / Buffer / DataURL
- 可更新：同一实例重复 update 复用上下文
- 可控尺寸 / 主题 / 背景


### 基本示例

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
  // 导出 PNG 文件 (chart.png)
  await chart.exportToFile('chart', { format: 'png' });
  // 获取二进制 Buffer，可写入对象存储或 HTTP 响应
  const buf = await chart.toBuffer('png');
  // 获取 DataURL（适合直接嵌入 JSON / Markdown）
  const dataURL = await chart.toDataURL('png');
  // 资源释放
  chart.destroy();
}

main();
```
大概会在 400ms 左右生成一张可视化图如下，基本和在浏览器端渲染的没有太大区别。

<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*XqCnTbkpAkQAAAAAAAAAAAAADmJ7AQ/fmt.webp" alt="gpt-vis-ssr" width="600" />

### 与 AVA 集成

服务端常见流程：先用 AVA 推荐，再渲染输出图片。
```ts
import { AVA } from '@antv/ava';
import { render } from '@antv/gpt-vis-ssr';

async function advisorSSR(data) {
  const advisor = new AVA();
  const advises  = advisor.advise(data);
  const spec =  advises[0].charts[0].spec;
  const chart = await render(spec);
  return chart.toBuffer('png');
}
```  




