import type { Datum, DataMetaMap } from '../schema';

// TODO 暂时只实现普通段落，之后还会有 bullets，heading 等
export type StructureDisplayType = 'phrase' | 'paragraph';

/**
 * @description narrative structure
 * @example Structure[] like bellow:
 * [
 *    { template: "system &{s1}, includes &{s2} .", displayType: "paragraph" },
 * ]
 */
export type Structure = {
  /** template string, use &{} reference structure template id */
  template: string;
  /**
   * template display as
   * default is phrase
   */
  displayType?: StructureDisplayType;
};

/**
 * @description structure template
 * @example StructureTemp[] like bellow:
 * [
 *    { templateId: s1, template: "&{s1}", variableId: "var2" },
 *    { templateId: s2, template: 'user ${name}, ${age[metric_name]} is ${age}', variableId: 'var1', displayType: 'phrase', separator: ', ' }
 * ]
 */
export type StructureTemp = {
  templateId: string;
  /** template string, use ${} reference variable */
  template: string;
  /**
   * template display as
   * default is phrase
   */
  displayType?: StructureDisplayType;
  /** link symbol when variable is looping */
  separator?: string;
  /** variable used in template */
  variableId?: string;
};

/**
 * @description variable info map
 * @example Variable[] like bellow:
 *  [
 *    {
 *        variableId: "var1",
 *        dataValue: [{ name: "x", age: 12 }, { name: "y", age: 18 }],
 *        dataMetaMap: {
 *           name: { entityType: "dim_value", name: "name" },
 *           age: { entityType: "metric_value", name: "age" },
 *        }
 *     },
 *    {
 *        variableId: "var2",
 *        // can used for constants
 *        dataValue: { systemName: "github" },
 *    }
 *  ]
 */
export type Variable = {
  variableId: string;
  dataValue: Datum | Datum[];
  dataMetaMap?: DataMetaMap;
};

export type VariableMap = Record<
  string, // variableId
  Variable
>;
