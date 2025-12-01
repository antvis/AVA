---
title: 图表推荐(advise)
order: 2
redirect_from:
  - /zh/docs/api
---

## Advise

本页面说明“图表推荐（advise）”功能：基于数据生成图表建议的典型流程。

### 概述

`advise` 会基于数据特征生成建议的图表规格（spec）。典型流程：

1. `extract` — 从原始数据提取特征/分片
2. `advise` — 基于提取结果生成图表建议
3. `render` — 使用指定的渲染器渲染推荐的图表

AVA 类（来自 `@antv/ava`）负责协调这些步骤。

### 使用示例

```ts
import { AVA } from '@antv/ava';

const ava = new AVA({ /* 配置 */ });
const shards = await ava.extract(`请根据数据生成图表建议${JSON.stringify(data)}`);
const advises = await ava.advise(shards);
// advises 是建议数组，通常包含 charts、insights、metadata 等字段
const firstSpec = advises[0]?.charts?.[0]?.spec;
ava.render('#container', firstSpec);
```

### 备注

- `advise` 的输出通常包含额外的元信息，例如推理理由、评分或文字洞察，可查看 `advises[i].insights` 等字段。
- `render` 步骤依赖于已绑定的渲染器（参见 Render 文档）。如果未绑定渲染器，可能会使用默认渲染或抛出异常，请先调用 `bindRenderer` 或传入渲染器再调用 render。

### 调用参数
| 名称 | 类型 | 是否必选 | 描述 |
| --- | --- | --- | --- |
| input | [DataShard](./extract#datashard)[], string | 是 | 分片数组或者任何文本

### 返回结果
| 名称 | 类型 | 描述 |
| --- | --- | --- |
| result | [Spec](./antv-spec/antv-spec)[] | 图表 Spec 数组，详见[图表知识库](./antv-spec/area)
