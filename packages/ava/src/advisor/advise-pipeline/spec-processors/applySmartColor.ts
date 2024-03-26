import { ColorSchemeType, colorToHex } from '@antv/color-schema';
import { SimulationType, hexToColor, paletteGeneration, colorSimulation } from '@antv/smart-color';

import { BasicDataPropertyForAdvice, Specification } from '../../types';
import { getSpecWithEncodeType } from '../../utils/inferDataType';

export function applySmartColor(
  dataProps: BasicDataPropertyForAdvice[],
  chartSpec: Specification,
  primaryColor: string,
  colorType: ColorSchemeType,
  simulationType: SimulationType
) {
  const specWithEncodeType = getSpecWithEncodeType(chartSpec);
  const layerEnc = specWithEncodeType.encode;
  if (primaryColor && layerEnc) {
    // convert primary color
    const color = hexToColor(primaryColor);
    // if color is specified
    if (layerEnc.color) {
      const { type, field } = layerEnc.color;
      let colorScheme = colorType;
      if (!colorScheme) {
        if (type === 'quantitative') {
          colorScheme = 'monochromatic';
        } else {
          colorScheme = 'polychromatic';
        }
      }
      const count = dataProps.find((d) => d.name === field)?.count;
      const palette = paletteGeneration(colorScheme, {
        color,
        count,
      });
      return {
        scale: {
          color: {
            range: palette.colors.map((color) => {
              return colorToHex(simulationType ? colorSimulation(color, simulationType) : color);
            }),
          },
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
