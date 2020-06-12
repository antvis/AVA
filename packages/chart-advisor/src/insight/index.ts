import { RowData } from '@antv/dw-transform';
import { InsightType, insightWorkers, Worker } from './insightWorkers';

export interface InsightProps {
  dimensions?: string[];
  measures?: string[];
  score?: number;
  detail?: any;
}

export interface Insight {
  type: InsightType | 'SomeInsight';
  fields: string[];
  insightProps?: InsightProps;
  present?: {
    data: RowData[];
    fields: string[];
  };
}

export async function insightsFromData(data: RowData[]): Promise<Insight[]> {
  // logic here...

  // workers
  const workers = Object.values(insightWorkers) as Worker[];

  const allInsightsPack: Insight[][] = await Promise.all(workers.map((worker) => worker(data)));

  let allInsights: Insight[] = [];
  allInsightsPack.forEach((insights) => {
    allInsights = allInsights.concat([...insights]);
  });

  return allInsights;
}
