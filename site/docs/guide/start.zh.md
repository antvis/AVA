---
title: 快速上手
order: 1
redirect_from:
  - /zh/docs/guide/start
---

欢迎使用 `@antv/AVA`！本指南将帮助你快速上手并使用`AVA`进行智能可视化推荐

目前有两种使用 `AVA` 的方式：
- 包管理器
- CDN

## 包管理器
如果使用了 Webpack，Rollup 等基于 Node 的打包工具，可以通过 NPM 或者 Yarn 等包管理器去安装 `AVA` 。
```bash
# 通过 NPM 安装
npm install @antv/ava
```
<br />

```bash
# 通过 Yarn 安装
yarn add @antv/ava
```
安装成功后通过如下代码即可实现智能可视化推荐
```js
import { AVA } from "@antv/ava"
import { render } from '@antv/gpt-vis';

// 1. 注册图表渲染器
AVA.bindRenderer(render);

// 2. 初始化
const ava = new AVA({llm});

// 3. 抽取结构化信息
const meta = ava.extract("This is a text includes data and information.");

// 4. 结合结构化信息推荐图表
const info = ava.advise(meta);

// 5. 可视化呈现
const vis = ava.render(container, config);
```
## CDN
`AVA`也提供了 UMD 版本，可以直接通过 CDN 加载，然后直接使用。这个时候的 `AVA` 对象可以通过命名空间 `AVA` 去访问。
```html
<!-- 引入 UMD 版本 -->
<script src="https://unpkg.com/@antv/ava@latest/dist/ava.umd.js"></script>
<script>
  // 1. 注册图表渲染器
  AVA.bindRenderer(render);

  // 2. 初始化
  const ava = new AVA({llm});

  // 3. 抽取结构化信息
  const meta = ava.extract("This is a text includes data and information.");

  // 4. 结合结构化信息推荐图表
  const info = ava.advise(meta);

  // 5. 可视化呈现
  const vis = ava.render(container, config);
</script>
```
