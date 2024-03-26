import { Data } from '../../../common/types';

/** filter out fields that are not included for advising */
export const getSelectedData = ({ data, fields }: { data: Data; fields?: string[] }) => {
  if (fields) {
    return data.map((row: Record<string, any>) => {
      const filteredRow = row;
      Object.keys(filteredRow).forEach((col) => {
        if (!fields.includes(col)) {
          delete filteredRow[col];
        }
      });
      return row;
    });
  }
  return data;
};
