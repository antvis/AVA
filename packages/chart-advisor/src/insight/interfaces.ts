import { RowData } from '@antv/dw-transform';
import { InsightType } from './insightWorkers';
import { ChartID, Purpose } from '@antv/knowledge';

/**
 * @public
 */
export interface InsightProps {
  dimensions?: string[];
  measures?: string[];
  score?: number;
  detail?: any;
}

/**
 * @public
 */
export interface Insight {
  type: InsightType | 'SomeInsight';
  description?: string;
  fields: string[];
  insightProps?: InsightProps;
  present?: {
    fields?: string[];
    type?: ChartID;
    encoding?: any;
    purpose?: Purpose[];
    data?: RowData[];
    configs?: any;
  };
}
