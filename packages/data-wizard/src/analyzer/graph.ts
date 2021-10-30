import * as AlgorithmSync from '@antv/algorithm';
import { NodeData, LinkData } from '../dataset/types';
import { FieldInfo, GraphFeat, NodeStructFeat, LinkStructFeat, analyzeField } from './index';

const GraphAlgorithms = {
  ...AlgorithmSync,
};

function generateColDataFromArray(arr: any[], columnNames: string[]) {
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
  const nodeFields = generateColDataFromArray(nodes, nodeFieldNames);
  return { nodeFields, nodeFieldNames };
}
export function getLinkFields(links: LinkData[]) {
  const [link0] = links;
  const linkFieldNames = link0 ? Object.keys(link0) : [];
  const linkFields = generateColDataFromArray(links, linkFieldNames);
  return { linkFields, linkFieldNames };
}

// Analyze fields
function getFieldInfo(dataField: any[], fieldName: string): FieldInfo {
  const fieldInfo = analyzeField(dataField);
  return {
    ...fieldInfo,
    name: fieldName,
  };
}
export function getAllFieldsInfo(dataFields: any[], fieldNames: string[]): FieldInfo[] {
  const fields: FieldInfo[] = [];
  for (let i = 0; i < dataFields.length; i += 1) {
    const dataField = dataFields[i];
    fields.push(getFieldInfo(dataField, fieldNames[i]));
  }
  return fields;
}

/* eslint-disable no-param-reassign */
/**
 * find node clusters and assign the cluster field to each node
 * @param nodes
 * @param links
 * @returns
 */
export function clusterNodes(nodes: NodeData[], nodeFieldsInfo: FieldInfo[], links: LinkData[]): FieldInfo {
  const MAX_CLUSTER_NUM = 10;
  let fieldForCluster;
  for (let i = 0; i < nodeFieldsInfo.length; i += 1) {
    const field = nodeFieldsInfo[i];
    if (
      field.levelOfMeasurements.indexOf('Nominal') > -1 ||
      (field.levelOfMeasurements.indexOf('Ordinal') > -1 &&
        field.missing === 0 &&
        field.distinct > 1 &&
        field.distinct <= MAX_CLUSTER_NUM)
    ) {
      fieldForCluster = field;
      break;
    }
  }
  if (fieldForCluster) {
    for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx += 1) {
      nodes[nodeIdx].cluster = nodes[nodeIdx][fieldForCluster.name];
    }
  } else {
    const { clusters } = GraphAlgorithms.louvain({ nodes, edges: links });
    const values = [];
    for (let i = 0; i < clusters.length; i += 1) {
      const cluster = clusters[i];
      const { nodes, id } = cluster;
      for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx += 1) {
        nodes[nodeIdx].cluster = id;
      }
      values.push(id);
    }
    fieldForCluster = {
      ...analyzeField(values),
      name: 'cluster',
    };
  }
  return fieldForCluster;
}

/* eslint-disable no-param-reassign */
/**
 * Calculate statistical and structural features for graph
 * @param nodes
 * @param links
 * @returns
 */
export function getAllStructFeats(nodes: NodeData[], links: LinkData[]) {
  const nodeStructFeats: Partial<NodeStructFeat>[] = [];
  const linkStructFeats: Partial<LinkStructFeat>[] = [];
  // TODO: whether the graph is directed need to be passed in
  const isDirected: boolean = false;
  const degrees = GraphAlgorithms.getDegree({ nodes, edges: links });
  const pageRanks = GraphAlgorithms.pageRank({ nodes, edges: links });
  const cycles = GraphAlgorithms.detectAllCycles({ nodes, edges: links }, false);
  const directedCycles = GraphAlgorithms.detectAllDirectedCycle({ nodes, edges: links });
  const components = GraphAlgorithms.connectedComponent({ nodes, edges: links }, false);
  const strongConnectedComponents = GraphAlgorithms.connectedComponent({ nodes, edges: links }, true);
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
  for (let index = 0; index < links.length; index += 1) {
    const link = links[index];
    const linkFeat = {};
    linkStructFeats.push(linkFeat);
    links[index] = {
      ...link,
      ...linkFeat,
    };
  }
  const nodeFeatNames = Object.keys(nodeStructFeats[0]);
  const linkFeatNames = Object.keys(linkStructFeats[0]);
  const nodeFeats = getAllFieldsInfo(generateColDataFromArray(nodeStructFeats, nodeFeatNames), nodeFeatNames);
  const linkFeats = getAllFieldsInfo(generateColDataFromArray(linkStructFeats, linkFeatNames), linkFeatNames);

  // Calculate the structural features and statistics of all nodes and links
  const nodeDegrees = nodes.map((node) => node.degree);
  const avgDegree = nodeDegrees.reduce((x, y) => x + y) / nodeDegrees.length;
  const degreeDev = nodeDegrees.map((x) => x - avgDegree);
  const degreeStd = Math.sqrt(degreeDev.map((x) => x ** 2).reduce((x, y) => x + y) / (nodeDegrees.length - 1));
  const graphInfo: Partial<GraphFeat> = {
    isDirected,
    nodeCount: nodes.length,
    linkCount: links.length,
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
    linkFeats,
    graphInfo,
  };
}
