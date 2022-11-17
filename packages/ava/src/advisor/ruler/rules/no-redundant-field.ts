import type { RuleModule } from '../type';

export const noRedundantField: RuleModule = {
  id: 'no-redundant-field',
  type: 'HARD',
  docs: {
    lintText: 'No redundant field.',
  },
  trigger: () => {
    return true;
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps, chartType, chartWIKI } = args;

    if (dataProps && chartType && chartWIKI[chartType]) {
      const dataPres = chartWIKI[chartType].dataPres || [];
      const maxFieldQty = dataPres
        .map((e: any) => {
          if (e.maxQty === '*') {
            return 99;
          }
          return e.maxQty;
        })
        .reduce((acc: number, cv: number) => acc + cv);

      if (dataProps.length) {
        const fieldQty = dataProps.length;
        if (fieldQty <= maxFieldQty) {
          result = 1;
        }
      }
    }

    return result;
  },
};
