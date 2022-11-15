import type { Axis } from '../field/types';

/**
 * Graph extra info.
 */
export type GraphExtra = {
  nodeKey?: string; // key for node array in data object
  linkKey?: string; // key for link array in data object
  sourceKey?: string; // key for link source in link object
  targetKey?: string;
  childrenKey?: string;
  nodeIndexes?: Axis[];
  nodeColumns?: Axis[];
  linkIndexes?: Axis[];
  linkColumns?: Axis[];
};

export type NodeData = {
  id: string;
  name?: string;
  [key: string]: unknown;
};

export type LinkData = {
  source: string;
  target: string;
  [key: string]: unknown;
};

export type GraphInput =
  | TreeNode
  // object array, such as array of link object, e.g. [ {source: 1, target: 1}, ...]
  | {
      [key: string]: unknown;
    }[]
  // array object, such as { nodes: [], links: [] }
  | {
      [key: string]: unknown[];
    };

export type TreeNode = {
  id: string;
  children: TreeNode[];
  [key: string]: unknown;
};
