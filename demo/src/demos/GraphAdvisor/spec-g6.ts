import { AntVSpec } from '@antv/antv-spec';

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 300;

/** Linear scale */
const scaleMap = (scale, x: number) => {
  const minRange = Math.min(...scale.range);
  const minDomain = Math.min(...scale.domain);
  const maxRange = Math.max(...scale.range);
  const maxDomain = Math.max(...scale.domain);
  return ((maxRange - minRange) / (maxDomain - minDomain)) * (x - minDomain) + minRange;
};

const strokes = [
  '#5B8FF9',
  '#5AD8A6',
  '#5D7092',
  '#F6BD16',
  '#E8684A',
  '#6DC8EC',
  '#9270CA',
  '#FF9D4D',
  '#269A99',
  '#FF99C3',
];

export function specToG6(spec: AntVSpec) {
  const config: Record<string, any> = {};
  const g6Cfg = {
    cfg: config,
    data: {},
  };

  if (spec.basis) {
    g6Cfg.cfg.height = spec.basis?.height || DEFAULT_HEIGHT;
    g6Cfg.cfg.width = spec.basis?.width || DEFAULT_WIDTH;
  }

  if ('layout' in spec) {
    const layoutCfg: Record<string, any> = {};
    if (spec.layout?.type) {
      layoutCfg.type = spec.layout.type;
      layoutCfg.options = (spec.layout as any).options;
    }
    g6Cfg.cfg.layout = layoutCfg;
  }

  // convert data to { "nodes": [{...}, ], "links": [{...}, ]}
  const dataVals = spec.data.values;
  const g6Data: Record<string, any> = {};
  g6Data.nodes = dataVals.nodes;
  g6Data.edges = dataVals.links;

  // mapping size/color encoding of edges and nodes in data
  const { nodes } = g6Data;
  nodes.forEach((node: any) => {
    const updateNode = node;
    updateNode.oriSize = updateNode.size;
    updateNode.oriLabel = updateNode.label;
    return updateNode;
  });
  const nodesEnc = 'nodes' in spec.layer[0] ? spec.layer[0].nodes : null;
  if (nodesEnc) {
    if (nodesEnc.mark) {
      nodes.forEach((node: any) => {
        const updateNode = node;
        updateNode.type = nodesEnc.mark === 'point' ? 'circle' : nodesEnc.mark;
      });
    }
    if (nodesEnc.encoding.color) {
      // have color encoding for nodes
      const { field, scale } = nodesEnc.encoding.color;
      const colorMap = new Map();
      let colorId = 0;
      if (scale) {
        nodes.forEach((node: any) => {
          const updateNode = node;
          if (node[field] && colorMap.get(node[field]) === undefined) {
            colorMap.set(node[field], colorId);
            colorId += 1;
          }
          const cid = colorMap.get(node[field]);
          if (!updateNode.style) updateNode.style = {};
          updateNode.style.fill = scale.range[cid % scale.range.length];
          updateNode.style.stroke = strokes[cid % strokes.length];
          return updateNode;
        });
      }
    }
    if (nodesEnc.encoding.size) {
      // have size encoding for nodes
      const { field, scale } = nodesEnc.encoding.size as any;
      if (scale) {
        nodes.forEach((node: any) => {
          const updateNode = node;
          updateNode.size = updateNode.size || scaleMap(scale, updateNode[field]);
          if (updateNode.type === 'rect') {
            updateNode.size = [updateNode.size * 2, updateNode.size];
          }
          return updateNode;
        });
      }
    }
    if ((nodesEnc.encoding as any).label) {
      const { field } = (nodesEnc.encoding as any).label;
      nodes.forEach((node: any) => {
        const updateNode = node;
        updateNode.label = updateNode.label || updateNode[field];
        return updateNode;
      });
    }
  }

  const { edges } = g6Data;
  const edgesEnc = 'links' in spec.layer[0] ? spec.layer[0].links : null;
  if (edgesEnc) {
    if (edgesEnc.encoding.color) {
      // have color encoding for edges
      const colorField = edgesEnc.encoding.color.field;
      const clusterMap = new Map();
      let clusterId = 0;
      edges.forEach((edge: any) => {
        const updateEdge = edge;
        // cluster
        if (edge[colorField] && clusterMap.get(edge[colorField]) === undefined) {
          clusterMap.set(edge[colorField], clusterId);
          clusterId += 1;
        }
        // const cid = clusterMap.get(edge[colorField]);
        if (!updateEdge.style) updateEdge.style = {};
        // updateEdge.style.stroke = strokes[cid % strokes.length];
        return updateEdge;
      });
    }
    if (edgesEnc.encoding.size) {
      // have size encoding for edges
      const { field, scale } = edgesEnc.encoding.size as any;
      if (scale) {
        edges.forEach((edge: any) => {
          const updateEdge = edge;
          if (!updateEdge.style) updateEdge.style = {};
          updateEdge.style.lineWidth = scaleMap(scale, updateEdge[field]);
          return updateEdge;
        });
      }
    }
  }

  g6Cfg.data = g6Data;
  g6Cfg.cfg.linkCenter = true;
  g6Cfg.cfg.modes = {
    default: ['drag-canvas', 'zoom-canvas', 'drag-node'], // default canvas interactions
  };
  return g6Cfg;
}
