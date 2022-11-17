import type { RuleModule } from '../type';

export const dataFieldQty: RuleModule = {
  id: 'data-field-qty',
  type: 'HARD',
  docs: {
    lintText: 'Data must have at least the min qty of the prerequisite.',
  },
  trigger: () => {
    return true;
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps, chartType } = args;
    if (dataProps && chartType && Wiki[chartType]) {
      result = 1;
      const dataPres = Wiki[chartType].dataPres || [];
      const minFieldQty = dataPres.map((e: any) => e.minQty).reduce((acc: number, cv: number) => acc + cv);

      if (dataProps.length) {
        const fieldQty = dataProps.length;
        if (fieldQty >= minFieldQty) {
          result = 1;
        }
      }
    }
    return result;
  },
};
