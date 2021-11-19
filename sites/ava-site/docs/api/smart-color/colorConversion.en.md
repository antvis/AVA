---
title: Color Conversion
order: 6
---

`markdown:docs/common/style.md`



# Color Conversion

Convert color into different formats.

## Usage

<a name="colorToArray" href="#colorToArray">#</a> **colorToArray**<i>(color: Color, colorModel?: ColorModel) => number[]</i>

Convert [Color](https://github.com/neoddish/color-palette-json-schema#color) into array. 
The default value of colorModel is the color model used in color.

```ts
import { colorToArray } from '@antv/smart-color';

const color = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 },
};

colorToArray(color); // [91, 143, 249]
colorToArray(color, 'hsv'); //[ 220.25316455696202, 0.6345381526104418, 0.9764705882352941 ]
```

<a name="arrayToColor" href="#arrayToColor">#</a> **arrayToColor**<i>(array: number[], colorModel?: ColorModel) => Color</i>

Convert array into [Color](https://github.com/neoddish/color-palette-json-schema#color). 
The default value of colorModel is "rgba" if the length of the array is 4, otherwise the default value of colorModel is "rgb".

```ts
import { arrayToColor } from '@antv/smart-color';

arrayToColor([91, 143, 249]);
// {
//   model: "rgb",
//   value: { r: 91, g: 143, b: 249 },
// }

arrayToColor([220.25, 0.63, 0.98], 'hsv');
// {
//   model: "hsv",
//   value: { h: 220.25, s: 0.63, v: 0.98 },
// }
```

<a name="colorToHex" href="#colorToHex">#</a> **colorToHex**<i>(color: Color) => string</i>

Convert [Color](https://github.com/neoddish/color-palette-json-schema#color) into hexadecimal string.

```ts
import { colorToHex } from '@antv/smart-color';

const color = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 },
};

colorToHex(color); // #5b8ff9
```

<a name="hexToColor" href="#hexToColor">#</a> **hexToColor**<i>(hex: string) => Color</i>

Convert hexadecimal string into [Color](https://github.com/neoddish/color-palette-json-schema#color).

```ts
import { hexToColor } from '@antv/smart-color';

hexToColor('#5b8ff9');
// {
//   model: "rgb",
//   value: { r: 91, g: 143, b: 249 },
// };
```

<a name="colorToGray" href="#colorToGray">#</a> **colorToGray**<i>(color: Color) => number</i>

Convert [Color](https://github.com/neoddish/color-palette-json-schema#color) into gray number.

```ts
import { colorToGray } from '@antv/smart-color';

const color = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 },
};

colorToGray(color); // 140
```

<a name="nameToColor" href="#nameToColor">#</a> **nameToColor**<i>(name: string) => Color</i>

Convert valid css color name into [Color](https://github.com/neoddish/color-palette-json-schema#color).

```ts
import { nameToColor } from '@antv/smart-color';

nameToColor('moccasin');
// {
//   model: 'rgb',
//   value: { r: 255, g: 228, b: 181 },
// });

nameToColor('aliceblue');
// {
//   model: 'rgb',
//   value: { r: 240, g: 248, b: 255 },
// });
```


