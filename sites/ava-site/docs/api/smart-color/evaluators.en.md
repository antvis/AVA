---
title: Color Evaluation
order: 3
---

`markdown:docs/common/style.md`



# Color Evaluation

Evaluate color discriminability and aesthetics.

## Usage

<a name="colorDifference" href="#colorDifference">#</a> **colorDifference**<i>(color1: Color, color2: Color, configuration: ColorDifferenceConfiguration={}) => number</i>

Computes the discriminability between `color1` and `color2`. It supports the assessment of color differences by different measures, such as `Euclidean difference`, `CIEDE2000`, `contrast ratio`.

* ***configuration*** configure the calculation of color difference.
  
| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| measure | `ColorDifferenceMeasure` | The measure used to evaluate color differences. | `"euclidean"` |
| backgroundColor | `Color` | When the color is transparent or semi-transparent , the background color plays a role, as semi-transparent colors will behave differently on different background colors. | `{ model: 'rgb', value: { r: 255, g: 255, b: 255 } } `(white) |
| colorModel |  `ColorModel` | Only valid when measure is "euclidean", used to specify the color model used in computing the distance. | `"lab"` |

* Computes the **Euclidean distance** between two colors in a given color model (default is Lab). 
The range of Euclidean distance is depend on color model.

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

* Computes the difference between two colors by **[CIEDE2000](https://en.wikipedia.org/wiki/Color_difference#CIEDE2000)**.
The range of CIEDE2000 is [0, 100].

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

* Computes the difference between two colors by **[Contrast ratio](https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio)**.
The range of Contrast ratio is [1, 21].

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

Computes the aesthetic between `color1` and `color2`. It supports the assessment of color aesthetics by different measures, such as `pairPreference`, `harmony`.

* ***configuration*** configure the calculation of color aesthetic.
  
| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| measure | `ColorAestheticMeasure` | The measure used to evaluate color aesthetics. | `"pairPreference"` |
| backgroundColor | `Color` | When the color is transparent or semi-transparent , the background color plays a role, as semi-transparent colors will behave differently on different background colors. | `{ model: 'rgb', value: { r: 255, g: 255, b: 255 } } `(white) |

* Computes the aesthetic between two colors by **[Pair Preference](https://ieeexplore.ieee.org/abstract/document/7539386/)**.
The Pair Preference scoring function reflects people’s preference for color combinations that contain cool colors that differ in lightness and are similar in hue.

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

* Computes the aesthetic between two colors by **[color harmony](https://ieeexplore.ieee.org/abstract/document/5457512)**.
Harmony scores are consisting of three independent color harmony factors: chromatic effect, lightness effect, and hue effect. 

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


