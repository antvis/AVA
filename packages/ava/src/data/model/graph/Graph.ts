import { assert, isArray, isObject, isBasicType } from '@ava/utils';
import { getAllStructFeats, getNodeFields, getLinkFields, getAllFieldsInfo, clusterNodes } from '@ava/data/features';

import type { GraphData, GraphFeature } from '@ava/data/types';

/* eslint-disable no-param-reassign */
function parseTreeNode(data: any) {
  const nodes = [];
  const links = [];
  const childrenKey = 'children';
  const parseTree = (treeNode) => {
    const children = treeNode[childrenKey] || [];
    delete treeNode[childrenKey];
    nodes?.push(treeNode);
    for (let i = 0; i < children.length; i += 1) {
      const item = children[i];
      links?.push({
        source: treeNode.id,
        target: item.id,
      });
      parseTree(item);
    }
  };
  parseTree(data);
  return { nodes, links };
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
  const links = [];
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
      links.push(formatLink);
    }
  } else if (isArray(children)) {
    // try to parse the array as multiple trees
    for (let i = 0; i < data.length; i += 1) {
      const tree = data[i];
      const { nodes: subNodes, links: subLinks } = parseTreeNode(tree);
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
      links.push(...subLinks);
    }
  }
  return { nodes, links };
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

export class Graph {
  data!: GraphData;

  constructor(data: GraphData) {
    const { nodes, links } = this.autoParse(data);
    this.data = {
      nodes: nodes.map((node) => flatObject(node)),
      links: links.map((link) => flatObject(link)),
    };
  }

  private autoParse(data: GraphData) {
    let nodes;
    let links;

    // try parse data as link array or multiple trees
    if (isArray(data)) {
      const parsedData = parseArray(data);
      nodes = parsedData.nodes;
      links = parsedData.links;
    }

    // if passed data tyoe is object
    if (isObject(data)) {
      const nodeKey = 'nodes' in data ? 'nodes' : undefined;
      const linkKey = 'links' in data ? 'links' : 'edges' in data ? 'edges' : undefined;
      if (nodeKey) nodes = data[nodeKey];
      if (linkKey) links = data[linkKey];
    }

    return { nodes, links };
  }

  info(): GraphFeature {
    const { nodes, links } = this.data;
    const graphStructFeats = getAllStructFeats(nodes, links);
    const { nodeFields, nodeFieldNames } = getNodeFields(nodes);
    const { linkFields, linkFieldNames } = getLinkFields(links);
    const nodeFeature = getAllFieldsInfo(nodeFields, nodeFieldNames);
    const linkFeature = getAllFieldsInfo(linkFields, linkFieldNames);
    const getClusterField = clusterNodes(nodes, nodeFeature, links);
    nodeFeature.push(getClusterField);
    const graphProps = {
      nodeFeature,
      linkFeature,
      ...graphStructFeats,
    };
    return graphProps;
  }
}
