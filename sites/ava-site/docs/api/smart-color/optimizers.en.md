---
title: Palette Optimization
order: 2
---

`markdown:docs/common/style.md`



# Palette Optimization

## Usage

<a name="paletteOptimization" href="#paletteOptimization">#</a> **paletteOptimization**<i>(palette: Palette, configuration: OptimizerConfiguration={}) => Palette</i>

Optimize palette to enhance color discriminability. Our optimization strategy is to increase the minimal difference among different pairs of colors.

As shown in the figure below, we visualize the differences between colors through a matrix. The blocks highlighted in red are below the threshold and the corresponding two colors are not easily distinguishable. We expect to make the difference between all colors greater than a threshold with the help of an optimization algorithm.

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/6VpNTw4PSE/optimize.svg" width="600" alt="optimize palette"></img>
</div>

* ***palette*** is the palette that needs to be optimized.
* ***configuration*** configure the palette optimization.
  
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


