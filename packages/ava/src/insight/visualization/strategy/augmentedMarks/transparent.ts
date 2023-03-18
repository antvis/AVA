import { HomogeneousPatternInfo } from '../../../types';
import { ChartTypeMap } from '../../constants';

/** make information that does not require attention opacity */
export function transparent(pattern: HomogeneousPatternInfo, colorField: string) {
  const { type, insightType, commonSet, exceptions = [] } = pattern;
  const chartType = ChartTypeMap[insightType];
  let highlightSet: string[] = [];
  if (type === 'commonness') {
    highlightSet = commonSet;
  } else if (type === 'exception') {
    highlightSet = exceptions;
  }
  const opacity = (value: string) => (highlightSet.includes(value) ? 1 : 0.2);
  if (chartType === 'line_chart') {
    return {
      lineStyle: (data) => {
        return {
          opacity: opacity(data[colorField]),
        };
      },
    };
  }
  if (chartType === 'column_chart') {
    return {
      columnStyle: (data) => {
        return {
          fillOpacity: opacity(data[colorField]),
        };
      },
    };
  }
  return {};
}
