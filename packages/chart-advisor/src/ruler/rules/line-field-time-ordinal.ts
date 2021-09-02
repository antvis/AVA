import { intersects } from '../../utils';
import { RuleModule } from '../concepts/rule';

const applyChartTypes = ['line_chart', 'area_chart', 'stacked_area_chart', 'percent_stacked_area_chart'];

export const lineFieldTimeOrdinal: RuleModule = {
  id: 'line-field-time-ordinal',
  type: 'SOFT',
  docs: {
    lintText: 'Data has Time or Ordinal field are good for Line, Area charts.',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
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
