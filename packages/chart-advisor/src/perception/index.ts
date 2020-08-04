import { Insight, InsightProps } from './findScag/interface';
import { perceptionWorkers, Worker } from './worker';
import { RowData } from '@antv/dw-transform';

/**
 * @beta
 */
export async function insightsFromData(data: RowData[]): Promise<Insight[]> {
  const workers = Object.values(perceptionWorkers) as Worker[];

  const allInsightsPack: Insight[][] = await Promise.all(workers.map((worker) => worker(data)));

  let allInsights: Insight[] = [];
  allInsightsPack.forEach((insights) => {
    allInsights = allInsights.concat([...insights]);
  });

  return allInsights;
}

/**
 * @beta
 */
export async function insightsFromDataset(data: RowData[]): Promise<Insight[]> {
  const workers = Object.values(perceptionWorkers) as Worker[];

  const allInsightsPack: Insight[][] = await Promise.all(workers.map((worker) => worker(data)));

  let allInsights: Insight[] = [];
  allInsightsPack.forEach((insights) => {
    allInsights = allInsights.concat([...insights]);
  });

  return allInsights;
}

export { Insight, InsightProps };
