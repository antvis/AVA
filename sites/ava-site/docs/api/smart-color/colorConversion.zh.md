---
title: 颜色转换
order: 6
---

`markdown:docs/common/style.md`



# 颜色转换

将颜色转换成不同的格式。

## 使用方法

<a name="colorToArray" href="#colorToArray">#</a> **colorToArray**<i>(color: Color, colorModel?: ColorModel) => number[]</i>

将 [Color](https://github.com/neoddish/color-palette-json-schema#color) 转换成数组。
colorModel 的默认值是 color 中使用的颜色模型。

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

将数组转换为 [Color](https://github.com/neoddish/color-palette-json-schema#color). 
如果数组的长度是4，colorModel的默认值是 "rgba"，否则colorModel的默认值是 "rgb"。

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

将 [Color](https://github.com/neoddish/color-palette-json-schema#color) 转换成十六进制的字符串。

```ts
import { colorToHex } from '@antv/smart-color';

const color = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 },
};

colorToHex(color); // #5b8ff9
```

<a name="hexToColor" href="#hexToColor">#</a> **hexToColor**<i>(hex: string) => Color</i>

十六进制的字符串转换成 [Color](https://github.com/neoddish/color-palette-json-schema#color).

```ts
import { hexToColor } from '@antv/smart-color';

hexToColor('#5b8ff9');
// {
//   model: "rgb",
//   value: { r: 91, g: 143, b: 249 },
// };
```

<a name="colorToGray" href="#colorToGray">#</a> **colorToGray**<i>(color: Color) => number</i>

将 [Color](https://github.com/neoddish/color-palette-json-schema#color) 转换成灰度值。

```ts
import { colorToGray } from '@antv/smart-color';

const color = {
  model: 'rgb',
  value: { r: 91, g: 143, b: 249 },
};

colorToGray(color); // 140
```

<a name="nameToColor" href="#nameToColor">#</a> **nameToColor**<i>(name: string) => Color</i>

将有效的 css 颜色名转换成 [Color](https://github.com/neoddish/color-palette-json-schema#color).

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


