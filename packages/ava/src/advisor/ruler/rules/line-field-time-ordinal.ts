import { intersects } from '../../utils';

import type { RuleModule } from '../interface';

const applyChartTypes = ['line_chart', 'area_chart', 'stacked_area_chart', 'percent_stacked_area_chart'];

export const lineFieldTimeOrdinal: RuleModule = {
  id: 'line-field-time-ordinal',
  type: 'SOFT',
  docs: {
    lintText: 'Data containing time or ordinal fields are suitable for line or area charts.',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.includes(chartType);
  },
  validator: (args): number => {
    let result = 0;
    const { dataProps } = args;
    if (dataProps) {
      const field4TimeOrOrdinal = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Ordinal', 'Time']));

      if (field4TimeOrOrdinal) {
        result = 1;
      }
    }
    return result;
  },
};
