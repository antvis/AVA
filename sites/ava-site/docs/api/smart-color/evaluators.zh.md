---
title: 色彩评价
order: 3
---

`markdown:docs/common/style.md`



# 色彩评价

从可辨别性和美学角度评估颜色。

## 使用方法

<a name="colorDifference" href="#colorDifference">#</a> **colorDifference**<i>(color1: Color, color2: Color, configuration: ColorDifferenceConfiguration={}) => number</i>

计算 `color1` 和 `color2` 之间的可辨别性。它支持通过不同的评价标准评估颜色差异，如 `欧氏距离`, `CIEDE2000`, `对比度`.

* ***configuration*** 用于配置色彩差异的计算。
  
| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| measure | `ColorDifferenceMeasure` | The measure used to evaluate color differences. | `"euclidean"` |
| backgroundColor | `Color` | When the color is transparent or semi-transparent , the background color plays a role, as semi-transparent colors will behave differently on different background colors. | `{ model: 'rgb', value: { r: 255, g: 255, b: 255 } } `(white) |
| colorModel |  `ColorModel` | Only valid when measure is "euclidean", used to specify the color model used in computing the distance. | `"lab"` |

* 计算给定颜色模型中两种颜色之间的**欧氏距离**（默认为Lab）。
欧氏距离的范围取决于颜色模型。

```ts
import { colorDifference } from '@antv/smart-color';

const color1 = {
  model: "rgb",
  value: { r: 91, g: 143, b: 249 },
}; 
const color2 = {
  model: "rgb",
  value: { r: 101, g: 120, b: 155 },
};

colorDifference(color1, color2); //40.71
colorDifference(color1, color2, {measure: 'euclidean', colorModel: 'rgb'}); //97.29
```

* 计算给定颜色模型中两种颜色之间的 **[CIEDE2000](https://en.wikipedia.org/wiki/Color_difference#CIEDE2000)** 差异.
CIEDE2000 的范围是 [0, 100].

```ts
import { colorDifference } from '@antv/smart-color';

const color1 = {
  model: "rgb",
  value: { r: 91, g: 143, b: 249 },
}; 
const color2 = {
  model: "rgb",
  value: { r: 101, g: 120, b: 155 },
};

colorDifference(color1, color2, {measure: 'CIEDE2000'}); //14.12
```

* 计算给定颜色模型中两种颜色之间的 **[对比度](https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio)** 差异.
对比度的范围是 [1, 21].

```ts
import { colorDifference } from '@antv/smart-color';

const color1 = {
  model: "rgb",
  value: { r: 91, g: 143, b: 249 },
}; 
const color2 = {
  model: "rgb",
  value: { r: 101, g: 120, b: 155 },
};

colorDifference(color1, color2, {measure: 'contrastRatio'});  //1.43
```

<a name="colorAesthetic" href="#colorAesthetic">#</a> **colorAesthetic**<i>(color1: Color, color2: Color, configuration: ColorAestheticConfiguration={}) => number</i>

计算 `color1` 和 `color2` 之间的审美差异。它支持通过不同的评价标准来评估颜色的美感，如 `Pair Preference`, `Color Harmony`。

* ***configuration*** 用于配置色彩审美的计算。
  
| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| measure | `ColorAestheticMeasure` | The measure used to evaluate color aesthetics. | `"pairPreference"` |
| backgroundColor | `Color` | When the color is transparent or semi-transparent , the background color plays a role, as semi-transparent colors will behave differently on different background colors. | `{ model: 'rgb', value: { r: 255, g: 255, b: 255 } } `(white) |

* 基于 **[Pair Preference](https://ieeexplore.ieee.org/abstract/document/7539386/)** 计算两种颜色之间的差异。
**[Pair Preference](https://ieeexplore.ieee.org/abstract/document/7539386/)** 的评分函数反映了人们对包含明度不同、色调相近的冷色的颜色组合的偏好。

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/ZaVSw6A8S2/meiguanxing.png" width="300" alt="pair preference">
</div>


```ts
import { colorAesthetic } from '@antv/smart-color';

const color1 = {
  model: "rgb",
  value: { r: 91, g: 143, b: 249 },
}; 
const color2 = {
  model: "rgb",
  value: { r: 101, g: 120, b: 155 },
};

colorAesthetic(color1, color2);  //52.40
```

* 基于 **[Color Harmony](https://ieeexplore.ieee.org/abstract/document/7539386/)** 计算两种颜色之间的差异。
**[Color Harmony](https://ieeexplore.ieee.org/abstract/document/7539386/)** 的评分函数反映了人们对色度效应、亮度效应和色调效应的偏好。

```ts
import { colorAesthetic } from '@antv/smart-color';

const color1 = {
  model: "rgb",
  value: { r: 91, g: 143, b: 249 },
}; 
const color2 = {
  model: "rgb",
  value: { r: 101, g: 120, b: 155 },
};

colorAesthetic(color1, color2, { "measure": "harmony" });  //-0.13
```


