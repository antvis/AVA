import type { Data } from '@ava/common/types';
import type { BasicDataPropertyForAdvice, ChartEncodeMapping } from '@advisor-deprecated/types';

export type GenerateChartSpecParams = {
  data: Data;
  dataProps: BasicDataPropertyForAdvice[];
  encode: ChartEncodeMapping;
};
