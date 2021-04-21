import { RowData, Dataset, AllSubspaceDatasetOptions } from '@antv/dw-transform';
import { insightWorkers, Worker } from './insightWorkers';
import { Insight, InsightProps } from './interfaces';

/**
 * @public
 */
export async function insightsFromData(data: RowData[]): Promise<Insight[]> {
  const workers = Object.values(insightWorkers) as Worker[];

  const allInsightsPack: Insight[][] = await Promise.all(workers.map((worker) => worker(data)));

  let allInsights: Insight[] = [];
  allInsightsPack.forEach((insights) => {
    allInsights = allInsights.concat([...insights]);
  });

  return allInsights;
}

/**
 * @public
 */
export async function insightsFromDataset(data: RowData[], options?: AllSubspaceDatasetOptions): Promise<Insight[]> {
  const dataset = new Dataset(data);
  const subDatasets = dataset.allSubspaceDataset(options);

  const allInsightsPack: Insight[][] = await Promise.all(subDatasets.map((subDataset) => insightsFromData(subDataset)));

  let allInsights: Insight[] = [];
  allInsightsPack.forEach((insights) => {
    allInsights = allInsights.concat([...insights]);
  });

  return allInsights;
}

export { Insight, InsightProps };
