import { DataColumnArray, DataRowObject, DataRowArray, JSONData } from './unit';

export type SourceType = 'json' | 'rows' | 'columns';

// export type dataRows
export interface DatasetParamsByJson {
  // type: 'json';
  source: JSONData;
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

/**
 * Adjust structure of data.
 *
 * To avoid missing keys and values.
 */
function adjustJSONData(json: JSONData, mode: 'max' | 'min' = 'max'): JSONData {
  if (!json || json.length === 0) return [];

  const resultJSONData: JSONData = [];

  // consistent fields

  let fieldSet: Set<string> = new Set();

  if (mode === 'max') {
    fieldSet = new Set();
    json.forEach((row) => {
      Object.keys(row).forEach((key) => {
        fieldSet.add(key);
      });
    });
  } else {
    // mode === 'min
    fieldSet = new Set(Object.keys(json[0]));
    json.forEach((row) => {
      const keys = Object.keys(row);
      fieldSet.forEach((field) => {
        if (!keys.includes(field)) {
          fieldSet.delete(field);
        }
      });
    });
  }

  // adjust data row by row

  json.forEach((row) => {
    const newRow: any = {};
    fieldSet.forEach((fieldName) => {
      newRow[fieldName] = row[fieldName] || undefined;
    });
    resultJSONData.push(newRow);
  });

  return resultJSONData;
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
        const data = adjustJSONData(source);
        const { matrix, index, columns } = jsonToDataMatrix(data);
        this.dataMatrix = matrix;
        this.dataIndex = index;
        this.dataColumns = columns;
        break;
      }
      case 'rows':
        // TODO
        break;
      case 'columns':
        // TODO
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
