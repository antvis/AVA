import { get, isArray, isUndefined, slice, isNumber, replace, isString, startsWith } from 'lodash';

import { dataFormat } from '../../utils';

import type { Variable, VariableMeta } from './types';
import type { EntityType } from '../schema';

export type TemplateStructure = {
  type: 'text' | 'variable' | 'template';
  value: string;
};

/**
 * simple path system
 * if starts with '.', it's relative path
 * // TODO 支持相对路径找到上级
 * if starts with '..', it's can get prev level variable
 * otherwise, it's absolute path
 */
export function getByPath(globalVar: Variable, scopeVar: Variable, path?: string) {
  if (!path) return scopeVar;
  if (startsWith(path, '.')) return get(scopeVar, path.slice(1));
  return get(globalVar, path);
}

/**
 * parse template string
 *    Use $ for variable
 *    Use & for template
 * @example 'aaa ${key} &{temp1}'
 *  => [{ type: 'text', value: 'aaa ' }, { type: 'variable', value: 'key' }, { type: 'template', value: 'temp1' }]
 */
export function templateStr2Structure(templateStr: string): TemplateStructure[] {
  // eslint-disable-next-line no-useless-escape
  const splitReg = /([\$|&]{.*?})/;
  const varReg = /\${(.*?)}/;
  const tempReg = /&{(.*?)}/;
  return templateStr
    .split(splitReg)
    .filter((str) => str)
    .map((str) => {
      const templateId = tempReg.exec(str)?.[1];
      if (templateId) return { value: templateId, type: 'template' };
      const varName = varReg.exec(str)?.[1];
      if (varName) return { value: varName, type: 'variable' };
      return { value: str, type: 'text' };
    });
}

/** format any to array, and filter nil */
export function formattedAsArray(variable: Variable) {
  if (isUndefined(variable)) return [];
  return isArray(variable) ? variable : [variable];
}

export function getScopeVariableArray(globalVar: Variable, scopeVar: Variable, path: string, limit?: number) {
  return slice(formattedAsArray(getByPath(globalVar, scopeVar, path)), 0, limit);
}

export function getAssessment(entityType: EntityType, value: any) {
  if (!isNumber(value)) return undefined;
  if (entityType === 'delta_value' || entityType === 'ratio_value') {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
  }
  return undefined;
}

export function getFormattedNumberValue(varType: string, value: any, formatter?: VariableMeta['formatter']) {
  if (!isNumber(value)) return value;
  if (varType === 'delta_value' || varType === 'ratio_value') {
    return formatter ? formatter(Math.abs(value)) : dataFormat(Math.abs(value));
  }
  if (varType === 'proportion') {
    return formatter ? formatter(Math.abs(value)) : `${dataFormat(value * 100)}%`;
  }
  return formatter ? formatter(value) : dataFormat(value);
}

/** get phrase text */
export function getDisplayValue(
  getDisplayValuePattern: VariableMeta['getDisplayValue'],
  globalVar: Variable,
  scopeVar: Variable
) {
  if (isString(getDisplayValuePattern)) {
    // 用字符串表示使用变量拼接短语文字内容，这里进行变量替换，eg '${city} = ${value}' => '北京 = 1000'
    // Use a string to represent the text content of the phrase using variables to splice，eg '${city} = ${value}' => 'Beijing = 1000'
    return replace(getDisplayValuePattern, /\${(.*?)}/g, (match) => {
      const varName = /\${(.*?)}/.exec(match)?.[1];
      return varName ? getByPath(globalVar, scopeVar, varName) : '';
    });
  }
  return getDisplayValuePattern(globalVar, scopeVar);
}
