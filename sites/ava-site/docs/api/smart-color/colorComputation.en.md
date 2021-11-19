---
title: Color Computation
order: 5
---

`markdown:docs/common/style.md`



# Color Computation

Blend colors, brighten or darken colors.

## Usage

<a name="colorBlend" href="#colorBlend">#</a> **colorBlend**<i>(colorTop: Color, colorBottom: Color, mode: BlendMode='normal') => Color</i>

Computes the color when two colors are overlapped. Different overlapping order will result in different colors.

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/qKvUFLCEiD/overlap.png" alt="color blend order">
</div>

Valid [blend modes](https://en.wikipedia.org/wiki/Blend_modes) are `normal`, `darken`, `multiply`, `colorBurn`, `linearBurn`, `lighten`, `screen`, `colorDodge`, `linearDodge`, `overlay`, `softLight`, `hardLight`, `vividLight`, `linearLight`, `pinLight`, `difference`, `exclusion` , `hue`, `saturation`, `color`, `luminosity`. 

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/0CC2apOOZz/colorblend.svg" alt="color blend mode">
</div>

```ts
import { colorBlend } from '@antv/smart-color';

const red = {
  model: 'rgba',
  value: { r: 255, g: 0, b: 0, a: 0.4 },
};
const blue = {
  model: 'rgba',
  value: { r: 0, g: 0, b: 255, a: 0.8 },
};
const color1 = colorBlend(blue, red);
// { model: 'rgba', value: { r: 23, g: 0, b: 232, a: 0.88 } } 
const color2 = colorBlend(red, blue);
// { model: 'rgba', value: { r: 116, g: 0, b: 139, a: 0.88 } }


const colorTop = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 }
};
const colorBottom = {
  model:"rgb",
  value:{r:97,g:221,b:170}
};
colorBlend(colorTop, colorBottom, "multiply");
// { "model": "rgb", "value": { "r": 34, "g": 123, "b": 166 }}
```

<a name="colorBrighten" href="#colorBrighten">#</a> **colorBrighten**<i>(color: Color, value: number=1) => Color</i>

Get brighter color. 

<a name="colorDarken" href="#colorDarken">#</a> **colorDarken**<i>(color: Color, value: number=1) => Color</i>

Get darker color.

```ts
import { colorBrighten, colorDarken } from '@antv/smart-color';

const color = {
  model: 'rgb',
  value: { r: 24, g: 144, b: 255 },
};

colorBrighten(color);
// { model: 'rgb', value: { r: 64, g: 169, b: 255 } } 
colorBrighten(color, 3);
// { model: 'rgb', value: { r: 145, g: 213, b: 255 } }

colorDarken(color);
// { model: 'rgb', value: { r: 9, g: 109, b: 217 } } 
colorDarken(color, 3);
// { model: 'rgb', value: { r: 0, g: 58, b: 140 } }
```

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/jpiAxmGXJZ/brighten-darken.png" alt="color brighten and darken">
</div>


