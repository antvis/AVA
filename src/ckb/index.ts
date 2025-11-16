import area from './area.json';
import bar from './bar.json';
import boxplot from './boxplot.json';
import column from './column.json';
import dualAxes from './dual-axes.json';
import fishboneDiagram from './fishbone-diagram.json';
import flowDiagram from './flow-diagram.json';
import funnel from './funnel.json';
import histogram from './histogram.json';
import line from './line.json';
import liquid from './liquid.json';
import mindMap from './mind-map.json';
import networkGraph from './network-graph.json';
import pie from './pie.json';
import radar from './radar.json';
import sankey from './sankey.json';
import scatter from './scatter.json';
import treemap from './treemap.json';
import venn from './venn.json';
import violin from './violin.json';
import wordCloud from './word-cloud.json';
import organizationChart from './organization-chart.json';
import table from './table.json';
import indentedTree from './indented-tree.json';

export const CHARTS = {
  area,
  bar,
  boxplot,
  column,
  'dual-axes': dualAxes,
  'fishbone-diagram': fishboneDiagram,
  'flow-diagram': flowDiagram,
  funnel,
  // 'heat-map': heatMap, // TODO: 地图渲染有点问题，先屏蔽掉
  histogram,
  'indented-tree': indentedTree,
  line,
  liquid,
  'mind-map': mindMap,
  'network-graph': networkGraph,
  'organization-chart': organizationChart,
  // 'path-map': pathMap, // TODO: 地图渲染有点问题，先屏蔽掉
  pie,
  // 'pin-map': pinMap, // TODO: 地图渲染有点问题，先屏蔽掉
  radar,
  sankey,
  scatter,
  table,
  treemap,
  venn,
  violin,
  'word-cloud': wordCloud,
};
