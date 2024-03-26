import { DataFrame } from '../../../data';

import type { Data } from '../../../common/types';
import type { BasicDataPropertyForAdvice } from '../../types';

/**
 * A utility function that assemble dataProps with user input and DataFrame
 * @param copyData a copy of original data
 * @param fields the fields that user specified to be used in dataset
 * @param inputDataProps user input dataProps which will cover or combine with dataProps from DataFrame
 * @returns assembled data props
 */
export function getDataProps(
  copyData: Data,
  fields?: string[],
  inputDataProps?: Partial<BasicDataPropertyForAdvice>[]
): BasicDataPropertyForAdvice[] {
  // transform data into DataFrame
  let dataFrame: DataFrame;
  try {
    if (fields) {
      dataFrame = new DataFrame(copyData, { columns: fields });
    } else {
      dataFrame = new DataFrame(copyData);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('failed to transform the input data into DataFrame: ', error);
    return [];
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
