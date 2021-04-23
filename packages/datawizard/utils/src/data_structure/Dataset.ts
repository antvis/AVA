import { DataColumnArray, DataRowObject, DataRowArray, JSONData } from './unit';

/**
 * @public
 */
export type SourceType = 'json' | 'rows' | 'columns';

// export type dataRows
/**
 * @public
 */
export interface DatasetParamsByJson {
  source: JSONData;
}

/**
 * @public
 */
export interface DatasetParamsByRows {
  source: DataRowArray[];
  columns?: string[];
}

/**
 * @public
 */
export interface DatasetParamsByColumns {
  source: DataColumnArray[];
  columns?: string[];
}

interface DatasetProps {
  matrix: any[][];
  index: number[];
  columns: string[];
}

/**
 * @public
 */
export type DatasetParams = DatasetParamsByJson | DatasetParamsByRows | DatasetParamsByColumns;

function jsonToDataMatrix(json: DataRowObject[]): DatasetProps {
  const matrix: any[][] = [];
  const index: number[] = [];
  const columns: string[] = Object.keys(json[0]);

  json.forEach((row, i) => {
    matrix.push(Object.values(row));
    index.push(i);
  });

  return { matrix, index, columns };
}

function columnsToDataMatrix({ source, columns: cols }: DatasetParamsByColumns): DatasetProps {
  const matrix: any[][] = [];
  const index: number[] = [];

  if (!source || source.length === 0) return { matrix, index, columns: [] };

  const columns = cols || source.map((_, i) => `col_${i}`);

  let rowLength = 0;
  source.forEach((column) => {
    if (column.length > rowLength) {
      rowLength = column.length;
    }
  });

  for (let i = 0; i < rowLength; i++) {
    matrix.push([]);
    index.push(i);
  }

  source.forEach((colData) => {
    for (let i = 0; i < rowLength; i++) {
      matrix[i].push(colData[i] || undefined);
    }
  });

  return { matrix, index, columns };
}

function rowsToDataMatrix({ source, columns: cols }: DatasetParamsByRows): DatasetProps {
  const matrix: any[][] = [];
  const index: number[] = [];

  if (!source || source.length === 0) return { matrix, index, columns: [] };

  let columnLength = 0;
  source.forEach((row) => {
    if (row.length > columnLength) {
      columnLength = row.length;
    }
  });

  const columns = [];
  for (let i = 0; i < columnLength; i++) {
    if (cols && cols[i]) {
      columns.push(cols[i]);
    } else {
      columns.push(`col_${i}`);
    }
  }

  for (let i = 0; i < source.length; i++) {
    matrix.push([]);
    index.push(i);
  }

  source.forEach((row, i) => {
    for (let j = 0; j < columnLength; j++) {
      matrix[i].push(row[j] || undefined);
    }
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

/**
 * @public
 */
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
      case 'rows': {
        const { matrix, index, columns } = rowsToDataMatrix(params as DatasetParamsByRows);
        this.dataMatrix = matrix;
        this.dataIndex = index;
        this.dataColumns = columns;
        break;
      }
      case 'columns': {
        const { matrix, index, columns } = columnsToDataMatrix(params as DatasetParamsByColumns);
        this.dataMatrix = matrix;
        this.dataIndex = index;
        this.dataColumns = columns;
        break;
      }
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
