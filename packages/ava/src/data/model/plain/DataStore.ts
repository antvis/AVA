import _ from 'lodash';

import { analyzeField } from '@ava/data/features';
import { randomPick, calculateCorrelation } from '@ava/data/utils';

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

  private associationScoreMap: Map<string, number>;

  constructor(options: { data: RawDataType[][]; columns: string[] }) {
    const { data, columns } = options;
    this.data = data;
    this.columns = columns;
    this.columnIndexMap = new Map(columns.map((col, i) => [col, i]));
    this.associationScoreMap = new Map();
    this.columnsFeatureMap = new Map();
  }

  getRowData(index: number) {
    return this.data[index] || [];
  }

  getColumnData(column: string) {
    const index = this.columnIndexMap.get(column);
    if (index !== -1) {
      return this.data.map((row) => row[index]);
    }
    return [];
  }

  /**
   * 获取列的特征对象
   * @param column
   * @returns
   */
  async getColumnFeature(column: string) {
    const feature = this.columnsFeatureMap.get(column);
    if (!feature) {
      await this.computeColumnFeature(column);
    }
    return this.columnsFeatureMap.get(column) as ColumnFeature;
  }

  /**
   * 按列抽样
   * @param column
   */
  async getSample(column: string, ratio = 0.5) {
    if (ratio >= 1) {
      return this.data;
    }
    const feature = await this.getColumnFeature(column);
    const colIndex = this.columnIndexMap.get(column);
    const res = [];
    if (feature.recommendation === 'date') {
      // todo pick with interval
    } else if (feature.recommendation === 'integer') {
      // pick with quantile
      const q1 = [];
      const q2 = [];
      const q3 = [];
      const q4 = [];
      const p25 = (feature as NumberColumnFeature).percentile25;
      const p50 = (feature as NumberColumnFeature).percentile50;
      const p75 = (feature as NumberColumnFeature).percentile75;
      this.data.forEach((row) => {
        if (!row[colIndex]) return;
        if ((row[colIndex] as number) < p25) {
          q1.push(row);
        } else if ((row[colIndex] as number) < p50) {
          q2.push(row);
        } else if ((row[colIndex] as number) < p75) {
          q3.push(row);
        } else {
          q4.push(row);
        }
      });
      const q1Pick = _.map(randomPick(q1.length, Math.max(Math.floor(ratio * q1.length), 1)), (index) => q1[index - 1]);
      const q2Pick = _.map(randomPick(q2.length, Math.max(Math.floor(ratio * q2.length), 1)), (index) => q2[index - 1]);
      const q3Pick = _.map(randomPick(q3.length, Math.max(Math.floor(ratio * q3.length), 1)), (index) => q3[index - 1]);
      const q4Pick = _.map(randomPick(q4.length, Math.max(Math.floor(ratio * q4.length), 1)), (index) => q4[index - 1]);
      res.push(...q1Pick, ...q2Pick, ...q3Pick, ...q4Pick);
    } else if (['boolean', 'string', 'geo'].includes(feature.recommendation)) {
      const sampleValueMap: Record<string, number> = {};
      _.each((feature as StringColumnFeature).valueMap, (value, key) => {
        sampleValueMap[key] = Math.floor(ratio * value);
      });
      _.each(this.data, (row) => {
        const colValue = row[colIndex] as string;
        if (sampleValueMap[colValue] > 0) {
          sampleValueMap[colValue]--;
          res.push(row);
        }
      });
    } else {
      res.push(
        ..._.map(randomPick(this.data.length, Math.round(this.data.length * ratio)), (index) => this.data[index - 1])
      );
    }
    return res;
  }

  /**
   * 计算两列的相关性系数
   */
  async getAssociationScore(col1: string, col2: string) {
    const key1 = `${col1}-${col2}`;
    const key2 = `${col2}-${col1}`;
    const cache = this.associationScoreMap.get(key1) || this.associationScoreMap.get(key2);
    if (cache) {
      return cache;
    }
    const feature1 = await this.getColumnFeature(col1);
    const feature2 = await this.getColumnFeature(col2);
    const score = calculateCorrelation(
      {
        type: feature1.recommendation,
        data: this.getColumnData(col1),
      },
      {
        type: feature2.recommendation,
        data: this.getColumnData(col2),
      }
    );
    this.associationScoreMap.set(key1, score);
    return score;
  }

  async computeColumnFeature(column: string) {
    if (!this.columnsFeatureMap.has(column)) {
      const data = this.getColumnData(column);
      this.columnsFeatureMap.set(column, analyzeField(data, false));
    }
  }
}
