import { RuleModule, SoftRuleModule } from './concepts/rule';
import { LayoutTypes } from '../../../interface';
import { GraphFeat } from '../../../../../../packages/data-wizard/src/analyzer'
import { DEFAULT_LAYOUT_TYPE, MAX_NUM_NODES_A_LEVEL, ALL_LAYOUT_TYPES } from './const';

// TODO [暂定]分数评价标准：0 - 不推荐；5 - 非常推荐
/**
 * 适合使用 Dagre 布局的条件: 
 * 1. 有向无环（少环）图
 * 2. 最大宽度不大于... / 宽高比 
 * 3. 节点个数不宜过多（？）
 */
export const shouldUseDagre: RuleModule = {
  id: 'use-dagre-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  validator: (graphFeat: GraphFeat):number => {
    let score = 0
    const { isDAG, cycleParticipate, maxDegree, avgDegree } = graphFeat
    // TODO 根据生成树的最大宽度和深度作为指标判断更好，但计算复杂，暂时用maxDegree和avgDegree简单处理
    if(isDAG) {
      score = 3
    }
    if(maxDegree <= MAX_NUM_NODES_A_LEVEL/2) {
      score += 1
    }
    if(avgDegree < MAX_NUM_NODES_A_LEVEL/3) {
      score += 1
    }
    if(cycleParticipate > 0.5) {
      score = 0
    } else if (cycleParticipate < 0.3) {
      score += 2
    }
    return score
  }
}

/**
 * 适合使用 Radial 布局的条件: 
 * 1. 有 focus node
 * 2. (有向)无环（少环）图
 * 3. 最大宽度大于... 小于 / 深度 ... / 宽高比： 用来区分 Radial 和 dagre 的指标
 */
export const shouldUseRadial: RuleModule =  {
  id: 'use-radial-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  validator: (graphFeat: GraphFeat):number => {
    let score = 0
    const { isDAG, cycleParticipate, maxDegree } = graphFeat
    if(isDAG) {
      score = 2
    }
    if (maxDegree > MAX_NUM_NODES_A_LEVEL / 2 && maxDegree < MAX_NUM_NODES_A_LEVEL) {
      score += 2
    }
    if(cycleParticipate > 0.5) {
      score = 0
    } else if (cycleParticipate < 0.3) {
      score += 2
    }
    const hasFocusNode = false; // TODO 
    if(hasFocusNode) {
      score += 3
    }
    return score
  }
}

/**
 * 适合使用 Circular 布局的条件: 
 * 1. 图中有圆环且圆环占比较高（处于圆环的节点比例较大）
 */
export const shouldUseCircular: RuleModule = {
  id: 'use-circular-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  validator: (graphFeat: GraphFeat):number => {
    let score = 0
    const { cycleCount, cycleParticipate } = graphFeat
    if(cycleCount > 0) score = 2
    if(cycleParticipate >= 0.5 && cycleParticipate <= 0.8) {
      score = 3
    } else if (cycleParticipate > 0.8 && cycleParticipate < 0.9) {
      score = 4
    } else if (cycleParticipate >=0.9 ) {
      score = 5
    }
    return score
  }
}

/**
 * 适合使用 Force 布局的条件: 
 * 1. 
 */
export const shouldUseForce: RuleModule = {
  id: 'use-force-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  validator: (graphFeat: GraphFeat):number => {
    let score = 0
    const { nodeCount, maxDegree, avgDegree, strongConnectedComponentCount } = graphFeat
    if(nodeCount > 200) {
      score += 4
    }
    if(strongConnectedComponentCount >= 1) {
      score += 2
    }
    if(avgDegree < 3) {
      score += 1
    }
    if(maxDegree > MAX_NUM_NODES_A_LEVEL) {
      score += 1
    }
    return score
  }
}

/**
 * 适合使用 Concentric 布局的条件: 
 * 1. 有中心程度很高的节点
 * TODO  
 */
export const shouldUseConcentric: RuleModule = {
  id: 'use-force-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  validator: (graphFeat: GraphFeat):number => {
    let score = 0
    const { maxDegree, avgDegree, degreeStd } = graphFeat
    if((maxDegree - avgDegree) > 3*degreeStd) {
      score += 3
    }
    return score
  }
}

/**
 * 适合使用 Grid 布局的条件: 
 * TODO 
 */
export const shouldUseGrid: RuleModule = {
  id: 'use-grid-rule',
  type: 'SOFT',
  docs: {
    detailedText: '',
  },
  validator: ():number => {
    let score = 0
    return score
  }
}

/**
 * 布局类型判断模块：
 * TODO 需要更完备的评价系统 e.g 用加权打分的形式
 * TODO 使用 { GraphLayoutPredict } from '@antv/vis-predict-engine' 兜底
 */
export const layoutTypePredRule: RuleModule = {
  id: 'pred-layout-type',
  type: 'DESIGN',
  docs: {
    detailedText: '',
  },
  optimizer: (dataProps):LayoutTypes => {
    const { graphInfo } = dataProps;
    // TODO 变成多规则并联模块的形式 提供一个函数用于组合打分制规则
    const allLayoutTypeRules = {
      dagre: shouldUseDagre, 
      circular: shouldUseCircular, 
      concentric: shouldUseConcentric, 
      radial: shouldUseRadial, 
      grid: shouldUseGrid, 
      force: shouldUseForce
    }
    const candidates = []
    for(let layoutType of ALL_LAYOUT_TYPES) {
      const rule: SoftRuleModule = allLayoutTypeRules[layoutType]
      candidates.push({
        item: layoutType, 
        score: rule.validator(graphInfo)
      })
    }
    const type = candidates.filter(item => item.score > 0).sort((a,b) => b.score - a.score)[0]
    return type?.item || DEFAULT_LAYOUT_TYPE;
  }
}
// TODO: 方案2: 计算布局的美学评分，通过比较分数来排名
// evaluateLayout
