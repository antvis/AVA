import { ChartID } from '../../packages/knowledge';
import { InsightType } from '../../packages/chart-advisor';
import { RowData } from '../../packages/datawizard/transform';

interface DataSampleProperties {
  for: ChartID[];
}

export interface DataSample {
  name?: string;
  data: RowData[];
  props?: DataSampleProperties;
  insights?: InsightType[];
  tags?: string[];
}
