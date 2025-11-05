import _ from 'lodash';

import { assert, isArray, isObject, isBasicType } from '../../utils';
import { getAllRelationFeatures } from '../features';

import type { RelationLikeDataType, RelationFeature } from '../../types/data';

function parseTreeNode(data: any) {
  const nodes = [];
  const edges = [];
  const childrenKey = 'children';
  const parseTree = (treeNode) => {
    const children = treeNode[childrenKey] || [];
    delete treeNode[childrenKey];
    nodes?.push(treeNode);
    for (let i = 0; i < children.length; i += 1) {
      const item = children[i];
      edges?.push({
        source: treeNode.id,
        target: item.id,
      });
      parseTree(item);
    }
  };
  parseTree(data);
  return { nodes, edges };
}

/**
 * @param data link array
 */
function parseArray(data: { [key: string]: any }[]) {
  const [data0] = data;
  assert(isObject(data0), 'Data is unable transform to graph');
  const sourceKey = ('source' in data0 && 'source') || ('from' in data0 && 'from');
  const targetKey = ('target' in data0 && 'target') || ('to' in data0 && 'to');
  const childrenKey = ('children' in data0 && 'children') || ('to' in data0 && 'to');
  assert(sourceKey || targetKey || childrenKey, 'Data is unable transform to graph');
  const nodes = [];
  const edges = [];
  const { [sourceKey]: source, [targetKey]: target, [childrenKey]: children } = data0 as any;
  if (isBasicType(source) && isBasicType(target)) {
    for (let i = 0; i < data.length; i += 1) {
      const link = data[i];
      const { [sourceKey]: source, [targetKey]: target } = link;
      if (nodes.findIndex((n) => n.id === source) === -1) {
        nodes.push({ id: source });
      }
      if (nodes.findIndex((n) => n.id === target) === -1) {
        nodes.push({ id: target });
      }
      const formatLink = {
        ...link,
        source,
        target,
      };
      edges.push(formatLink);
    }
  } else if (isArray(children)) {
    for (let i = 0; i < data.length; i += 1) {
      const tree = data[i];
      const { nodes: subNodes, edges: subLinks } = parseTreeNode(tree);
      for (let i = 0; i < subNodes.length; i += 1) {
        const node = subNodes[i];
        const repeatNodeIndex = nodes.findIndex((n) => n.id === node.id);
        if (repeatNodeIndex > -1) {
          nodes[repeatNodeIndex] = {
            ...nodes[repeatNodeIndex],
            ...node,
          };
        } else {
          nodes.push(node);
        }
      }
      edges.push(...subLinks);
    }
  }
  return { nodes, edges };
}

export function flatObject(obj, concatenator = '.') {
  return Object.keys(obj).reduce((acc, key) => {
    if (typeof obj[key] !== 'object' || obj[key] === null) {
      return {
        ...acc,
        [key]: obj[key],
      };
    }

    const flattenedChild = flatObject(obj[key], concatenator);

    return {
      ...acc,
      ...Object.keys(flattenedChild).reduce(
        (childAcc, childKey) => ({ ...childAcc, [`${key}${concatenator}${childKey}`]: flattenedChild[childKey] }),
        {}
      ),
    };
  }, {});
}

export class Relation {
  data!: RelationLikeDataType;

  constructor(data: RelationLikeDataType) {
    const { nodes, edges } = this.autoParse(data);
    this.data = {
      nodes: nodes.map((node) => flatObject(node)),
      edges: edges.map((link) => flatObject(link)),
    };
  }

  private autoParse(data: RelationLikeDataType) {
    let nodes;
    let edges;

    if (isArray(data)) {
      const parsedData = parseArray(data);
      nodes = parsedData.nodes;
      edges = parsedData.edges;
    }

    if (isObject(data)) {
      const keys = _.keys(data);
      const nodeKey = keys.includes('nodes') ? 'nodes' : undefined;
      const linkKey = keys.includes('edges') ? 'edges' : undefined;
      if (nodeKey) nodes = data[nodeKey];
      if (linkKey) edges = data[linkKey];
    }

    return { nodes, edges };
  }

  getFeatures(): RelationFeature {
    const { nodes, edges } = this.data;
    const features = getAllRelationFeatures(nodes, edges);
    return features;
  }
}
