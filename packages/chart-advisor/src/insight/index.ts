import { RowData } from '@antv/dw-transform';
import { type as typeAnalyze, TypeSpecifics } from '@antv/dw-analyzer';
import { isUnique } from '@antv/dw-analyzer';
import { Insight } from 'visual-insights';

const tuple = <T extends string[]>(...args: T) => args;

const INSIGHT_TYPES = tuple(
  'MajorFactors',
  'CategoryOutliers',
  'TimeSeriesOutliers',
  'OverallTrends',
  'Seasonality',
  'Correlation',
  'ChangePoints'
  // ...
);
type InsightType = typeof INSIGHT_TYPES[number];

export interface Insight {
  type: InsightType;
  fields: string[];
  // ...
}

class InsightWorker {
  insightType: InsightType;
  constructor(type: InsightType) {
    this.insightType = type;
  }
  findInsight(data: RowData[]): Insight[] {
    // ...
    console.log(data);
    return [
      {
        type: this.insightType,
        fields: ['a'],
      },
    ];
  }
}

function pearsonCorr(d1: number[], d2: number[]) {
  const { min, pow, sqrt } = Math;
  const add = (a: number, b: number) => a + b;
  const n = min(d1.length, d2.length);
  if (n === 0) {
    return 0;
  }
  [d1, d2] = [d1.slice(0, n), d2.slice(0, n)];
  const [sum1, sum2] = [d1, d2].map((l) => l.reduce(add));
  const [pow1, pow2] = [d1, d2].map((l) => l.reduce((a, b) => a + pow(b, 2), 0));
  const mulSum = d1.map((n, i) => n * d2[i]).reduce(add);
  const dense = sqrt((pow1 - pow(sum1, 2) / n) * (pow2 - pow(sum2, 2) / n));
  if (dense === 0) {
    return 0;
  }
  return (mulSum - (sum1 * sum2) / n) / dense;
}

type Column = Array<string | number | null>;
interface ColumnProp {
  title: string | null;
  type: TypeSpecifics | null;
  isUnique?: boolean;
}

interface ColumnFrame {
  columnProps: ColumnProp[];
  columns: Column[];
}

function rowDataToColumnFrame(rows: RowData[]): ColumnFrame {
  if (!rows || rows.length === 0) {
    return {
      columnProps: [{ title: null, type: null }],
      columns: [[]],
    };
  }
  const titles = Object.keys(rows[0]);

  const columnProps: ColumnProp[] = [];
  const columns: Column[] = [];

  titles.forEach((title) => {
    const column = rows.map((row: RowData) => row[title]);
    const anaResult = typeAnalyze(column);

    columnProps.push({
      title: title,
      type: anaResult.recommendation,
      isUnique: isUnique(anaResult),
    });
    columns.push(column);
  });

  return {
    columnProps: columnProps,
    columns: columns,
  };
}

class CorrelationInsightWorker extends InsightWorker {
  constructor() {
    super('Correlation');
  }
  findInsight(data: RowData[]): Insight[] {
    // ...
    const THRESHOLD = 0.9;
    const insights: Insight[] = [];

    const { columnProps, columns } = rowDataToColumnFrame(data);

    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        if (
          columnProps[i].type !== null &&
          ['integer', 'float'].includes(columnProps[i].type as TypeSpecifics) &&
          columnProps[j].type !== null &&
          ['integer', 'float'].includes(columnProps[j].type as TypeSpecifics) &&
          Math.abs(pearsonCorr(columns[i] as number[], columns[j] as number[])) > THRESHOLD
        ) {
          insights.push({
            type: 'Correlation',
            fields: [columnProps[i].title as string, columnProps[j].title as string],
          });
        }
      }
    }

    return insights;
  }
}

export function insightsFromData(data: RowData[]): Insight[] {
  // logic here...

  // workers
  const correlationInsightWorker = new CorrelationInsightWorker();
  const workers = [
    correlationInsightWorker,
    // ... more workers
  ];

  let allInsights: Insight[] = [];

  workers.forEach((worker) => {
    const insights = worker.findInsight(data);
    allInsights = allInsights.concat(insights);
  });

  return allInsights;
}

// todo: use Insight.IntentionWorkerCollection to register custom workers.
// const simpleWorker: Insight.IntentionWorker
export type IWorker = Insight.IntentionWorker;
export type ISpace = Insight.InsightSpace;
export const DefaultIWorker = Insight.DefaultIWorker;

const workerCollection = Insight.IntentionWorkerCollection.init();

interface GetInsightSpacesProps {
  dataSource: RowData[];
  fields?: string[];
  dimensions?: string[];
  measures?: string[];
  enableUniqueFields?: boolean;
  collection?: Insight.IntentionWorkerCollection;
}

const getInsightSpaces = async function(props: GetInsightSpacesProps): Promise<ISpace[]> {
  const {
    dataSource,
    fields: _fields,
    collection,
    dimensions: _dimensions,
    measures: _measures,
    enableUniqueFields,
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

export { getInsightSpaces, workerCollection };
