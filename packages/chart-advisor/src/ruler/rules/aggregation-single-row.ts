import { CKBJson } from '@antv/ckb';
import { RuleModule } from '../concepts/rule';

const Wiki = CKBJson('en-US', true);
export const aggregationSingleRow: RuleModule = {
  id: 'aggregation-single-row',
  type: 'HARD',
  chartTypes: Object.keys(Wiki) as string[],
  docs: {
    lintText: 'Recommend kpi_panel when only one row of aggregated data is available.',
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
