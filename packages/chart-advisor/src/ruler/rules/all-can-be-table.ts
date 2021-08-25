import { RuleModule } from '../concepts/rule';
import { isUndefined } from '../utils';

export const allCanBeTable: RuleModule = {
  id: 'all-can-be-table',
  type: 'HARD',
  chartTypes: ['table'],
  docs: {
    lintText: 'all dataset can be table',
  },
  validator: ({ weight }): number => {
    return isUndefined(weight) ? 1 : weight;
  },
};
