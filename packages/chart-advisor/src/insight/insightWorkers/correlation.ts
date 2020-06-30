import { RowData } from '@antv/dw-transform';
import { TypeSpecifics } from '@antv/dw-analyzer';
import { Insight } from '..';
import { pearsonCorr, rowDataToColumnFrame } from './utils';
import { Worker } from '.';

export const correlationIW: Worker = function(data: RowData[]): Insight[] {
  const THRESHOLD = 0.9;
  const insights: Insight[] = [];

  const { columnProps, columns } = rowDataToColumnFrame(data);

  for (let i = 0; i < columns.length; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      if (
        columnProps[i].type !== null &&
        ['integer', 'float'].includes(columnProps[i].type as TypeSpecifics) &&
        columnProps[j].type !== null &&
        ['integer', 'float'].includes(columnProps[j].type as TypeSpecifics) &&
        Math.abs(pearsonCorr(columns[i] as number[], columns[j] as number[])) > THRESHOLD
      ) {
        insights.push({
          type: 'Correlation',
          description: `There is a correlation between '${columnProps[i].title}' and '${columnProps[j].title}'`,
          fields: [columnProps[i].title as string, columnProps[j].title as string],
          present: {
            purpose: ['Distribution'],
          },
        });
      }
    }
  }

  return insights;
};
