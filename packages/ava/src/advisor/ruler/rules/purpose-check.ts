import { ckb } from '../../../ckb';

import type { RuleModule } from '../interface';

const Wiki = ckb();
const allChartTypes = Object.keys(Wiki);

export const purposeCheck: RuleModule = {
  id: 'purpose-check',
  type: 'HARD',
  docs: {
    lintText: 'Choose chart types that satisfy the purpose, if purpose is defined.',
  },
  trigger: ({ chartType }) => {
    return allChartTypes.includes(chartType);
  },
  validator: (args): number => {
    let result = 0;
    const { chartType, purpose } = args;

    // if purpose is not defined
    if (!purpose) {
      result = 1;
      return result;
    }

    if (chartType && Wiki[chartType] && purpose) {
      const purp = Wiki[chartType].purpose || '';
      if (purp.includes(purpose)) {
        result = 1;
        return result;
      }
    }
    return result;
  },
};
