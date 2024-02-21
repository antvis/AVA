import { DataFrame } from '../../data';
import { cloneDeep } from '../utils';

import { dataToAdvices } from './data-to-advices';

import type { ChartKnowledgeBase } from '../../ckb';
import type { Data } from '../../common/types';
import type { AdviseResult, ChartAdviseParams } from '../types';
import type { BasicDataPropertyForAdvice, RuleModule } from '../ruler';

/**
 * A utility function that assemble dataProps with user input and DataFrame
 * @param copyData a copy of original data
 * @param fields the fields that user specified to be used in dataset
 * @param inputDataProps user input dataProps which will cover or combine with dataProps from DataFrame
 * @returns assembled data props
 */
export function assembleDataProps(
  copyData: Data,
  fields?: string[],
  inputDataProps?: Partial<BasicDataPropertyForAdvice>[]
): BasicDataPropertyForAdvice[] {
  // transform data into DataFrame
  let dataFrame: DataFrame;
  if (fields) {
    dataFrame = new DataFrame(copyData, { columns: fields });
  } else {
    dataFrame = new DataFrame(copyData);
  }
  let dataPropsForAdvice: BasicDataPropertyForAdvice[];
  const defaultDataProps = dataFrame.info() as BasicDataPropertyForAdvice[];

  if (inputDataProps) {
    dataPropsForAdvice = defaultDataProps.map((dwItem) => {
      const inputProps = inputDataProps.find((item) => {
        return item.name === dwItem.name;
      });
      return {
        ...dwItem,
        ...inputProps,
      };
    });
  } else {
    dataPropsForAdvice = defaultDataProps;
  }

  return dataPropsForAdvice;
}

export function advicesForChart(
  params: ChartAdviseParams,
  ckb: ChartKnowledgeBase,
  ruleBase: Record<string, RuleModule>
): AdviseResult {
  const { data, dataProps, smartColor, options, colorOptions, fields } = params;

  try {
    // otherwise the input data will be mutated
    const copyData = cloneDeep(data);

    // get dataProps from DataFrame
    const dataPropsForAdvice = assembleDataProps(copyData, fields, dataProps);

    // filter out fields that are not included for advising
    let filteredData: Record<string, any>[] = [];
    if (fields) {
      filteredData = copyData.map((row: Record<string, any>) => {
        const filteredRow = row;
        Object.keys(filteredRow).forEach((col) => {
          if (!fields.includes(col)) {
            delete filteredRow[col];
          }
        });
        return row;
      });
    } else {
      filteredData = copyData;
    }

    const adviceResult = dataToAdvices(
      filteredData,
      dataPropsForAdvice,
      ckb,
      ruleBase,
      smartColor,
      options,
      colorOptions
    );

    return adviceResult as AdviseResult;
  } catch (error) {
    // if the input data cannot be transformed into DataFrame
    // eslint-disable-next-line no-console
    console.error('error: ', error);
    return { advices: [], log: [] };
  }
}
