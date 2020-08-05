import { Insight } from 'visual-insights';
import { RowData } from '@antv/dw-transform';
import { rowDataToColumnFrame } from './insightWorkers/utils';

// todo: use Insight.IntentionWorkerCollection to register custom workers.
// const simpleWorker: Insight.IntentionWorker
export type IWorker = Insight.IntentionWorker;
export type ISpace = Insight.InsightSpace;
export const DefaultIWorker = Insight.DefaultIWorker;

export const workerCollection = Insight.IntentionWorkerCollection.init();

interface GetInsightSpacesProps {
  dataSource: RowData[];
  fields?: string[];
  dimensions?: string[];
  measures?: string[];
  enableUniqueFields?: boolean;
  collection?: Insight.IntentionWorkerCollection;
}

export const getInsightSpaces = async function(props: GetInsightSpacesProps): Promise<ISpace[]> {
  const {
    dataSource,
    fields: _fields,
    collection,
    dimensions: _dimensions,
    measures: _measures,
    enableUniqueFields = true,
  } = props;
  if (dataSource.length === 0) return [];
  if (typeof _dimensions !== 'undefined' && typeof _measures !== 'undefined') {
    return Insight.getVisSpaces({
      dataSource,
      dimensions: _dimensions,
      measures: _measures,
      collection,
    });
  }
  const fields: string[] = typeof _fields === 'undefined' ? Object.keys(dataSource[0]) : _fields;
  const colFrame = rowDataToColumnFrame(dataSource);

  const dimensions: string[] = colFrame.columnProps
    .filter((col) => col.title !== null && fields.includes(col.title))
    .filter((col) => !(col.type === 'integer' || col.type === 'float'))
    .filter((col) => enableUniqueFields || !col.isUnique)
    .map((col) => col.title) as string[];

  const measures: string[] = colFrame.columnProps
    .filter((col) => col.title !== null && fields.includes(col.title))
    .filter((col) => col.type === 'integer' || col.type === 'float')
    .map((col) => col.title) as string[];

  return Insight.getVisSpaces({
    dataSource,
    dimensions,
    measures,
    collection,
  });
};
