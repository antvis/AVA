import { RuleModule } from './concepts/rule';
import { INodeTypeCfg, NodeTypes } from '../../../interface';
import { DEFAULT_NODE_TYPE } from './const'

export const nodeTypePredRule: RuleModule = {
  id: 'pred-node-type',
  type: 'DESIGN',
  chartTypes: ['graph'],
  docs: {
    detailedText: '',
  },
  /**
   * @param dataProps
   * @returns TODO: Mapping function for node field -> node type e.g. if there is a combination of fields suitable for drawing pie charts then donut nodes should be recommended
   */
  optimizer: ():INodeTypeCfg => {
    let type:NodeTypes = DEFAULT_NODE_TYPE
    let customCfg;
    return {
      type,
      customCfg
    }
  }
}

export const nodeTypeRules = {}
