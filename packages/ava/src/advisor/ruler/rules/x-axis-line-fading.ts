import { getSpecWithEncodeType } from '../../utils/inferDataType';

import type { RuleModule } from '../types';

const applyChartTypes = ['line_chart'];

export const xAxisLineFading: RuleModule = {
  id: 'x-axis-line-fading',
  type: 'DESIGN',
  docs: {
    // FIXME formal description
    lintText: 'Adjust axis to make it prettier',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.includes(chartType);
  },
  optimizer: (dataProps, chartSpec): object => {
    const specWithEncodeType = getSpecWithEncodeType(chartSpec);
    const { encode } = specWithEncodeType;
    if (encode && encode.y?.type === 'quantitative') {
      const fieldInfo = dataProps.find((item) => item.name === encode.y?.field);
      if (fieldInfo) {
        const range = fieldInfo.maximum - fieldInfo.minimum;
        if (fieldInfo.minimum && fieldInfo.maximum && range < (fieldInfo.maximum * 2) / 3) {
          const yScaleMin = Math.floor(fieldInfo.minimum - range / 5);
          return {
            axis: {
              x: { tick: false },
            },
            scale: {
              y: {
                domainMin: yScaleMin > 0 ? yScaleMin : 0,
              },
            },
            clip: true,
          };
        }
      }
    }
    return {};
  },
};
