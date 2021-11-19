---
title: Introduction to SmartColor
order: 0
---

`markdown:docs/common/style.md`



SmartColor is a js/ts library for color computation.

## ✨ Features

* **Palette Generation**: Generate categorical or discrete scale palette based on [color scheme](https://github.com/neoddish/color-palette-json-schema#colorschemetype).
* **Palette Optimization**: Optimize palette to enhance color discriminability.
* **Palette Extraction**: Get palettes from strings and images.
* **Color Simulation**: Simulate color blindness and color in grayscale.
* **Color Evaluation**: Evaluate color discriminability and aesthetics.
* **Color Computation**: Blend colors, brighten or darken colors.
* **Color Conversion**: Convert color into different formats.

## 📦 Installation

```bash
$ npm install @antv/smart-color
```

## 🔨 Usage

* Palette Generation

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

* Palette Optimization

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

* Color Simulation

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


