import { analyzer } from '@antv/data-wizard';
import { GraphAntVSpec } from '@antv/antv-spec';
import { allBuiltInRules, testRule } from '../../ruler/rules/rules-for-graph';
import {
  DEFAULT_COLORS,
  DEFAULT_NODE_SIZE_RANGE,
  DEFAULT_EDGE_WIDTH_RANGE,
  DEFAULT_LAYOUT_TYPE,
  ALL_LAYOUT_TYPES,
} from '../../ruler/rules/rules-for-graph/const';
import { BasicDataPropertyForAdvice, DesignRuleModule } from '../../ruler/concepts/rule';
import { ILayoutConfig } from '../../interface';
import { deepMix } from '../utils';

/**
 * map graph properties to layout configurations
 * @param dataProps
 * @return LayoutTypes[]
 */
export function graph2LayoutTypes(dataProps: Partial<analyzer.GraphProps>) {
  const candidates = [];
  ALL_LAYOUT_TYPES.forEach((layoutType) => {
    const rule = allBuiltInRules[layoutType];
    candidates.push({
      type: layoutType,
      score: rule.validator(dataProps),
    });
  });
  const sortedTypes = candidates.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  if (!sortedTypes.length) sortedTypes.push({ type: DEFAULT_LAYOUT_TYPE, score: 1 });
  return sortedTypes;
}

/**
 * Recommended configurations based on the optimization policy and user configuration
 */
const optimizeByRule = (
  dataProps: BasicDataPropertyForAdvice | Partial<analyzer.GraphProps>,
  ruleId: string,
  graphSpec?: GraphAntVSpec
): any => {
  const rule: DesignRuleModule = allBuiltInRules[ruleId];
  const result = rule.optimizer(dataProps, graphSpec);
  return result;
};

/**
 * map node data properties to points visual properties
 */
export function nodeFields2Style(dataProps: Partial<analyzer.GraphProps>, userCfg?: { [key: string]: any }) {
  const { nodeFeats, nodeFieldsInfo } = dataProps;
  const nodeFields = nodeFieldsInfo.concat(nodeFeats);
  // choose fields for encoding
  const [fieldForColor] = testRule(nodeFields, 'field-for-color');
  const [fieldForSize] = testRule(nodeFields, 'field-for-size');
  const [fieldForLabel] = testRule(nodeFields, 'field-for-label');
  // optimize encoding configurations
  const colorScaleType = optimizeByRule(fieldForColor, 'pred-scale-type');
  const sizeScaleType = optimizeByRule(fieldForSize, 'pred-scale-type');
  const { nodeType } = optimizeByRule(dataProps, 'pred-node-type');
  // convert configurations to AntVSpec
  const color = fieldForColor
    ? {
        field: fieldForColor.name,
        type: colorScaleType,
        scale: {
          range: userCfg?.nodeColors || DEFAULT_COLORS,
          domain: Object.keys(fieldForColor.valueMap),
        },
      }
    : {};
  const size = fieldForSize
    ? {
        field: fieldForSize.name,
        type: sizeScaleType,
        scale: {
          range: userCfg?.nodeSizeRange || DEFAULT_NODE_SIZE_RANGE,
          domain: [fieldForSize.minimum, fieldForSize.maximum],
        },
      }
    : {};
  const label = fieldForLabel
    ? {
        field: fieldForLabel.name,
        showlabel: true,
      }
    : {};

  const nodeSpec = {
    mark: nodeType || 'point',
    encoding: {
      size,
      color,
      label,
    },
  };
  return nodeSpec;
}

/**
 * map edge data properties to line visual properties
 */
/* eslint-disable no-param-reassign */
export function edgeFields2Style(dataProps: Partial<analyzer.GraphProps>, userCfg?: { [key: string]: any }) {
  const { linkFeats, linkFieldsInfo } = dataProps;
  const linkFields = linkFieldsInfo.concat(linkFeats);
  const [fieldForWidth] = testRule(linkFields, 'field-for-size');
  const sizeScaleType = optimizeByRule(fieldForWidth, 'pred-scale-type');
  const { edgeType } = optimizeByRule(dataProps, 'pred-edge-type');
  const size = fieldForWidth
    ? {
        field: fieldForWidth.name,
        type: sizeScaleType,
        scale: {
          range: userCfg?.linkWidthRange || DEFAULT_EDGE_WIDTH_RANGE,
          domain: [fieldForWidth.minimum, fieldForWidth.maximum],
        },
      }
    : {};
  const links = {
    mark: 'line',
    encoding: {
      size,
      type: edgeType,
    },
  };
  return links;
}

/**
 * recommending graph visualization given graph dataProps
 * @param dataProps data props derived from data-wizard or customized by users
 */
/* eslint-disable no-param-reassign */
export function graphdataToAdvices(data, dataProps: Partial<analyzer.GraphProps>, options?) {
  const recommendSpecs = [];
  const basics = {
    data: {
      type: 'json',
      values: data,
    },
    basis: {
      type: 'graph',
    },
    layout: {
      nodes: 'nodes',
      links: 'links',
    },
  };
  // Fisrt, decide the layout type and options
  const layoutTypes = graph2LayoutTypes(dataProps);
  // Then, optimize configurations for each layout
  layoutTypes.forEach((layoutType) => {
    const { type, score } = layoutType;
    const layoutOptions: Partial<ILayoutConfig> = optimizeByRule(dataProps, 'pred-layout-config');
    const layout = {
      type,
      options: layoutOptions?.options,
    };
    const links = edgeFields2Style({ ...dataProps, layoutType: type }, options);
    const nodes = nodeFields2Style({ ...dataProps, layoutType: type }, options);
    const spec = {
      layout,
      layer: [
        {
          nodes,
          links,
        },
      ],
    };
    recommendSpecs.push({ type: 'graph', spec: deepMix(spec, basics), score });
  });
  return recommendSpecs;
}
