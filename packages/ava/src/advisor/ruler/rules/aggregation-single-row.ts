import { ckb } from '../../../ckb';

import type { RuleModule } from '../interface';

const Wiki = ckb();
const allChartTypes = Object.keys(Wiki) as string[];
export const aggregationSingleRow: RuleModule = {
  id: 'aggregation-single-row',
  type: 'HARD',
  docs: {
    lintText: 'Recommend kpi_panel when only one row of aggregated data is available.',
  },
  trigger: ({ chartType }) => {
    return allChartTypes.indexOf(chartType) !== -1;
  },
  validator: (args): number => {
    let result = 0;
    const { chartType, dataProps } = args;
    if (dataProps.every((i) => i.count === 1 && i.levelOfMeasurements.includes('Interval'))) {
      result = chartType === 'kpi_panel' ? 1 : 0.2;
    } else {
      result = chartType === 'kpi_panel' ? 0 : 1;
    }
    return result;
  },
};
