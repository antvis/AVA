export type DataRowObject = Record<string, any>;

export type DataRowArray = any[];

export type DataRow = DataRowObject | DataRowArray;

export function isDataRowObject(row: DataRow): row is DataRowObject {
  return typeof row === 'object' && !!row && !Array.isArray(row);
}

export function isDataRowArray(row: DataRow): row is DataRowArray {
  return Array.isArray(row);
}

export type DataColumnObject = Record<string, any>;

export type DataColumnArray = any[];
