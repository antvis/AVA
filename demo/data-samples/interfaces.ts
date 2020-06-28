import { ChartID } from '@antv/knowledge';
import { InsightType } from '../../packages/chart-advisor';

interface DataSampleProperties {
  for: ChartID[];
}

export interface DataSample {
  props?: DataSampleProperties;
  insights?: InsightType[];
  data: any;
}
