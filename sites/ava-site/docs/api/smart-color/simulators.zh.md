---
title: 颜色模拟
order: 4
---

`markdown:docs/common/style.md`



# 颜色模拟

## 使用方法

<a name="colorSimulation" href="#colorSimulation">#</a> **colorSimulation**<i>(color: Color, type: SimulationType="normal") => Color</i>

模拟色盲和灰度视角的颜色。

* ***type*** 描述了可以进行的模拟类型，包括正常模式 `normal`，八种不同的色盲模式 `color blindness`，以及灰度模式 `grayscale` 下的颜色
  * `normal`
  * color blindness (`protanopia`, `protanomaly`, `deuteranopia`, `deuteranomaly`, `tritanopia`, `tritanomaly`, `achromatopsia`, `achromatomaly`)
  * `grayscale`

```ts
import { colorSimulation } from '@antv/smart-color';

const color = {
  model: "rgb",
  value: { r: 91, g: 143, b: 249 },
}; 

colorSimulation(color); 
// { model: "rgb", value: { r: 91, g: 143, b: 249 } }
colorSimulation(color, "achromatopsia");
// { model: 'rgb', value: { r: 122, g: 141, b: 179 } }
colorSimulation(color, "grayscale");
// { model: 'rgb', value: { r: 140, g: 140, b: 140 } }
```

<a name="invertGrayscale" href="#invertGrayscale">#</a> **invertGrayscale**<i>(grayscaleValue: number, color: Color) => Color</i>

从灰度值和原始颜色中反转出新的颜色。

* ***grayscaleValue*** 取值范围为 [0,1]，定义黑色为 0，白色为 1。

```ts
import { invertGrayscale } from '@antv/smart-color';

const color = {
  model: "rgb",
  value: { r: 91, g: 143, b: 249 },
}; 

invertGrayscale(0.8, color);
//{
//   model: 'lab',
//   value: { l: 86, a: 15.189939985936984, b: -58.16592090107158 }
// }
```


