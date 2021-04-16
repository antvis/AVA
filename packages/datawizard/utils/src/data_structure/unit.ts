/**
 * @public
 */
export type DataRowObject = Record<string, any>;

/**
 * @public
 */
export type DataRowArray = any[];

/**
 * @public
 */
export type DataRow = DataRowObject | DataRowArray;

/**
 * @public
 */
export function isDataRowObject(row: DataRow): row is DataRowObject {
  return typeof row === 'object' && !!row && !Array.isArray(row);
}

/**
 * @public
 */
export function isDataRowArray(row: DataRow): row is DataRowArray {
  return Array.isArray(row);
}

/**
 * @public
 */
export type DataColumnObject = Record<string, any>;

/**
 * @public
 */
export type DataColumnArray = any[];

/**
 * @public
 */
export type JSONData = DataRowObject[];
