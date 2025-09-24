import type { RuleModule } from '../types';

export const purposeCheck: RuleModule = {
  id: 'purpose-check',
  type: 'HARD',
  docs: {
    lintText: 'Choose chart types that satisfy the purpose, if purpose is defined.',
  },
  trigger: () => {
    return true;
  },
  validator: (args): number => {
    let result = 0;
    const { chartType, purpose, chartWIKI } = args;

    // if purpose is not defined
    if (!purpose) {
      result = 1;
      return result;
    }

    if (chartType && chartWIKI[chartType] && purpose) {
      const purp = chartWIKI[chartType].purpose || '';
      if (purp.includes(purpose)) {
        result = 1;
        return result;
      }
    }
    return result;
  },
};
