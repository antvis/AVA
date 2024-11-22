import type { Data } from '../../../../../common/types';
import type { BasicDataPropertyForAdvice, ChartEncodeMapping } from '../../../../types';

export type GenerateChartSpecParams = {
  data: Data;
  dataProps: BasicDataPropertyForAdvice[];
  encode: ChartEncodeMapping;
};
