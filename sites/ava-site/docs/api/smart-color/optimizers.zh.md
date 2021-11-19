---
title: 色板优化
order: 2
---

`markdown:docs/common/style.md`



# 色板优化

## 使用方法

<a name="paletteOptimization" href="#paletteOptimization">#</a> **paletteOptimization**<i>(palette: Palette, configuration: OptimizerConfiguration={}) => Palette</i>

优化色板以提高颜色的可辨别性。我们的优化策略是尽可能的提高不同颜色对之间的最小差异。

如下图所示，我们通过一个矩阵将颜色之间的差异可视化。其中，红色突出显示的区块低于阈值，相应的两种颜色不容易区分。我们期望在优化算法的帮助下，使所有颜色之间的差异都大于阈值。

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/6VpNTw4PSE/optimize.svg" width="600" alt="optimize palette"></img>
</div>

* ***palette*** 是需要优化的色板。
* ***configuration*** 配置色板优化。
  
| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| simulationType | `SimulationType` |The types of simulations, the normal case, the eight different modes of color blindness, and the colors in grayscale mode. | `"normal"` |
| locked |  `boolean[]` | Each item in the array indicates whether the color of the same index in the color palette should be kept constant during optimization. | `any[]` |
| colorDifferenceMeasure | `ColorDifferenceMeasure` | Measure used to assess color differences when optimizing. You can find more details in [colorDifference](./evaluators.md#colorDifference).  | `euclidean` |
| threshold | `number` | The minimum difference expected to be achieved between the colors in the optimized palette. Since different color difference methods have different ranges of values, they have different default thresholds. However, this threshold is not always reached in each optimization, and it depends mainly on the number of colors in this palette and the difference at the beginning. | `30`(euclidean)<br>`20`(CIEDE2000) |
| backgroundColor | `Color` | The background color of the palette. The background color plays a role when the palette contains transparent or semi-transparent colors, because the semi-transparent colors will behave differently on different background colors. | `{ model: 'rgb', value: { r: 255, g: 255, b: 255 } } `(white) |
| colorModel | `ColorModel` | The color model used in the optimization. Not effective in grayscale mode. | `hsv` |

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
// {
//   name: 'color4',
//   semantic: null,
//   type: 'categorical',
//   colors: [
//     { model: 'lab', value: { l: 50, a: 1.884390226403243, b: -21.110092594683195 } },
//     { model: 'lab', value: { l: 67, a: 15.189939985936984, b: -58.16592090107158 } },
//     { model: 'lab', value: { l: 88, a: -46.47148306857496, b: 14.77171302964486 } },
//     { model: 'lab', value: { l: 107, a: 7.792165626943515, b: 79.05751395687457 } }
//   ]
// }
```

<div align="center">
  <div>
    <span>Before:</span>
    <img src="https://gw.alipayobjects.com/zos/antfincdn/jT0dtYywS8/jieping2021-07-01%252520xiawu3.24.42.png" alt="palette before optimization">
  </div>
  <div>
    After:
    <img src="https://gw.alipayobjects.com/zos/antfincdn/HCdz8Z8kr%26/jieping2021-07-01%252520xiawu3.24.29.png" alt="palette after optimization" >
  </div>
</div>


