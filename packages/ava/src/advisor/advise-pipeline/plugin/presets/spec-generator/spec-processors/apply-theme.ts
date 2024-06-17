import { type ColorSchemeType, colorToHex } from '@antv/color-schema';
import { hexToColor, paletteGeneration } from '@antv/smart-color';

import { BasicDataPropertyForAdvice, Specification, Theme } from '../../../../../types';
import { getSpecWithEncodeType } from '../../../../../utils/infer-data-type';
import { DISCRETE_PALETTE_TYPES, CATEGORICAL_PALETTE_TYPES } from '../../../../constants';

export function applyTheme(dataProps: BasicDataPropertyForAdvice[], chartSpec: Specification, theme: Theme) {
  const specWithEncodeType = getSpecWithEncodeType(chartSpec);
  const { primaryColor } = theme;
  const layerEnc = specWithEncodeType.encode;
  if (primaryColor && layerEnc) {
    // convert primary color
    const color = hexToColor(primaryColor);
    // if color is specified
    if (layerEnc.color) {
      const { type, field } = layerEnc.color;
      let colorScheme: ColorSchemeType;
      if (type === 'quantitative') {
        colorScheme = DISCRETE_PALETTE_TYPES[Math.floor(Math.random() * DISCRETE_PALETTE_TYPES.length)];
      } else {
        colorScheme = CATEGORICAL_PALETTE_TYPES[Math.floor(Math.random() * CATEGORICAL_PALETTE_TYPES.length)];
      }
      const count = dataProps.find((d) => d.name === field)?.count;
      const palette = paletteGeneration(colorScheme, {
        color,
        count,
      });
      return {
        scale: {
          color: { range: palette.colors.map((color) => colorToHex(color)) },
        },
      };
    }

    return chartSpec.type === 'line'
      ? {
          style: {
            stroke: colorToHex(color),
          },
        }
      : {
          style: {
            fill: colorToHex(color),
          },
        };
  }
  return {};
}
