import { RowData } from '@antv/dw-transform';
import { Insight } from '..';
import { pearsonCorr, rowDataToColumnFrame, normalizeArray } from './utils';
import { Worker } from '.';

type Couple = {
  valueI: string;
  valueJ: number;
};

export const overallTrendsIW: Worker = function(data: RowData[]): Insight[] {
  const THRESHOLD = 0.85;
  const insights: Insight[] = [];

  const { columnProps, columns } = rowDataToColumnFrame(data);

  for (let i = 0; i < columns.length; i++) {
    if (columnProps[i].isTime) {
      for (let j = 0; j < columns.length; j++) {
        if (columnProps[j].isInterval) {
          const couples: Couple[] = columns[i].map((value, index) => {
            return {
              valueI: value as string,
              valueJ: columns[j][index] as number,
            };
          });

          const sortedCouples = couples.sort((a: Couple, b: Couple) => {
            const dateA = Date.parse(a.valueI);
            const dateB = Date.parse(b.valueI);
            if (dateA < dateB) {
              return -1;
            }
            if (dateA > dateB) {
              return 1;
            }
            return 0;
          });

          const orderField: number[] = [];
          const valueField: number[] = [];

          sortedCouples.forEach((couple, index) => {
            orderField.push(index);
            valueField.push(couple.valueJ);
          });

          const orderFieldNor = normalizeArray(orderField);
          const valueFieldNor = normalizeArray(valueField);

          console.log(Math.abs(pearsonCorr(orderFieldNor, valueFieldNor)));

          if (Math.abs(pearsonCorr(orderFieldNor, valueFieldNor)) > THRESHOLD) {
            insights.push({
              type: 'OverallTrends',
              fields: [columnProps[i].title as string, columnProps[j].title as string],
            });
          }
        }
      }
    }
  }

  return insights;
};
