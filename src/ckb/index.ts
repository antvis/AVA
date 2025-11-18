import { area } from './area';
import { bar } from './bar';
import { boxplot } from './boxplot';
import { column } from './column';
import { dualAxes } from './dual-axes';
import { fishboneDiagram } from './fishbone-diagram';
import { flowDiagram } from './flow-diagram';
import { funnel } from './funnel';
import { histogram } from './histogram';
import { line } from './line';
import { liquid } from './liquid';
import { mindMap } from './mind-map';
import { networkGraph } from './network-graph';
import { pie } from './pie';
import { radar } from './radar';
import { sankey } from './sankey';
import { scatter } from './scatter';
import { treemap } from './treemap';
import { venn } from './venn';
import { violin } from './violin';
import { wordCloud } from './word-cloud';
import { organizationChart } from './organization-chart';
import { table } from './table';
import { indentedTree } from './indented-tree';
import { CKB } from '../types';

export const CHARTS: CKB = {
  area,
  bar,
  boxplot,
  column,
  'dual-axes': dualAxes,
  'fishbone-diagram': fishboneDiagram,
  'flow-diagram': flowDiagram,
  funnel,
  histogram,
  'indented-tree': indentedTree,
  line,
  liquid,
  'mind-map': mindMap,
  'network-graph': networkGraph,
  'organization-chart': organizationChart,
  pie,
  radar,
  sankey,
  scatter,
  table,
  treemap,
  venn,
  violin,
  'word-cloud': wordCloud,
};
