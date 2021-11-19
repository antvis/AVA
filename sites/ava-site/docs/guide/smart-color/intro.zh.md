---
title: SmartColor 简介
order: 0
---

`markdown:docs/common/style.md`



SmartColor 是一个 js/ts 的前端颜色处理类库。

## ✨ 功能特性

* **色板生成**: 根据 [color scheme](https://github.com/neoddish/color-palette-json-schema#colorschemetype) 生成分类或离散比例的调色板。
* **色板优化**: 优化色板以提高颜色的可识别性。
* **色板提取**: 从字符串和图像中获取色板。
* **颜色模拟**: 模拟色盲视角的颜色和灰度的颜色。
* **颜色评估**: 从可辨别性和审美角度评估颜色。
* **颜色计算**: 混合颜色或使颜色变亮/变暗。
* **颜色转换**: 将颜色转换为不同的格式。

## 📦 安装

```bash
$ npm install @antv/smart-color
```

## 🔨 使用

* 色板生成

```ts
import { paletteGeneration } from '@antv/smart-color';

paletteGeneration("monochromatic", {
  color: {
    model: "rgb",
    value: { r: 91, g: 143, b: 249 },
  },
  count: 7,
  tendency: "shade"
});
```

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/vmwgZKfSZB/jieping2021-07-01%252520xiawu3.01.26.png" alt="auto generated palette" width="100%">
</div>

* 色板优化

```ts
import { PaletteOptimization } from '@antv/smart-color';

const palette = {
  name: "color4",
  semantic: null,
  type: "categorical",
  colors: [
    { model: "rgb", value: { r: 101, g: 120, b: 155 }, },
    { model: "rgb", value: { r: 91, g: 143, b: 249 }, },
    { model: "rgb", value: { r: 97, g: 221, b: 170 }, },
    { model: "rgb", value: { r: 246, g: 189, b: 22 }, }
  ],
}
paletteOptimization(palette, {
  locked: [true],
  simulationType: "grayscale"
});
```

<div align="center">
  <div>
    <div>Before:</div>
    <img src="https://gw.alipayobjects.com/zos/antfincdn/jT0dtYywS8/jieping2021-07-01%252520xiawu3.24.42.png" alt="palette before optimization" width="100%">
  </div>
  <div>
    <div>After:</div>
    <img src="https://gw.alipayobjects.com/zos/antfincdn/HCdz8Z8kr%26/jieping2021-07-01%252520xiawu3.24.29.png" alt="palette after optimization" width="100%">
  </div>
</div>

* 颜色模拟

```ts
import { colorSimulation } from '@antv/smart-color';

const color = {
  model: "rgb",
  value: { r: 91, g: 143, b: 249 },
}
colorSimulation(color, "achromatomaly");
```

<div align="center">
  <img height=100 src="https://gw.alipayobjects.com/zos/antfincdn/fxjnaPrLZ6/jieping2021-07-01%252520xiawu3.11.52.png" alt="color simulation result">
</div>


