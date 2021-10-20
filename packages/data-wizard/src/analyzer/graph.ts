import * as AlgorithmSync from '@antv/algorithm';
import { NodeData, EdgeData } from '../dataset/types';
import { FieldInfo, analyzeField } from './index';

const GraphAlgorithms = {
  ...AlgorithmSync,
};

export interface ExtendFieldInfo extends FieldInfo {
  fieldName: string;
  [key: string]: any;
}

export type NodeStructFeat = {
  degree: number;
  inDegree: number;
  outDegree: number;
  pageRank: number;
  closeness: number;
  kCore: number;
  cycleCount: number;
  triangleCount: number;
  starCount: number;
  cliqueCount: number;
  clusterCoeff: number;
};

export type EdgeStructFeat = {
  isDirected: Boolean;
  centrality: number;
  cycleCount: number;
  triangleCount: number;
  starCount: number;
  cliqueCount: number;
};
// Statistical features of graph
export type GraphFeat = {
  nodeCount: number;
  edgeCount: number;
  direction: number;
  isDirected: Boolean;
  isDAG: Boolean;
  isCycle: Boolean;
  isConnected: Boolean;
  ratio: number; // ratio of breadth to depth
  breadth: number;
  depth: number;
  maxDegree: number;
  minDegree: number;
  avgDegree: number;
  degreeStd: number;
  maxPageRank: number;
  minPageRank: number;
  avgPageRank: number;
  components: any[];
  componentCount: number;
  strongConnectedComponents: any[];
  strongConnectedComponentCount: number;
  cycleCount: number;
  directedCycleCount: number;
  starCount: number;
  cliqueCount: number;
  cycleParticipate: number;
  triangleCount: number;
  localClusterCoeff: number;
  globalClusterCoeff: number;
  maxKCore: number;
};

export type GraphProps = {
  nodeFeats: ExtendFieldInfo[];
  edgeFeats: ExtendFieldInfo[];
  graphInfo: Partial<GraphFeat>;
  nodeFieldsInfo: ExtendFieldInfo[];
  edgeFieldsInfo: ExtendFieldInfo[];
  [key: string]: any;
};

function genColDataFromArr(arr: any[], columnNames: string[]) {
  const fields = [];
  for (let i = 0; i < arr.length; i += 1) {
    const datum = arr[i];
    for (let j = 0; j < columnNames.length; j += 1) {
      const column = columnNames[j];
      if (fields[j]) {
        fields[j].push(datum[column]);
      } else {
        fields[j] = [datum[column]];
      }
    }
  }
  return fields;
}
export function getNodeFields(nodes: NodeData[]) {
  const [node0] = nodes;
  const nodeFieldNames = node0 ? Object.keys(node0) : [];
  const nodeFields = genColDataFromArr(nodes, nodeFieldNames);
  return { nodeFields, nodeFieldNames };
}
export function getEdgeFields(edges: EdgeData[]) {
  const [edge0] = edges;
  const edgeFieldNames = edge0 ? Object.keys(edge0) : [];
  const edgeFields = genColDataFromArr(edges, edgeFieldNames);
  return { edgeFields, edgeFieldNames };
}

// Analyze fields
function getFieldInfo(dataField: any[], fieldName: string): ExtendFieldInfo {
  const fieldInfo = analyzeField(dataField);
  return {
    ...fieldInfo,
    fieldName,
  };
}
export function getAllFieldsInfo(dataFields: any[], fieldNames: string[]): ExtendFieldInfo[] {
  const fields: ExtendFieldInfo[] = [];
  for (let i = 0; i < dataFields.length; i += 1) {
    const dataField = dataFields[i];
    fields.push(getFieldInfo(dataField, fieldNames[i]));
  }
  return fields;
}

/* eslint-disable no-param-reassign */
/**
 * Calculate statistical and structural features for graph
 * @param nodes
 * @param edges
 * @returns
 */
export function getAllStructFeats(nodes: NodeData[], edges: EdgeData[]) {
  const nodeStructFeats: Partial<NodeStructFeat>[] = [];
  const edgeStructFeats: Partial<EdgeStructFeat>[] = [];
  // TODO: whether the graph is directed need to be passed in
  const isDirected: boolean = false;
  const degrees = GraphAlgorithms.getDegree({ nodes, edges });
  const pageRanks = GraphAlgorithms.pageRank({ nodes, edges });
  const cycles = GraphAlgorithms.detectAllCycles({ nodes, edges }, false);
  const directedCycles = GraphAlgorithms.detectAllDirectedCycle({ nodes, edges });
  const components = GraphAlgorithms.connectedComponent({ nodes, edges }, false);
  const strongConnectedComponents = GraphAlgorithms.connectedComponent({ nodes, edges }, true);
  const cycleCountMap: { [key: string]: number } = {};
  for (let i = 0; i < cycles.length; i += 1) {
    const nodeIds = Object.keys(cycles[i]);
    for (let j = 0; j < nodeIds.length; j += 1) {
      const nodeId = nodeIds[j];
      if (cycleCountMap[nodeId]) {
        cycleCountMap[nodeId] += 1;
      } else {
        cycleCountMap[nodeId] = 1;
      }
    }
  }
  const numberOfNodeInCycle = Object.values(cycleCountMap).filter((count) => count).length;
  const cycleParticipate = numberOfNodeInCycle / nodes.length;

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const nodeFeat = {
      degree: degrees[node.id].degree,
      inDegree: degrees[node.id].inDegree,
      outDegree: degrees[node.id].outDegree,
      pageRank: pageRanks[node.id],
      cycleCount: cycleCountMap[node.id] || 0,
    };
    nodeStructFeats.push(nodeFeat);
    nodes[index] = {
      ...node,
      ...nodeFeat,
    };
  }
  for (let index = 0; index < edges.length; index += 1) {
    const edge = edges[index];
    const edgeFeat = {};
    edgeStructFeats.push(edgeFeat);
    edges[index] = {
      ...edge,
      ...edgeFeat,
    };
  }
  const nodeFeatNames = Object.keys(nodeStructFeats[0]);
  const edgeFeatNames = Object.keys(edgeStructFeats[0]);
  const nodeFeats = getAllFieldsInfo(genColDataFromArr(nodeStructFeats, nodeFeatNames), nodeFeatNames);
  const edgeFeats = getAllFieldsInfo(genColDataFromArr(edgeStructFeats, edgeFeatNames), edgeFeatNames);

  // Calculate the structural features and statistics of all nodes and edges
  const nodeDegrees = nodes.map((node) => node.degree);
  const avgDegree = nodeDegrees.reduce((x, y) => x + y) / nodeDegrees.length;
  const degreeDev = nodeDegrees.map((x) => x - avgDegree);
  const degreeStd = Math.sqrt(degreeDev.map((x) => x ** 2).reduce((x, y) => x + y) / (nodeDegrees.length - 1));
  const graphInfo: Partial<GraphFeat> = {
    isDirected,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    isConnected: components && components.length === 1,
    isDAG: isDirected && directedCycles.length === 0,
    maxDegree: Math.max(...nodeDegrees),
    avgDegree,
    degreeStd,
    cycleParticipate,
    cycleCount: cycles.length,
    directedCycleCount: directedCycles.length,
    // triangleCount: triangleMatches.length,
    componentCount: components.length,
    components,
    strongConnectedComponents,
    strongConnectedComponentCount: strongConnectedComponents.length,
  };

  return {
    nodeFeats,
    edgeFeats,
    graphInfo,
  };
}
