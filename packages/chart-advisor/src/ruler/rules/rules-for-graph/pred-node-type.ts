import { analyzer } from '@antv/data-wizard';
import { RuleModule } from '../../concepts/rule';
import { NodeTypes } from '../../../interface';
import { DEFAULT_NODE_TYPE } from './const';

const applyChartTypes = ['graph'];
export const nodeTypePredRule: RuleModule = {
  id: 'pred-node-type',
  type: 'DESIGN',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  /**
   * @param dataProps
   * @returns TODO: Mapping function for node field -> node type e.g. if there is a combination of fields suitable for drawing pie charts then donut nodes should be recommended
   */
  optimizer: (dataProps: analyzer.GraphProps): { nodeType: NodeTypes } => {
    let type: NodeTypes = DEFAULT_NODE_TYPE;
    const { graphInfo, layoutType } = dataProps;
    if (graphInfo.nodeCount < 100 && layoutType === 'dagre') {
      type = 'rect';
    }
    return { nodeType: type };
  },
};

export const nodeTypeRules = {
  'pred-node-type': nodeTypePredRule,
};
