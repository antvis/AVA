import { ChartID } from '@antv/knowledge';

interface DataSampleProperties {
  for: ChartID[];
}

export interface DataSample {
  props: DataSampleProperties;
  data: any;
}
