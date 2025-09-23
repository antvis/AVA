/**
 * 数据存储，记录明细数据和相关索引
 * 1、小数据量，内存变量来存
 * 2、大数据量，indexDB + 内存变量作为缓存
 */
export class DataStore {
  // 原始数据
  readonly data: any[][];

  // 列名索引
  readonly columnsMap: Map<string, number>;

  readonly columns: string[];

  private columnsFeatureMap: Map<string, Record<string, any>>;

  constructor(options: { data: any[][]; columns: string[]; columnsMap?: Map<string, number> }) {
    const { data, columns, columnsMap } = options;
    this.data = data;
    this.columns = columns;
    this.columnsMap = columnsMap ?? new Map(columns.map((col, i) => [col, i]));
    this.columnsFeatureMap = new Map();
  }
}
