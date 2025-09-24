import { verifyDataProps } from '../utils';
import { intersects } from '../../utils';

import type { RuleModule, BasicDataPropertyForAdvice } from '../types';

export const dataCheck: RuleModule = {
  id: 'data-check',
  type: 'HARD',
  docs: {
    lintText: 'Data must satisfy the data prerequisites.',
  },
  trigger: () => {
    return true;
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps, chartType, chartWIKI } = args;

    if (dataProps && chartType && chartWIKI[chartType]) {
      result = 1;
      const dataPres = chartWIKI[chartType].dataPres || [];
      dataPres.forEach((dataPre) => {
        if (!verifyDataProps(dataPre, dataProps as BasicDataPropertyForAdvice[])) {
          result = 0;
        }
      });
      const fieldsLOMs = dataProps.map((info: any) => {
        return info.levelOfMeasurements;
      });
      fieldsLOMs.forEach((fieldLOM) => {
        let flag = false;
        dataPres.forEach((dataPre) => {
          if (fieldLOM && intersects(fieldLOM, dataPre.fieldConditions)) {
            flag = true;
          }
        });
        if (!flag) {
          result = 0;
        }
      });
    }
    return result;
  },
};
