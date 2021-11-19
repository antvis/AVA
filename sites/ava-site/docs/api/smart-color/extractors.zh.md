---
title: 色板提取
order: 3
---

`markdown:docs/common/style.md`



# 色板提取

从字符串和图像中获取色板。

## 使用方法

<a name="getPaletteFromImage" href="#getPaletteFromImage">#</a> **getPaletteFromImage**<i>(url: string, count: number=6, quality: number = 10) => Promise<Palette | undefined></i>

从图像中获取色板。因为图像是异步加载的，所以会返回一个 Promise。当图像被成功加载时，返回获得的色板。当图像加载失败时，返回 undefined。

* ***count*** 是预期包含在调色板中的颜色数量，默认为 6，需要是一个不能大于 50 的整数。
* ***quality*** 必须是一个大于等于 1 的整数，默认为 10。这个数字决定了在对下一个像素进行采样之前会跳过多少个像素。这个数字越大，提取速度就越快。

```ts
import { getPaletteFromImage } from '@antv/smart-color';
const url = 'sea.jpeg';
getPaletteFromImage(url);
// {
//   name: "image",
//   semantic: null,
//   type: "categorical",
//   colors: [
//     { model: "rgb", value: { r: 58, g: 169, b: 179 }, },
//     { model: "rgb", value: { r: 203, g: 220, b: 227 }, },
//     { model: "rgb", value: { r: 143, g: 197, b: 206 }, },
//     { model: "rgb", value: { r: 7, g: 64, b: 120 }, },
//     { model: "rgb", value: { r: 13, g: 100, b: 143 }, },
//     { model: "rgb", value: { r: 52, g: 143, b: 118 }, }
//   ]
// }
```

<div align="center">
  <img height=200 src="https://gw.alipayobjects.com/zos/antfincdn/cPwfiqSLlk/sea.jpeg" alt=" image">
</div>
<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/MI9uOb1ImE/jieping2021-07-01%252520xiawu5.18.28.png" alt="palette from image">
</div>


<a name="getPaletteFromString" href="#getPaletteFromString">#</a> **getPaletteFromString**<i>(string: string) => Palette</i>

从字符串中获取调色板。字符串需要由十六进制的字符串组成，用逗号分割。

```ts
import { getPaletteFromString } from '@antv/smart-color';

getPaletteFromString("#FB9747,#DE5844,#52BFC1,#22A34C");
// {
//   name: "code",
//   semantic: null,
//   type: "categorical",
//   colors: [
//     { model: "rgb", value: { r: 251, g: 151, b: 71 } },
//     { model: "rgb", value: { r: 222, g: 88, b: 68 } },
//     { model: "rgb", value: { r: 82, g: 191, b: 193 } },
//     { model: "rgb", value: { r: 34, g: 163, b: 76 } }
//   ]
// }
```

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/Mun96I6Wlc/jieping2021-07-01%252520xiawu5.57.35.png" alt="palette from string" width=600>
</div>


