import { Mark } from '@antv/g2';

import { HomogeneousPatternInfo } from '../../../types';

/** todo make information that does not require attention opacity */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function transparent(_pattern: HomogeneousPatternInfo): Mark {
  // const { type, commonSet, exceptions = [] } = pattern;
  // const chartType = ChartTypeMap[insightType];
  // let highlightSet: string[] = [];
  // if (type === 'commonness') {
  //   highlightSet = commonSet;
  // } else if (type === 'exception') {
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   highlightSet = exceptions;
  // }
  // const opacity = (value: string) => (highlightSet.includes(value) ? 1 : 0.2);
  // if (chartType === 'line_chart') {
  //   return {
  //     lineStyle: (data) => {
  //       return {
  //         opacity: opacity(data[colorField]),
  //       };
  //     },
  //   };
  // }
  // if (chartType === 'column_chart') {
  //   return {
  //     columnStyle: (data) => {
  //       return {
  //         fillOpacity: opacity(data[colorField]),
  //       };
  //     },
  //   };
  // }
  return {};
}
