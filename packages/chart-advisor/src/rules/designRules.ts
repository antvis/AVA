import { DesignRule } from './concepts/designRule';
import { DataProps } from './concepts/rule';

import { VegaLiteEncodeingSpecification, SingleViewSpec } from '../advice-pipeline/interface';

export const DesignRules: DesignRule[] = [
  new DesignRule(
    'x-axis-line-fading',
    ['line_chart'],
    (dataProps: DataProps[], chartTypeSpec: SingleViewSpec): VegaLiteEncodeingSpecification => {
      if (chartTypeSpec.encoding.y?.type === 'quantitative') {
        const fieldInfo = dataProps.find((item) => item.name === chartTypeSpec.encoding.y?.field);
        if (fieldInfo) {
          if (
            fieldInfo.minimum &&
            fieldInfo.maximum &&
            fieldInfo.maximum - fieldInfo.minimum < (fieldInfo.maximum * 2) / 3
          ) {
            const yScaleMin = Math.floor((fieldInfo.minimum * 4) / 5);
            return {
              x: {
                ticks: false,
                domain: false,
              },
              y: {
                scale: {
                  domainMin: yScaleMin,
                },
              },
            };
          }
        }
      }
      return {};
    }
  ),
  // new DesignRule(
  //   'null-data-point',
  //   ['line_chart'],
  //   (dataProps: DataProps[], chartTypeSpec: SingleViewSpec): VegaLiteEncodeingSpecification => {
  //     console.log(dataProps);
  //     if (dataProps.some((item) => item.missing > 0)) {
  //       return {
  //         connectNulls: true
  //       };
  //     }
  //     return {};
  //   }
  // ),
];
