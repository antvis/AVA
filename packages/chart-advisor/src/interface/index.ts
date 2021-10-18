import { LevelOfMeasurement as LOM } from '@antv/ckb';
import { analyzer as DWAnalyzer } from '@antv/data-wizard';

/**
 * return type of data to data props, describe data column
 * @public
 */
export type DataProperty =
  | (DWAnalyzer.NumberFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.DateFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.StringFieldInfo & { name: string; levelOfMeasurements: LOM[] });

export type DataRow = Record<string, any>;
export type DataRows = DataRow[];

export type FieldTypes = 'null' | 'boolean' | 'integer' | 'float' | 'date' | 'string';
export type EncodingType = 'quantitative' | 'temporal' | 'ordinal' | 'nominal' |'continuous' | 'discrete' | 'interval' | 'const'; 
// export type ScaleType = 'ordinal' | ''

export type LayoutTypes = 'graphin-force' | 'force' | 'grid' | 'dagre' | 'circular' | 'concentric' | 'radial';
export interface ILayoutConfig {
  // 支持的布局类型，默认为 force
  type?: LayoutTypes;
  options?: {
    // 根据 type 不同，options 中属性字段也会有所不同
    // 边长
    linkDistance?: number;
    nodeStrength?: number;
    edgeStrength?: number;
    // 是否防止重叠，必须配合属性 nodeSize
    preventOverlap?: boolean;
    // 节点大小（直径）。用于碰撞检测。
    nodeSize?: number[] | number | ((d:any) => number);
    // preventOverlap 为 true 时生效，防止重叠时节点边缘间距的最小值。为不同节点设置不同的最小间距
    nodeSpacing?: number;
    // 指定排序的依据字段
    sortBy?: string;
    // 是否按照聚类信息布局
    clustering?: boolean;
    // dagre 特有
    rankdir?: 'TB' | 'BT' | 'LR' | 'RL';
    // 节点对齐方式。默认值是 undefined，代表对齐到中心
    align?: 'UL' | 'UR' | 'DL' | 'DR' | undefined;
    // 水平或垂直间距
    nodesep?: number;
    // 层间距
    ranksep?: number;
    // concentric 配置，环与环之间最小间距，用于调整半径
    minNodeSpacing?: number;
    // gird 布局配置，表示网格行数和列数
    rows?: number;
    cols?: number;
    // concentric
    equidistant?: boolean; // 是否等距
    // circular
    radius?: number;
    divisions?: number; // 分段数
    ordering?: null | 'topology' | 'degree';
    // radial 
    unitRadius?: number; // 层级距离
    focusNode?: string;
    // graphin-force
    stiffness?: number;
    repulsion?: number;
    damping?: number;
  };
}

export interface NumMappingCfg {
  key: string; // field key for mapping to number
  scale: {
    type: string;
    range: number[];
    domain: number[];
  };
  [key:string]: any;
}

export interface CategoryMappingCfg {
  key: string; // field key for mapping to category
  scale: {
    type: string; // ordinal, ..
    range: string[] | number[];
    domain: string[]| number[];
  };
  [key:string]: any;
}

export type NodeTypes = 'circle' | 'rect' | 'donut';

export interface INodeCfg {
  size: NumMappingCfg;
  color: CategoryMappingCfg;
  label: {
    key: string; 
    showlabel?: Boolean;
  };
  [key: string]: any;
};

export interface INodeTypeCfg {
  type: NodeTypes;
  customCfg?: {
    [key: string]: any;
  }
}

export interface IEdgeCfg {
  color: CategoryMappingCfg;
  lineWidth: NumMappingCfg;
  [key: string]: any;
}
