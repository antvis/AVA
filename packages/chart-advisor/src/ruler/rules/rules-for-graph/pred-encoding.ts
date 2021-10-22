import { analyzer } from '@antv/data-wizard';
import { RuleModule } from '../../concepts/rule';
import { MAX_DISTINCT_COLOR } from './const';

const applyChartTypes = ['graph'];
export const fieldForColorRule: RuleModule = {
  id: 'field-for-node-color',
  type: 'HARD',
  docs: {
    detailedText: `A field can encode to color if is nominal or ordinal, and the number of its distinct values is less than ${MAX_DISTINCT_COLOR}`,
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: ({ field }) => {
    return (
      (analyzer.isNominal(field) || analyzer.isOrdinal(field)) &&
      field.missing === 0 &&
      field.distinct > 1 &&
      field.distinct <= MAX_DISTINCT_COLOR
    );
  },
};

// TODO: Ranking numeric fiels based on field continuity, significance, validity, etc
export const fieldForSizeRule: RuleModule = {
  id: 'field-for-size',
  type: 'HARD',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: ({ field }) => {
    return field.name === 'degree';
  },
};

export const fieldForLabel: RuleModule = {
  id: 'field-for-abel',
  type: 'HARD',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: fieldForColorRule.validator,
};

export const encodingRules = {
  'field-for-color': fieldForColorRule,
  'field-for-size': fieldForSizeRule,
  'field-for-label': fieldForLabel,
};
