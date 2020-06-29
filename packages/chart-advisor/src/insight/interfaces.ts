import { RowData } from '@antv/dw-transform';
import { InsightType } from './insightWorkers';

/**
 * @beta
 */
export interface InsightProps {
  dimensions?: string[];
  measures?: string[];
  score?: number;
  detail?: any;
}

/**
 * @beta
 */
export interface Insight {
  type: InsightType | 'SomeInsight';
  fields: string[];
  insightProps?: InsightProps;
  present?: {
    data: RowData[];
    fields: string[];
    configs: any;
  };
}
