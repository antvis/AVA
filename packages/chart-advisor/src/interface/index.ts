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
export type EncodingType =
  | 'quantitative'
  | 'temporal'
  | 'ordinal'
  | 'nominal'
  | 'continuous'
  | 'discrete'
  | 'interval'
  | 'const';

export type LayoutTypes = 'graphin-force' | 'force' | 'grid' | 'dagre' | 'circular' | 'concentric' | 'radial';
export interface ILayoutConfig {
  // Layout algorithm type, 'force' by default
  type?: LayoutTypes;
  options?: {
    // Depending on the different type, the configuration options may vary
    linkDistance?: number;
    nodeStrength?: number;
    edgeStrength?: number;
    // Take effects when 'nodeSize' is assigned a value
    preventOverlap?: boolean; //
    // nodeSize is used for collision detection
    nodeSize?: number[] | number | ((d: any) => number);
    // Take effects when 'preventOverlap' is true. Set different minimum spacing for different nodes
    nodeSpacing?: number;
    // Specify the fields to be used for sorting
    sortBy?: string;
    // Whether the layout is according to the clustering information
    clustering?: boolean;
    // For Dagre layout
    rankdir?: 'TB' | 'BT' | 'LR' | 'RL';
    // The node alignment. The default value is 'undefined', which means align to center
    align?: 'UL' | 'UR' | 'DL' | 'DR' | undefined;
    nodesep?: number;
    ranksep?: number;
    // For Concentric layout, minimum spacing between rings
    minNodeSpacing?: number;
    equidistant?: boolean;
    // For Grid layout
    rows?: number;
    cols?: number;
    // For Circular layout
    radius?: number;
    divisions?: number;
    ordering?: null | 'topology' | 'degree';
    // radial
    unitRadius?: number;
    focusNode?: string;
    // graphin-force
    stiffness?: number;
    repulsion?: number;
    damping?: number;
  };
}

export interface NumMappingCfg {
  field: string; // field key for mapping to number
  type: string;
  scale: {
    range: number[];
    domain: number[];
  };
  [key: string]: any;
}

export interface CategoryMappingCfg {
  field: string; // field key for mapping to category
  type: string; // ordinal, ..
  scale: {
    range: string[] | number[];
    domain: string[] | number[];
  };
  [key: string]: any;
}

export type NodeTypes = 'point' | 'rect' | 'donut';
export type EdgeTypes = 'line' | 'orth' | 'round' | 'smooth';
export interface NodeSpec {
  mark: NodeTypes;
  encoding: {
    size: NumMappingCfg;
    color: CategoryMappingCfg;
    label: {
      field: string;
      showlabel?: Boolean;
    };
    [key: string]: any;
  };
}

export interface EdgeSpec {
  mark: string;
  encoding: {
    type: EdgeTypes;
    size: NumMappingCfg;
    color: CategoryMappingCfg;
    label: {
      field: string;
      showlabel?: Boolean;
    };
    [key: string]: any;
  };
}
