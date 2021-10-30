import { analyzer } from '@antv/data-wizard';
import { RuleModule } from '../../concepts/rule';

const applyChartTypes = ['graph'];

export const predEdgeTypeRule: RuleModule = {
  id: 'pred-edge-type',
  type: 'DESIGN',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  optimizer: (dataProps) => {
    const { graphInfo, layoutType } = dataProps as analyzer.GraphProps;
    let type = 'line';
    if (graphInfo?.linkCount < 60) {
      switch (layoutType) {
        case 'dagre': {
          type = 'round';
          break;
        }
        case 'radial': {
          type = 'smooth';
          break;
        }
        default: {
          type = 'line';
        }
      }
    }
    return { edgeType: type };
  },
};

export const edgeTypeRules = {
  'pred-edge-type': predEdgeTypeRule,
};
