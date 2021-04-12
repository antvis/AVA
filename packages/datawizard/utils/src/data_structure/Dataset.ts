import { DataColumnArray, DataRowObject, DataRowArray } from './unit';

export type SourceType = 'json' | 'rows' | 'columns';

// export type dataRows
export interface DatasetParamsByJson {
  // type: 'json';
  source: DataRowObject[];
}

export interface DatasetParamsByRows {
  // type: 'rows';
  source: DataRowArray[];
  index?: number[];
}

export interface DatasetParamsByColumns {
  // type: 'columns';
  source: DataColumnArray[];
  columns: string[];
}

export type DatasetParams = DatasetParamsByJson | DatasetParamsByRows | DatasetParamsByColumns;

function jsonToDataMatrix(json: DataRowObject[]) {
  const matrix: any[][] = [];
  const index: number[] = [];
  const columns: string[] = Object.keys(json[0]);

  json.forEach((row, i) => {
    matrix.push(Object.values(row));
    index.push(i);
  });

  return { matrix, index, columns };
}

export class Dataset {
  dataMatrix: any[][] = [];
  dataIndex: number[] = [];
  dataColumns: string[] = [];

  constructor(type: 'json', params: DatasetParamsByJson);
  constructor(type: 'rows', params: DatasetParamsByRows);
  constructor(type: 'columns', params: DatasetParamsByColumns);
  constructor(type?: SourceType, params?: DatasetParams) {
    switch (type) {
      case 'json': {
        const { source } = params as DatasetParamsByJson;
        const { matrix, index, columns } = jsonToDataMatrix(source);
        this.dataMatrix = matrix;
        this.dataIndex = index;
        this.dataColumns = columns;
        break;
      }
      case 'rows':
        break;
      case 'columns':
        break;
      default:
        this.dataMatrix = [];
        this.dataIndex = [];
        this.dataColumns = [];
        break;
    }
  }

  toJson() {
    return this.dataMatrix.map((row) => {
      const rowObj: DataRowObject = {};
      this.dataColumns.forEach((key, i) => {
        rowObj[key] = row[i];
      });
      return rowObj;
    });
  }
}
