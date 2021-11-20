import { analyzeField, isUnique, GraphProps } from '../analyzer';
import { getNodeFields, getLinkFields, getAllFieldsInfo, getAllStructFeats, clusterNodes } from '../analyzer/graph';
import { assert, isArray, isObject, isBasicType } from '../utils';
import { NodeData, LinkData, GraphInput, GraphExtra } from './types';
import DataFrame from './data-frame';
import { flatObject } from './utils';

/* eslint-disable no-param-reassign */
function parseTreeNode(data: any, extra?: GraphExtra) {
  const nodes = [];
  const links = [];
  const childrenKey = extra?.childrenKey || 'children';
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
 * @return null | { nodes: NodeData[], links: LinkData[]}
 */
function parseArray(data: { [key: string]: any }[], extra?: GraphExtra) {
  const [data0] = data;
  assert(isObject(data0), 'Data is unable transform to graph');
  const sourceKey = extra?.sourceKey || ('source' in data0 && 'source') || ('from' in data0 && 'from');
  const targetKey = extra?.targetKey || ('target' in data0 && 'target') || ('to' in data0 && 'to');
  const childrenKey = extra?.childrenKey || ('children' in data0 && 'children') || ('to' in data0 && 'to');
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
      const { nodes: subNodes, links: subLinks } = parseTreeNode(tree, extra);
      for (let i = 0; i < subNodes.length; i += 1) {
        const node = subNodes[i];
        let repeatNode = nodes.find((n) => n.id === node.id);
        if (repeatNode) {
          repeatNode = {
            ...node,
            ...repeatNode,
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

function isNodeArray(arr: any[]): boolean {
  if (!isArray(arr) || arr.length <= 1) return false;
  const nodeIdInfo = analyzeField(arr.map((node) => node.id));
  return isUnique(nodeIdInfo);
}

function isValidNodeLinks(nodes: any[], links: any[]): boolean {
  if (!isArray(links) || !isNodeArray(nodes) || links.length <= 1) return false;
  for (let i = 0; i < links.length; i += 1) {
    const link = links[i];
    const { source, target } = link;
    const hasSourceNode = nodes.findIndex((item) => item.id === source);
    const hasTargetNode = nodes.findIndex((item) => item.id === target);
    if (!(hasSourceNode > -1 && hasTargetNode > -1)) {
      return false;
    }
  }
  return true;
}

// TODO: The automatic parsing function has not been completed yet, for now, the GraphData constructor only accepts input data in several specified formats (see type GraphInput)
export default class GraphData {
  private extra: GraphExtra;

  data: {
    nodes: NodeData[];
    links: LinkData[];
  } = {
    nodes: [],
    links: [],
  };

  private autoParse(data: GraphInput, extra?: GraphExtra) {
    let nodes;
    let links;
    assert(isArray(data) || isObject(data), 'Data is unable transform to graph');

    // try parse data as link array or multiple trees
    if (isArray(data)) {
      const parsedData = parseArray(data, extra);
      nodes = parsedData.nodes;
      links = parsedData.links;
    }

    // if passed data tyoe is object
    if (isObject(data)) {
      if (extra?.nodeKey && extra?.linkKey) {
        nodes = data[extra.nodeKey];
        links = data[extra.linkKey];
      } else if (extra?.childrenKey || 'children' in data) {
        const parsedTree = parseTreeNode(data, extra);
        nodes = parsedTree.nodes;
        links = parsedTree.links;
      } else {
        const nodeKey = 'nodes' in data && 'nodes';
        const linkKey = ('links' in data && 'links') || ('edges' in data && 'edges');
        nodes = data[nodeKey];
        links = data[linkKey];
      }
    }

    return { nodes, links };
  }

  constructor(data: GraphInput, extra?: GraphExtra) {
    this.extra = extra;
    const { nodes, links } = this.autoParse(data, extra);
    assert(isValidNodeLinks(nodes, links), 'Data is unable transform to graph');
    this.data = {
      nodes: nodes.map((node) => flatObject(node)),
      links: links.map((link) => flatObject(link)),
    };
  }

  getNodeFrame() {
    const extra = {
      indexes: this.extra?.nodeIndexes,
      columns: this.extra?.nodeColumns,
    };
    return new DataFrame(this.data.nodes, extra);
  }

  getLinkFrame() {
    const extra = {
      indexes: this.extra?.linkIndexes,
      columns: this.extra?.linkColumns,
    };
    return new DataFrame(this.data.links, extra);
  }

  /**
   * Get statistics.
   */
  info(): GraphProps {
    const { nodes, links } = this.data;
    // calc fields statistics and structural statistics
    const graphStrucFeats = getAllStructFeats(nodes, links);
    const { nodeFields, nodeFieldNames } = getNodeFields(nodes);
    const { linkFields, linkFieldNames } = getLinkFields(links);
    const nodeFieldsInfo = getAllFieldsInfo(nodeFields, nodeFieldNames);
    const linkFieldsInfo = getAllFieldsInfo(linkFields, linkFieldNames);
    const getClusterField = clusterNodes(nodes, nodeFieldsInfo, links);
    nodeFieldsInfo.push(getClusterField);
    const graphProps = {
      nodeFieldsInfo,
      linkFieldsInfo,
      ...graphStrucFeats,
    };
    return graphProps;
  }
}
