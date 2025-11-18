---
title: 图表推荐
order: 0
redirect_from:
  - /zh/docs/api/advise
 ---

# 图表推荐（Advise）

本页面说明“图表推荐（advise）”功能：基于数据生成图表建议的典型流程。

## 概述

`advise` 会基于数据特征生成建议的图表规格（spec）。典型流程：

1. `extract` — 从原始数据提取特征/分片
2. `advise` — 基于提取结果生成图表建议
3. `render` — 使用指定的渲染器渲染推荐的图表

AVA 类（来自 `@antv/ava`）负责协调这些步骤。

## 使用示例

```ts
import { AVA } from '@antv/ava';

const advisor = new AVA({ /* 配置 */ });
const shards = await advisor.extract({ purpose: '请根据数据生成图表建议', data });
const advises = await advisor.advise(shards);
// advises 是建议数组，通常包含 charts、insights、metadata 等字段
const firstSpec = advises[0]?.charts?.[0]?.spec;
advisor.render('#container', firstSpec);
```

## 备注

- `advise` 的输出通常包含额外的元信息，例如推理理由、评分或文字洞察，可查看 `advises[i].insights` 等字段。
- `render` 步骤依赖于已绑定的渲染器（参见 Render 文档）。如果未绑定渲染器，可能会使用默认渲染或抛出异常，请先调用 `bindRenderer` 或传入渲染器再调用 render。
