import DataFrame from "./data-frame";
import { NodeData, EdgeData, GraphInput, GraphExtra } from "./types";
import { analyzeField, isUnique } from "../analyzer"
import { GraphProps, getNodeFields, getEdgeFields, getAllFieldsInfo, getAllStructFeats } from '../analyzer/graph'
import { assert, isArray, isObject } from "../utils";
import { isBasicType } from "./utils";

const flatObject = (obj, concatenator = '.') => (
  Object.keys(obj).reduce(
    (acc, key) => {
      if (typeof obj[key] !== 'object' || obj[key] === null) {
        return {
          ...acc,
          [key]: obj[key],
        };
      }

      const flattenedChild = flatObject(obj[key], concatenator);

      return {
        ...acc,
        ...Object.keys(flattenedChild).reduce((childAcc, childKey) => ({ ...childAcc, [`${key}${concatenator}${childKey}`]: flattenedChild[childKey] }), {}),
      };
    },
    {},
  )
);

// TODO: The automatic parsing function has not been completed yet, for now, the GraphData constructor only accepts input data in several specified formats (see type GraphInput)
export default class GraphData {
  private extra: GraphExtra;
  data: {
    nodes: NodeData[];
    edges: EdgeData[];
  } = {
    nodes: [],
    edges: []
  };

  private autoParse(data: GraphInput, extra?: GraphExtra) {
    let nodes, edges;
    assert(isArray(data) || isObject(data), 'Data is unable transform to graph');

    // try parse data as edge array or multiple trees
    if(isArray(data)) {
      const parsedData = parseArray(data, extra)
      nodes = parsedData.nodes;
      edges = parsedData.edges;
    }

    // if passed data tyoe is object
    if(isObject(data)) {
      if(extra?.nodeKey && extra?.edgeKey) {
        nodes = data[extra.nodeKey];
        edges = data[extra.edgeKey];
      } else if(extra?.childrenKey || ('children' in data)) {
        const parsedTree = parseTreeNode(data, extra)
        nodes = parsedTree.nodes;
        edges = parsedTree.edges;
      } else {
        // TODO: is the key is not assigned, try to find the keys for nodes and edges and parse the graph
        const nodeKey = ('nodes' in data && 'nodes')
        const edgeKey = ('edges' in data && 'edges') || ('links' in data && 'links')
        nodes = data[nodeKey]
        edges = data[edgeKey]
      }
    }
    
    return {nodes, edges}
  }

  constructor(data: GraphInput, extra?: GraphExtra) {
    this.extra = extra
    const { nodes, edges } = this.autoParse(data, extra);
    console.log( nodes, edges)
    assert(isValidNodeEdges(nodes, edges), 'Data is unable transform to graph');
    this.data = {
      nodes: nodes.map(node => flatObject(node)), 
      edges: edges.map(edge => flatObject(edge))
    }
  }

  getNodeFrame() {
    const extra = {
      index: this.extra?.nodeIndex,
      columns: this.extra?.nodeColumns
    }
    return new DataFrame(this.data.nodes, extra)
  }

  getEdgeFrame() {
    const extra = {
      index: this.extra?.edgeIndex,
      columns: this.extra?.edgeColumns
    }
    return new DataFrame(this.data.edges, extra)
  }

  /**
   * Get statistics.
   */
  info(): GraphProps {
    const { nodes, edges } = this.data
    // calc fields statistics and structural statistics
    const {nodeFields, nodeFieldNames} = getNodeFields(nodes)
    const {edgeFields, edgeFieldNames} = getEdgeFields(edges)
    const nodeFieldsInfo = getAllFieldsInfo(nodeFields, nodeFieldNames)
    const edgeFieldsInfo = getAllFieldsInfo(edgeFields, edgeFieldNames)
    const graphStrucFeats = getAllStructFeats(nodes, edges)
    
    const graphProps = {
      nodeFieldsInfo: nodeFieldsInfo,
      edgeFieldsInfo: edgeFieldsInfo,
      ...graphStrucFeats,
    }
    return graphProps
  }
}

/**
 * @param data edge array
 * @return null | { nodes: NodeData[], edges: EdgeData[]}
 */
function parseArray(data: { [key: string]: any;}[], extra?: GraphExtra) {
  const [data0] = data;
  assert(isObject(data0), 'Data is unable transform to graph');
  const sourceKey = extra?.sourceKey || ('source' in data0 && 'source') ||  ('from' in data0 && 'from')
  const targetKey = extra?.targetKey || ('target' in data0 && 'target') ||  ('to' in data0 && 'to')
  const childrenKey = extra?.childrenKey || ('children' in data0 && 'children') ||  ('to' in data0 && 'to')
  assert(sourceKey || targetKey || childrenKey, 'Data is unable transform to graph');
  let nodes = []
  let edges = []
  const { [sourceKey]: source, [targetKey]: target, [childrenKey]: children } = data0 as any
  if(isBasicType(source) && isBasicType(target)) {
    for(let edge of data) {
      const { [sourceKey]: source, [targetKey]: target } = edge
      if(nodes.findIndex(n => n.id === source) === -1) {
        nodes.push({id: source})
      }
      if(nodes.findIndex(n => n.id === target) === -1) {
        nodes.push({id: target})
      }
      const formatEdge = {
        ...edge,
        source,
        target,
      }
      edges.push(formatEdge)
    }
  } else if(isArray(children)){ 
    // try to parse the array as multiple trees
    for(let tree of data) {
      const {nodes: subNodes, edges: subEdges} = parseTreeNode(tree, extra)
      for(let node of subNodes) {
        let repeatNode = nodes.find(n => n.id === node.id)
        if(repeatNode) {
          repeatNode = {
            ...node,
            ...repeatNode
          }
        } else {
          nodes.push(node)
        }
      }
      edges = edges.concat(subEdges)
    }
  }
  return { nodes, edges }
}

function parseTreeNode(data: any, extra?: GraphExtra) {
  const nodes = [];
  const edges = [];
  const childrenKey = extra?.childrenKey || 'children'
  const parseTree = (treeNode) => {
    const children = treeNode[childrenKey] || []
    delete treeNode[childrenKey];
    nodes.push(treeNode)
    children.forEach((item:any) => {
      edges?.push({
        source: treeNode.id,
        target: item.id,
      })
      parseTree(item)
    })
  }
  parseTree(data)
  return { nodes, edges }
}

function isNodeArray(arr: any[]):boolean {
  if(!isArray(arr) || arr.length <= 1) return false;
  const nodeIdInfo = analyzeField(arr.map(node => node.id));
  return isUnique(nodeIdInfo)
}

function isValidNodeEdges(nodes: any[], edges: any[]):boolean {
  if(!isArray(edges) || !isNodeArray(nodes) || edges.length <= 1) return false; 
  for(let edge of edges) {
    const { source, target } = edge
    const hasSourceNode = nodes.findIndex(item => item.id === source) 
    const hasTargetNode = nodes.findIndex(item => item.id === target)
    if(!(hasSourceNode>-1 && hasTargetNode >-1)) {
      return false
    }
  }
  return true
}
