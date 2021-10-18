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
   * @returns 节点的类型映射函数，节点字段 -> 节点类型
   */
  optimizer: ():INodeTypeCfg => {
    // TODO 节点类型推荐规则，1. 如果有适合绘制饼图的字段组合 则应该推荐 donut 节点
    let type:NodeTypes = DEFAULT_NODE_TYPE
    let customCfg;
    return {
      type,
      customCfg
    }
  }
}

export const nodeTypeRules = {}
