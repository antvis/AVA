import { testRule, optimizeByRule } from '../../ruler/rules/rules-for-graph';
import {
  DEFAULT_COLORS,
  DEFAULT_NODE_SIZE_RANGE,
  DEFAULT_EDGE_WIDTH_RANGE,
  DEFAULT_LAYOUT_TYPE,
} from '../../ruler/rules/rules-for-graph/const';
import { ILayoutConfig, INodeCfg, IEdgeCfg } from '../../interface';
import { ExtendFieldInfo, GraphProps } from '../../../../data-wizard/src/analyzer/graph';

function field2Color(field: ExtendFieldInfo, colorScaleType?: string): INodeCfg['color'] {
  const type = colorScaleType || 'ordinal';
  const { fieldName, valueMap } = field;
  return {
    key: fieldName,
    mapping: true,
    scale: {
      type,
      range: DEFAULT_COLORS,
      domain: Object.keys(valueMap),
    },
  };
}

function field2Size(field: ExtendFieldInfo, sizeScaleType?: string, range?: number[]): INodeCfg['size'] {
  const type = sizeScaleType || 'linear';
  return {
    key: field?.fieldName,
    mapping: true,
    scale: {
      type,
      range: range || DEFAULT_NODE_SIZE_RANGE,
      domain: [field?.minimum, field?.maximum],
    },
  };
}

/**
 * map graph properties to layout configurations
 * @param dataProps
 * @return ILayoutConfig
 */
/* eslint-disable no-param-reassign */
export function graph2LayoutCfg(dataProps: Partial<GraphProps>): ILayoutConfig {
  const layoutType: string = optimizeByRule(dataProps, 'pred-layout-type') || DEFAULT_LAYOUT_TYPE;
  dataProps = {
    ...dataProps,
    layoutType,
  };
  const layoutCfg = optimizeByRule(dataProps, 'pred-layout-config');
  return layoutCfg;
}

/**
 * map node data properties to points visual properties
 */
export function nodeFields2Cfg(nodeFields: ExtendFieldInfo[]): Partial<INodeCfg> {
  const [fieldForColor] = testRule(nodeFields, 'field-for-color');
  const [fieldForSize] = testRule(nodeFields, 'field-for-size');
  const [fieldForLabel] = testRule(nodeFields, 'field-for-label');

  const colorScaleType = optimizeByRule(fieldForColor, 'pred-scale-type');
  const sizeScaleType = optimizeByRule(fieldForSize, 'pred-scale-type');
  const color = fieldForColor ? field2Color(fieldForColor, colorScaleType) : null;
  const size = fieldForSize ? field2Size(fieldForSize, sizeScaleType) : null;
  const label = {
    key: fieldForLabel?.fieldName,
    showlabel: true,
  };
  return { color, size, label };
}

/**
 * map edge data properties to line visual properties
 * TODO: support edge type as polyline, curve, arc, etc.
 */
/* eslint-disable no-param-reassign */
export function edgeFields2Style(
  edgeFields: ExtendFieldInfo[],
  edgeFeats?: ExtendFieldInfo[],
  onlyUseField = true
): Partial<INodeCfg> {
  if (!onlyUseField) {
    edgeFields = edgeFields.concat(edgeFeats);
  }
  const [fieldForWidth] = testRule(edgeFields, 'field-for-size');
  const sizeScaleType = optimizeByRule(fieldForWidth, 'pred-scale-type');
  const size = field2Size(fieldForWidth, sizeScaleType, DEFAULT_EDGE_WIDTH_RANGE);
  return { size };
}

/**
 * recommending graph visualization given graph dataProps
 * @param dataProps data props derived from data-wizard or customized by users
 */
export function graphdataToAdvices(dataProps?: Partial<GraphProps>) {
  const { nodeFeats, nodeFieldsInfo, edgeFeats, edgeFieldsInfo } = dataProps;
  const layoutCfg: Partial<ILayoutConfig> = graph2LayoutCfg(dataProps);
  const nodeCfg: Partial<INodeCfg> = nodeFields2Cfg(nodeFieldsInfo.concat(nodeFeats));
  const [fieldForCluster] = testRule(nodeFieldsInfo, 'field-for-cluster');
  nodeCfg.cluster = fieldForCluster;
  const edgeCfg: Partial<IEdgeCfg> = edgeFields2Style(edgeFieldsInfo, edgeFeats);

  return {
    layoutCfg,
    nodeCfg,
    edgeCfg,
  };
}
