import { analyzeField } from '@ava/data/features';

import type {
  StringColumnFeature,
  NumberColumnFeature,
  DateColumnFeature,
  GeoColumnFeature,
  RawDataType,
} from '@ava/data/types';

type ColumnFeature = StringColumnFeature | NumberColumnFeature | DateColumnFeature | GeoColumnFeature;

// Focus on data storage and feature computation
export class DataStore {
  readonly data: RawDataType[][];

  // 列名索引
  readonly columnIndexMap: Map<string, number>;

  readonly columns: string[];

  private columnsFeatureMap: Map<string, ColumnFeature>;

  constructor(options: { data: RawDataType[][]; columns: string[] }) {
    const { data, columns } = options;
    this.data = data;
    this.columns = columns;
    this.columnIndexMap = new Map(columns.map((col, i) => [col, i]));
    this.columnsFeatureMap = new Map();
  }

  getRowData(index: number) {
    return this.data[index] || [];
  }

  getColumnData(column: string) {
    const index = this.columnIndexMap.get(column);
    if (index > -1) {
      return this.data.map((row) => row[index]);
    }
    return [];
  }

  // getData(options: {
  //   columns: string[];
  //   rows: number[];
  // }) {
  //   return [];
  // }

  getColumnFeature(column: string) {
    return this.columnsFeatureMap.get(column);
  }

  // lazy compute col
  // todo: maybe async function, because some case should invoke LLM service
  async computeColumnFeature(column: string) {
    if (!this.columnsFeatureMap.has(column)) {
      const data = this.getColumnData(column);
      this.columnsFeatureMap.set(column, analyzeField(data, false));
    }
  }
}
