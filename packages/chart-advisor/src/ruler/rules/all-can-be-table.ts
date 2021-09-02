import { RuleModule } from '../concepts/rule';
import { isUndefined } from '../utils';

const applyChartTypes = ['table'];

export const allCanBeTable: RuleModule = {
  id: 'all-can-be-table',
  type: 'HARD',
  docs: {
    lintText: 'all dataset can be table',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: ({ weight }): number => {
    return isUndefined(weight) ? 1 : weight;
  },
};
