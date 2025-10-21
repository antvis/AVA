import { DATA_SHAPE } from '@ava/data/constants';
import { ColumnFeature } from '@ava/data/types';

import type { DataShard } from '@ava/types';
import type { DataStore } from './DataStore';

// Focus on data clipping
export class DataFrame {
  readonly dataStore: DataStore;

  // row clipping indexes
  private rowIndexes: number[];

  // column clipping indexes
  private colIndexes: number[];

  constructor(
    store: DataStore,
    options: {
      rowIndexes?: number[];
      colIndexes?: number[];
    }
  ) {
    const { rowIndexes, colIndexes } = options;
    this.dataStore = store;
    this.rowIndexes = rowIndexes ?? Array.from({ length: store.data.length }, (_, i) => i);
    this.colIndexes = colIndexes ?? Array.from({ length: store.data[0]?.length ?? 0 }, (_, i) => i);
  }

  shape(): [number, number] {
    return [this.rowIndexes.length, this.colIndexes.length];
  }

  getData(): any[] {
    return this.rowIndexes.map((rowIndex) => {
      const row = this.dataStore.data[rowIndex];
      return this.colIndexes.map((colIndex) => row[colIndex]);
    });
  }

  getFeatures = async (): Promise<ColumnFeature[]> => {
    const features = await Promise.all(
      this.colIndexes.map(async (colIndex) => {
        const name = this.dataStore.columns[colIndex];
        const feature = await this.dataStore.getColumnFeature(name);
        return { ...feature, name };
      })
    );
    return features;
  };

  toShard = async (): Promise<DataShard> => {
    const features = await this.getFeatures();
    return {
      shape: DATA_SHAPE.PLAIN,
      data: this.getData(),
      metas: features.map((feature) => {
        return {
          id: feature.name,
          name: feature.name,
          dataType: feature.recommendation,
          statisticsFeature: feature,
        };
      }),
    };
  };
}
