import { RowData } from '@antv/dw-transform';
import { Insight as VisualInsight } from 'visual-insights';
import {
  type as typeAnalyze,
  TypeSpecifics,
  isUnique,
  isTime,
  isInterval,
  isOrdinal,
  FieldInfo,
} from '@antv/dw-analyzer';
import { Insight, InsightProps } from '..';
import { InsightType, Worker } from '.';
import { getInsightSpaces } from '../fromVisualInsights';

export function pearsonCorr(d1: number[], d2: number[]) {
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
  title: string;
  type: TypeSpecifics | null;
  isUnique?: boolean;
  isTime?: boolean;
  isInterval?: boolean;
  isOrdinal?: boolean;
  fieldInfo?: FieldInfo;
}

interface ColumnFrame {
  columnProps: ColumnProp[];
  columns: Column[];
}

export function rowDataToColumnFrame(rows: RowData[]): ColumnFrame {
  if (!rows || rows.length === 0) {
    return {
      columnProps: [{ title: '', type: null }],
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
      isTime: isTime(anaResult),
      isInterval: isInterval(anaResult),
      isOrdinal: isOrdinal(anaResult),
      fieldInfo: anaResult,
    });
    columns.push(column);
  });

  return {
    columnProps: columnProps,
    columns: columns,
  };
}

export function columnsToRowData(columns: Column[], titles: string[]): RowData[] {
  if (!columns.length || !titles.length || columns.length !== titles.length) {
    return [];
  }

  const rowLength = columns[0].length;

  // Lengths of columns should be same.
  for (let k = 0; k < columns.length; k++) {
    if (columns[k].length !== rowLength) {
      return [];
    }
  }

  const result: RowData[] = [];

  for (let i = 0; i < rowLength; i++) {
    const row: RowData = {};

    for (let j = 0; j < columns.length; j++) {
      row[titles[j]] = columns[j][i];
    }

    result.push(row);
  }

  return result;
}

export function insightSpaceToInsight(space: InsightSpace): Insight {
  const { dimensions, measures, significance, type, score, description } = space;

  const _insightProps: InsightProps = {};

  const _type: InsightType | 'SomeInsight' = type ? (type as InsightType) : 'SomeInsight';

  let _fields: string[] = [];

  if (dimensions && dimensions.length) {
    _fields = [..._fields, ...dimensions];
    _insightProps.dimensions = dimensions;
  }
  if (measures && measures.length) {
    _fields = [..._fields, ...measures];
    _insightProps.measures = measures;
  }

  const _score = score ? score : significance;
  if (_score) {
    _insightProps.score = _score;
  }

  if (description) {
    _insightProps.detail = description;
  }

  const insight: Insight = {
    type: _type,
    fields: _fields,
  };

  if (!(Object.keys(_insightProps).length === 0 && _insightProps.constructor === Object)) {
    insight.insightProps = _insightProps;
  }

  return insight;
}

type VisualInsightWorkerID = VisualInsight.DefaultIWorker;
type InsightSpace = VisualInsight.InsightSpace;

export function visualInsightWorkerToAVAWorker(viWorkerId: VisualInsightWorkerID): Worker {
  const AVAWorker: Worker = async function(data: RowData[]): Promise<Insight[]> {
    const workerCollection = VisualInsight.IntentionWorkerCollection.init({ withDefaultIWorkers: false });
    workerCollection.enable(viWorkerId, true);

    const spaces: InsightSpace[] = await getInsightSpaces({
      dataSource: data,
      collection: workerCollection,
      enableUniqueFields: false,
    });

    const insights: Insight[] = [];

    spaces.forEach((space) => {
      const insight = insightSpaceToInsight(space);
      insights.push(insight);
    });

    return insights;
  };

  return AVAWorker;
}

export function isMonotonicInc(array: number[]): boolean {
  for (let i = 1; i < array.length; i++) {
    if (array[i - 1] > array[i]) {
      return false;
    }
  }

  return true;
}

export function isMonotonicDec(array: number[]): boolean {
  for (let i = 1; i < array.length; i++) {
    if (array[i - 1] < array[i]) {
      return false;
    }
  }

  return true;
}

export function normalizeArray(array: number[]): number[] {
  const max = Math.max(...array);
  const min = Math.min(...array);
  return array.map((val) => {
    return (val - min) / (max - min);
  });
}
