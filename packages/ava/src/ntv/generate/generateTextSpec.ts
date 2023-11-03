/* eslint-disable no-console */
import { toString } from 'lodash';

import { isNumberLike } from '../../utils';
import { isEntityType } from '../utils';

import {
  templateStr2Structure,
  getScopeVariableArray,
  getFormattedNumberValue,
  getAssessment,
  getDisplayValue,
  getByPath,
} from './utils';

import type {
  NarrativeTextSpec,
  SectionSpec,
  ParagraphSpec,
  PhraseSpec,
  TextPhraseSpec,
  BulletsParagraphSpec,
} from '../schema';
import type { Variable, Structure, StructureTemp, VariableMeta, VariableMetaMap } from './types';

type GenerateParams = {
  variable: Variable;
  structures: Structure[];
  structureTemps?: StructureTemp[];
};

class TextSpecGenerator {
  private variable: Variable;

  private structures: Structure[];

  private structureTemps: StructureTemp[];

  constructor({ variable, structures, structureTemps }: GenerateParams) {
    this.variable = variable;
    this.structures = structures;
    this.structureTemps = structureTemps;
  }

  private generateTextPhrase(text: string): TextPhraseSpec {
    // TODO 是否需要判断 value 为 string ？？是否需要默认的数值格式化？—— 暂时先简单 toString 下
    return { type: 'text', value: toString(text) };
  }

  private generateVarPhrase(scopeVariable: Variable, path: string, value: any, metadata?: VariableMeta): PhraseSpec {
    // 没有 meta 的一律按普通文本处理
    if (!metadata) {
      return this.generateTextPhrase(value);
    }

    const { varType, formatter, extraCustomMeta } = metadata;
    const formattedValue = getFormattedNumberValue(varType, value, formatter);

    // 声明 varType 的可能是 entity 也可能是 custom
    if (varType) {
      if (isEntityType(varType)) {
        return {
          type: 'entity',
          value: formattedValue,
          metadata: {
            entityType: varType,
            origin: isNumberLike(value) ? value : undefined,
            assessment: getAssessment(varType, value),
            generateVariableInfo: { scopeVariable, path },
          },
        };
      }
      const extra = extraCustomMeta?.(this.variable, scopeVariable);
      return {
        type: 'custom',
        value: formattedValue,
        // TODO 完善自定义短语 metadata
        metadata: {
          customType: varType,
          generateVariableInfo: { scopeVariable, path },
          ...extra,
        },
      };
    }

    return this.generateTextPhrase(toString(value));
  }

  // 只处理行数据拼接逻辑，表格数据
  private generateSentence(template: string, variable: Variable, variableMetaMap: VariableMetaMap): PhraseSpec[] {
    let phrases: PhraseSpec[] = [];
    const templateStructure = templateStr2Structure(template);

    for (let i = 0; i < templateStructure.length; i += 1) {
      const { type: tempStrType, value: tempStrValue } = templateStructure[i];
      if (tempStrType === 'template') {
        const targetTempId = tempStrValue;
        // get template info by template id
        const templateInfo = this.structureTemps.find(({ templateId }) => templateId === targetTempId);
        if (templateInfo) {
          const { template, useVariable, variableMetaMap, limit, separator = ',' } = templateInfo;
          const scopeArrayVariable = getScopeVariableArray(this.variable, variable, useVariable, limit);
          const subPhrases = scopeArrayVariable
            .map((v) => this.generateSentence(template, v, variableMetaMap))
            .reduce((prev, curr, index) => {
              const result = [...prev, ...curr];
              if (index !== scopeArrayVariable.length - 1) result.push(this.generateTextPhrase(separator));
              return result;
            }, []);
          phrases = phrases.concat(...subPhrases);
        } else {
          console.warn(`${targetTempId} is not exist`);
        }
      } else if (tempStrType === 'variable') {
        const key = tempStrValue;
        const metadata = variableMetaMap?.[key];
        const value = metadata?.getDisplayValue
          ? getDisplayValue(metadata?.getDisplayValue, this.variable, variable)
          : getByPath(this.variable, variable, key);
        phrases.push(this.generateVarPhrase(variable, key, value, { ...metadata }));
      } else if (tempStrType === 'text') {
        phrases.push(this.generateTextPhrase(tempStrValue));
      }
    }

    return phrases;
  }

  /**
   * 生成段落
   * 1. 当前支持段落类型 heading normal bullet
   * 2. 生成段落个数取决于 variable 的类型：
   *  2.1 非自带循环属性的段落（heading normal）遇到数组数据时自动循环多段；
   *  2.2 自身循环段落（bullet）遇到非数组时只生成一个
   * */
  private generateParagraphs(structure: Structure, variable: Variable = this.variable): ParagraphSpec[] {
    const {
      variableMetaMap,
      template,
      displayType = 'paragraph',
      useVariable = '',
      limit,
      // 段落级别暂时用不到 separator
      // separator,
      bulletOrder,
      children,
      className,
    } = structure;
    const scopeArrayVariable = getScopeVariableArray(this.variable, variable, useVariable, limit);

    // TODO 接入更多类型
    if (displayType === 'paragraph') {
      return scopeArrayVariable.map((v) => ({
        type: 'normal',
        phrases: this.generateSentence(template, v, variableMetaMap),
        className,
      }));
    }

    if (displayType === 'bullet') {
      return [
        {
          type: 'bullets',
          className,
          isOrder: bulletOrder,
          bullets: scopeArrayVariable.map((v) => ({
            type: 'bullet-item',
            phrases: this.generateSentence(template, v, variableMetaMap),
            subBullet: children
              ? this.generateParagraphs(
                  {
                    ...children,
                    displayType: 'bullet',
                  },
                  v
                )[0]
              : undefined,
          })),
        } as BulletsParagraphSpec,
      ];
    }

    return null;
  }

  private generateSection(): SectionSpec {
    return {
      paragraphs: this.structures.reduce((prev, curr) => {
        return [...prev, ...this.generateParagraphs(curr)];
      }, []),
    };
  }

  generateNarrative(): NarrativeTextSpec {
    return {
      // 当前只可能构建出一个 section
      sections: [this.generateSection()],
    };
  }
}

export default function generateTextSpec(params: GenerateParams): NarrativeTextSpec {
  return new TextSpecGenerator(params).generateNarrative();
}
