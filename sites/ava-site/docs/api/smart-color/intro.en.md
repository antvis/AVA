---
title: What is SmartColor
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

SmartColor is a js/ts library for color computation.

# API Reference

There are seven parts of API reference for @antv/smart-color. Follow the links below to learn more. 

In SmartColor, we use the data structure [Color](https://github.com/antvis/color-schema#color) and [Palette](https://github.com/antvis/color-schema#palette) defined by the [@antv/color-schema](https://github.com/antvis/color-schema#readme).

* [Palette Generation](#palette-generation): Generate categorical or discrete scale palette based on [color scheme](https://github.com/neoddish/color-palette-json-schema#colorschemetype).
  
* [Palette Optimization](#palette-optimization): Optimize palette to enhance color discriminability.

* [Palette Extraction](#palette-extraction): Get palettes from strings and images.
  
* [Color Simulation](#color-simulation): Simulate color blindness and color in grayscale.

* [Color Evaluation](#color-evaluation): Evaluate color discriminability and aesthetics.

* [Color Computation](#color-computation): Blend colors, brighten or darken colors.

* [Color Convertion](#color-conversion): Convert color into different formats.

## Palette Generation

* [paletteGeneration](./generators#paletteGeneration) - Generate categorical or discrete scale palette based on [color scheme](https://github.com/neoddish/color-palette-json-schema#colorschemetype).

## Palette Optimization

* [paletteOptimization](./optimizers#paletteOptimization) - Optimize palette to enhance color discriminability.
  
## Palette Extraction

* [getPaletteFromImage](./extractors#getPaletteFromImage) - Get palettes from images.
* [getPaletteFromString](./extractors#getPaletteFromString) - Get palettes from strings.

## Color Simulation

* [colorSimulation](./simulators#colorSimulation) - Simulate color blindness and color in grayscale.
* [invertGrayscale](./simulators#invertGrayscale) - Invert the new color from the gray value and the original color.

## Color Evaluation

* [colorDifference](./evaluators#colorDifference) - Evaluate the discriminability between two colors.
* [colorAesthetic](./evaluators#colorAesthetic) - Evaluate the aesthetic between two colors.

## Color Computation

* [colorBlend](./colorComputation#colorBlend) - Compute the color when two colors are overlapped.
* [colorBrighten](./colorComputation#colorBrighten) - Compute the brighter color.
* [colorDarken](./colorComputation#colorDarken) - Compute the darker color.

## Color Conversion

* [colorToArray](./colorConversion#colorToArray) - Convert [Color](https://github.com/neoddish/color-palette-json-schema#color) into array.
* [arrayToColor](./colorConversion#arrayToColor) - Convert array into [Color](https://github.com/neoddish/color-palette-json-schema#color).
* [colorToHex](./colorConversion#colorToHex) - Convert [Color](https://github.com/neoddish/color-palette-json-schema#color) into hexadecimal string.
* [hexToColor](./colorConversion#hexToColor) - Convert hexadecimal string into [Color](https://github.com/neoddish/color-palette-json-schema#color).
* [colorToGray](./colorConversion#colorToGray) - Convert [Color](https://github.com/neoddish/color-palette-json-schema#color) into gray number.
* [nameToColor](./colorConversion#nameToColor) - Convert valid css color name into [Color](https://github.com/neoddish/color-palette-json-schema#color).

</div>
