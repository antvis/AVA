import { RowData, AGGREGATION } from '@antv/dw-transform';
import { Insight } from '..';
import { Worker } from '.';
import { rowDataToColumnFrame, columnsToRowData } from './utils';

export const monotonicityIW: Worker = function(data: RowData[]): Insight[] {
  const insights: Insight[] = [];

  const { columnProps, columns } = rowDataToColumnFrame(data);

  for (let i = 0; i < columns.length; i++) {
    // todo: isOrdinal w. sort
    if (columnProps[i].isTime) {
      for (let j = 0; j < columns.length; j++) {
        if (columnProps[j].isInterval) {
          const subData = columnsToRowData([columns[i], columns[j]], [columnProps[i].title, columnProps[j].title]);

          if (subData) {
            AGGREGATION.forEach((aggType) => {
              // const { result, schemas } = autoTransform(subData, false, aggType);
              console.log(aggType);
              // ...
            });
          }
        }
      }
    }
  }

  return insights;
};
