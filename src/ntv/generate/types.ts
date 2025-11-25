type StructureDisplayType = 'heading' | 'paragraph' | 'bullet';

export type VariableMeta = Partial<{
  /** 可能是 entityType 或者是 customType */
  varType: string;
  // TODO 之后整体有类似 d3-format 之后可接受字符串
  formatter: (value: any) => string;
  /** 类似计算字段，行级别拼接 value 变量 */
  getDisplayValue: string | ((globalVar: Variable, scopeVar: Variable) => string);
  /** 其他自定义属性 */
  extraCustomMeta: (globalVar: Variable, scopeVar: Variable) => Record<string, any>;
}>;

export type VariableMetaMap = Record<string, VariableMeta>;

export type TemplateBase = {
  /**
   * template string
   * -- use ${} 表示应用哪个变量
   * -- use &{} 表示应用哪个模版，即 structureTemp 中的 templateId
   */
  template: string;
  /** 分隔符，如果数据是数组，自动循环 */
  separator?: string;
  /** 列表循环 limit */
  limit?: number;
  /** 变量附加信息 */
  variableMetaMap?: VariableMetaMap;
  /** 通过类似 lodash get 变量路径访问变量 */
  useVariable?: string;
};

/**
 * @description narrative structure，会按顺序执行
 * @example Structure[] like bellow:
 * [
 *    { template: "system &{s1}, includes &{s2} .", displayType: "paragraph" },
 * ]
 */
export type Structure = TemplateBase & {
  /**
   * 展示段落类型
   */
  displayType?: StructureDisplayType;
  /** 列表是否有序 */
  bulletOrder?: boolean;
  /** 用于嵌套列表 */
  children?: Structure;
  className?: string;
};

/**
 * @description structure template，只有引用到才会按执行
 * @example StructureTemp[] like bellow:
 * [
 *    { templateId: s1, template: "&{s1}", variableId: "var2" },
 *    { templateId: s2, template: 'user ${name}, ${age[metric_name]} is ${age}', variableId: 'var1', displayType: 'phrase', separator: ', ' }
 * ]
 */
export type StructureTemp = TemplateBase & {
  templateId: string;
};

// variable can by any plain object
export type Variable = Record<string, any>;
