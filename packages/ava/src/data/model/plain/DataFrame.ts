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

  /**
   *
   */
}
