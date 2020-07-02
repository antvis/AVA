import { RowData } from '@antv/dw-transform';
import { insightWorkers, Worker } from './insightWorkers';
import { Insight, InsightProps } from './interfaces';

/**
 * @beta
 */
export async function insightsFromData(data: RowData[]): Promise<Insight[]> {
  // logic here...

  console.log('😋😋😋😋😋');
  console.log('data');
  console.log(data);

  // workers
  const workers = Object.values(insightWorkers) as Worker[];

  const allInsightsPack: Insight[][] = await Promise.all(workers.map((worker) => worker(data)));

  let allInsights: Insight[] = [];
  allInsightsPack.forEach((insights) => {
    allInsights = allInsights.concat([...insights]);
  });

  return allInsights;
}

export { Insight, InsightProps };
