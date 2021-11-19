---
title: Palette Extraction
order: 3
---

`markdown:docs/common/style.md`



# Palette Extraction

Get palettes from strings and images.

## Usage

<a name="getPaletteFromImage" href="#getPaletteFromImage">#</a> **getPaletteFromImage**<i>(url: string, count: number=6, quality: number = 10) => Promise<Palette | undefined></i>

Get palettes from images. Because the image is loaded asynchronously, a promise is returned. When the image is successfully loaded, the obtained palette is returned. When the image fails to load, return undefined.

* ***count*** is the number of colors expected to be included in the palette, the default is 6. It needs to be an integer and cannot be larger than 50.
* ***quality*** must be an integer with a value of 1 or greater, the default is 10. This number determines how many pixels will be skipped before the next pixel is sampled. The larger the number, the faster the extraction.

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

Get palettes from string. The string needs to be composed of hexadecimal string, split by commas.

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


