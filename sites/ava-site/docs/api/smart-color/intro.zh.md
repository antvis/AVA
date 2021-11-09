---
title: 什么是 SmartColor
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

SmartColor 是一个 js/ts 的前端颜色处理类库。

# API

@antv/smart-color 的 API 有七个部分。点击下面的链接来查看详情。

在 SmartColor 中，我们使用 [@antv/color-schema](https://github.com/antvis/color-schema#color) 所定义的数据结构 [Color](https://github.com/antvis/color-schema#palette) 和 [Palette](https://github.com/antvis/color-schema#palette) 作为基本颜色结构。

* [色板生成](#色板生成)。根据 [color scheme](https://github.com/neoddish/color-palette-json-schema#colorschemetype) 生成分类或离散比例的色板。
  
* [色板优化](#色板优化)。优化色板以提高颜色的可辨别性。

* [色板提取](#色板提取)。从字符串和图像中获取色板。
  
* [颜色模拟](#颜色模拟)。模拟色盲和灰度视角的颜色。

* [色彩评价](#色彩评价)。从可辨别性和美学角度评估颜色。

* [色彩计算](#色彩计算)。混合颜色或使颜色变亮/变暗。

* [颜色转换](#颜色转换)。将颜色转换成不同的格式。

## 色板生成

* [paletteGeneration](./generators#paletteGeneration) - 基于 [color scheme](https://github.com/neoddish/color-palette-json-schema#colorschemetype) 生成分类或离散比例的调色板。

## 色板优化

* [paletteOptimization](./optimizers#paletteOptimization) - 优化色板以提高颜色的可辨别性。
  
## 色板提取

* [getPaletteFromImage](./extractors#getPaletteFromImage) - 从图像中获取色板。
* [getPaletteFromString](./extractors#getPaletteFromString) - 从字符串中获取色板。

## 颜色模拟

* [colorSimulation](./simulators#colorSimulation) - 模拟色盲和灰度的颜色。
* [invertGrayscale](./simulators#invertGrayscale) - 从灰度值和原始颜色反转新的颜色。

## 颜色评估

* [colorDifference](./evaluators#colorDifference) - 评估两种颜色之间的可辨别性。
* [colorAesthetic](./evaluators#colorAesthetic) - 从美学角度评估两种颜色。

## 色彩计算

* [colorBlend](./colorComputation#colorBlend) - 计算两种颜色重叠时的颜色。
* [colorBrighten](./colorComputation#colorBrighten) - 计算更亮的颜色。
* [colorDarken](./colorComputation#colorDarken) - 计算较暗的颜色。

## 颜色转换

* [colorToArray](./colorConversion#colorToArray) - 将 [Color](https://github.com/neoddish/color-palette-json-schema#color) 转换成数组。
* [arrayToColor](./colorConversion#arrayToColor) - 将数组转换成 [Color](https://github.com/neoddish/color-palette-json-schema#color)。
* [colorToHex](./colorConversion#colorToHex) - 将 [Color](https://github.com/neoddish/color-palette-json-schema#color)转换成十六进制的字符串。
* [hexToColor](./colorConversion#hexToColor) - 将十六进制字符串转换成 [Color](https://github.com/neoddish/color-palette-json-schema#color)。
* [colorToGray](./colorConversion#colorToGray) - 将 [Color](https://github.com/neoddish/color-palette-json-schema#color) 转换成灰度值。
* [nameToColor](./colorConversion#nameToColor) - 将有效的css颜色名称转换成 [Color](https://github.com/neoddish/color-palette-json-schema#color)。

</div>
