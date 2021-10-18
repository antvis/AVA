import { isNominal, isOrdinal} from '@antv/dw-analyzer'
import { RuleModule, ExtendFieldInfo } from './concepts/rule';
import { MAX_DISTINCT_COLOR } from './const'

export const fieldForColorRule: RuleModule = {
  id: 'field-for-node-color',
  type: 'HARD',
  docs: {
    detailedText: `A field can encode to color if is nominal or ordinal, and the number of its distinct values is less than ${MAX_DISTINCT_COLOR}`,
  },
  validator: (field: ExtendFieldInfo) => {
    return (isNominal(field) || isOrdinal(field)) && field.missing === 0 && field.distinct > 1 && field.distinct <= MAX_DISTINCT_COLOR 
  }
}

// TODO: Scoring numeric fiels based on field continuity, significance, validity, etc
export const fieldForSizeRule: RuleModule = {
  id: 'field-for-size',
  type: 'HARD',
  docs: {
    detailedText: '',
  },
  validator: (field: ExtendFieldInfo) => {
    return field.fieldName === 'degree'
  }
}

// TODO: predict node field for mapping to cluster
export const fieldForCluster: RuleModule = {
  id: 'field-for-cluster',
  type: 'HARD',
  docs: {
    detailedText: '',
  },
  validator: fieldForColorRule.validator
}

// TODO: predict node field for mapping to label
export const fieldForLabel: RuleModule = {
  id: 'field-for-abel',
  type: 'HARD',
  docs: {
    detailedText: '',
  },
  validator: fieldForColorRule.validator
}

export const encodingRules = {
  'field-for-color': fieldForColorRule,
  'field-for-size': fieldForSizeRule,
  'field-for-cluster': fieldForCluster,
  'field-for-label': fieldForLabel
}
