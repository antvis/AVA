import { RuleModule } from '../concepts/rule';

const applyChartTypes = ['line_chart'];

export const xAxisLineFading: RuleModule = {
  id: 'x-axis-line-fading',
  type: 'DESIGN',
  docs: {
    // FIXME formal description
    lintText: 'Adjust axis to make it prettier',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  optimizer: (dataProps, chartSpec): object => {
    const layerEnc = chartSpec.layer && 'encoding' in chartSpec.layer[0] ? chartSpec.layer[0].encoding : null;
    if (layerEnc && layerEnc.y?.type === 'quantitative') {
      const fieldInfo = dataProps.find((item) => item.name === layerEnc.y?.field);
      if (fieldInfo) {
        const range = fieldInfo.maximum - fieldInfo.minimum;
        if (fieldInfo.minimum && fieldInfo.maximum && range < (fieldInfo.maximum * 2) / 3) {
          const yScaleMin = Math.floor(fieldInfo.minimum - range / 5);
          return {
            encoding: {
              x: {
                axis: {
                  ticks: false,
                  domain: false,
                },
              },
              y: {
                scale: {
                  domainMin: yScaleMin > 0 ? yScaleMin : 0,
                },
              },
            },
          };
        }
      }
    }
    return {};
  },
};
