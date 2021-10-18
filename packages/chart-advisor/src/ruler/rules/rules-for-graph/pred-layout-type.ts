import { RuleModule, SoftRuleModule } from './concepts/rule';
import { LayoutTypes } from '../../../interface';
import { GraphFeat } from '../../../../../../packages/data-wizard/src/analyzer'
import { DEFAULT_LAYOUT_TYPE, MAX_NUM_NODES_A_LEVEL, ALL_LAYOUT_TYPES } from './const';

// TODO: [Tentative] Score evaluation criteria: 0 - not recommended; 5 - highly recommended
/**
 * Conditions suitable for using the Dagre layout
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
 * Conditions suitable for using the Radial layout
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
    const hasFocusNode = false;
    if(hasFocusNode) {
      score += 3
    }
    return score
  }
}

/**
 * Conditions suitable for using the Circular layout
 * 1. The graph has cycles and a high percentage of cycles (a larger percentage of nodes in cycles). 图中有圆环且圆环占比较高（处于圆环的节点比例较大）
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
 * Conditions suitable for using the Force layout
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
 * Conditions suitable for using the Concentric layout
 * 1. 有中心程度很高的节点
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
 * Conditions suitable for using the Grid layout
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

export const layoutTypePredRule: RuleModule = {
  id: 'pred-layout-type',
  type: 'DESIGN',
  docs: {
    detailedText: '',
  },
  optimizer: (dataProps):LayoutTypes => {
    const { graphInfo } = dataProps;
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
// TODO: Option 2: Calculate the aesthetic score of the layout and rank it by comparing the scores
