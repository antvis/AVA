import { isUndefined, arr2map } from '../../utils';

import type { NarrativeTextSpec, ParagraphSpec, PhraseSpec, TextParagraphSpec, TextPhraseSpec } from '../schema';
import type { Structure, Variable, StructureTemp } from './types';

function getSentences(
  template: string,
  dataValue?: Variable['dataValue'],
  dataMetaMap?: Variable['dataMetaMap']
): PhraseSpec[][] {
  const splitReg = /(\${.*?})/;
  const varReg = /\${(.*?)}/;
  const METRIC_NAME_SUFFIX = '[metric_name]';

  // "user ${name}, age is ${age}" => ["user ", "${name}", ", age is ", "${age}"]
  const templateStrArr = template.split(splitReg).filter((str) => str);
  // {} => [{}]
  const formattedDataValue = Array.isArray(dataValue) ? dataValue : [dataValue || {}];

  return formattedDataValue.map((datum) => {
    return templateStrArr.map<PhraseSpec>((str) => {
      const varName: string | undefined = varReg.exec(str)?.[1]; // age
      if (varName) {
        if (varName.endsWith(METRIC_NAME_SUFFIX)) {
          const fieldId = varName.slice(0, -METRIC_NAME_SUFFIX.length);
          return {
            type: 'entity',
            value: dataMetaMap?.[fieldId]?.name || fieldId,
            metadata: { entityType: 'metric_name' },
          };
        }

        const data = isUndefined(datum[varName]) ? '-' : `${datum[varName]}`;
        const dataMeta = dataMetaMap?.[varName];
        if (dataMeta?.entityType) {
          return { type: 'entity', value: data, metadata: { entityType: dataMeta?.entityType } };
        }
        return { type: 'text', value: data };
      }
      return { type: 'text', value: str };
    });
  });
}

/**
 * @WIP 能力完善中，api 可能有变动，如慎重使用在生产环境
 * @WIP The api may change as capabilities improve, such as carefully used in a production environment
 * use structure and variables to generate narrative text spec
 */
function generateTextSpec({
  structures,
  structureTemps = [],
  variables = [],
}: {
  structures: Structure[];
  structureTemps?: StructureTemp[];
  variables?: Variable[];
}): NarrativeTextSpec {
  const variableMap = arr2map<Variable>(variables, 'variableId');
  const structureTempMap = arr2map<StructureTemp>(structureTemps, 'templateId');
  const splitReg = /(&{.*?})/;
  const varReg = /&{(.*?)}/;

  // generate paragraphs by structure
  let paragraphs: ParagraphSpec[] = [];

  structures.forEach((structure, structureIdx) => {
    const { template } = structure;
    let { displayType = structureIdx === 0 ? 'paragraph' : 'phrase' } = structure;
    // "System &{s1}, includes &{s2}." => ["System ", "&{s1}", ", includes ", "&{s2}", "."]
    const templateStrArr = template.split(splitReg).filter((str) => str);

    templateStrArr.forEach((templateStr, structureTempIdx) => {
      const templateId: string | undefined = varReg.exec(templateStr)?.[1];
      if (structureTempIdx > 0) displayType = 'phrase';
      if (templateId && structureTempMap[templateId]) {
        const structureTemp = structureTempMap[templateId];
        const { template: subTemplate, variableId, separator, displayType: subDisplayType = 'phrase' } = structureTemp;
        const variable: Variable | undefined = variableId && variableMap[variableId];
        const sentences = getSentences(subTemplate, variable?.dataValue, variable?.dataMetaMap);

        if (subDisplayType === 'paragraph') {
          paragraphs = [
            ...paragraphs,
            ...sentences.map<TextParagraphSpec>((sentence, sentenceIdx) => {
              const phrases = [...sentence];
              if (separator && sentenceIdx < sentences.length - 1) {
                phrases.push({ type: 'text', value: separator });
              }
              return {
                type: 'normal',
                phrases,
              };
            }),
          ];
        } else if (subDisplayType === 'phrase') {
          if (!paragraphs.length) paragraphs.push({ type: 'normal', phrases: [] });
          const latestParagraph = paragraphs[paragraphs.length - 1] as TextParagraphSpec;
          latestParagraph.phrases = [
            ...latestParagraph.phrases,
            ...sentences.reduce((prev, curr, sentenceIdx) => {
              const phrases = [...prev, ...curr];
              if (separator && sentenceIdx < sentences.length - 1) {
                phrases.push({ type: 'text', value: separator });
              }
              return phrases;
            }, []),
          ];
        }
      } else {
        const currPhrase: TextPhraseSpec = { type: 'text', value: templateStr };
        if (displayType === 'paragraph') {
          paragraphs.push({ type: 'normal', phrases: [currPhrase] });
        } else if (displayType === 'phrase') {
          if (!paragraphs.length) paragraphs.push({ type: 'normal', phrases: [] });
          const latestParagraph = paragraphs[paragraphs.length - 1] as TextParagraphSpec;
          latestParagraph.phrases.push(currPhrase);
        }
      }
    });
  });

  return {
    // single section represent
    // 当前构造可以只通过一个 section 表示
    sections: [{ paragraphs }],
  };
}

export default generateTextSpec;
