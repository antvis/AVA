import { DataColumnArray } from '../data_structure';

// TODO
// export function hierarchy(dataset: Dataset): string[] {}

/**
 * @public
 */
export function isInHierarchy(parent: DataColumnArray, child: DataColumnArray): boolean {
  if (!parent || parent.length === 0 || !child || child.length === 0 || parent.length !== child.length) return false;

  const records: any = {};
  for (let i = 0; i < child.length; i++) {
    if (!records[child[i]]) {
      records[child[i]] = parent[i];
    } else if (records[child[i]] !== parent[i]) {
      return false;
    }
  }

  return true;
}
