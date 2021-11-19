---
title: Palette Generation
order: 1
---

`markdown:docs/common/style.md`



# Palette Generation

## Usage

<a name="paletteGeneration" href="#paletteGeneration">#</a> **paletteGeneration**<i>(type: ColorSchemeType="monochromatic", configuration: GeneratorConfiguration={}) => Palette</i>

Generate categorical or discrete scale palette based on [color scheme](https://github.com/neoddish/color-palette-json-schema#colorschemetype).

* ***type*** describes which **color scheme** is used to generate the palettes. Different color scheme will generate different types of palettes.

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/xzoCX2mhQg/colorscheme.svg" width="600" alt="color scheme"></img>
</div>

* ***configuration*** configure the palette optimization.
  
| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| count | `number` | The number of colors expected to be included in the palette. | `8` |
| color |  `Color` | The primary color, generally be the brand color. | random |
| colors | `(Color \| undefined)[]` | Each item in the array indicates that the same color is expected to appear at the same index of the generated palette. Not effective for the generation of discrete palettes. | `any[]` |
| tendency | `tint \| shade` | Color trends of discrete-scale palette. | `tint` |

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
// {
//   name: 'monochromatic',
//   semantic: null,
//   type: 'discrete-scale',
//   colors: [
//     { model: 'lab', value: { l: 83.74, a: -6.81, b: -24.76 } },
//     { model: 'lab', value: { l: 71.69, a: 0.09, b: -43.46 },
//     { model: 'lab', value: { l: 59.67, a: 7.64, b: -59.28 }, 
//     { model: 'lab', value: { l: 46.47, a: 7.14, b: -59.32 },
//     { model: 'lab', value: { l: 34.34, a: 10.40, b: -57.50 },
//     { model: 'lab', value: { l: 23.17, a: 16.63, b: -54.50 },
//     { model: 'lab', value: { l: 12.94, a: 21.15, b: -49.67 }
//   ]
// }
```

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/vmwgZKfSZB/jieping2021-07-01%252520xiawu3.01.26.png" alt="auto generated palette">
</div>


