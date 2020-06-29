import { RowData } from '@antv/dw-transform';
import { Insight } from '..';
import { rowDataToColumnFrame, outliersFilters } from './utils';
import { Worker } from '.';
import { FieldInfo } from '@antv/dw-analyzer';

export const outlierIW: Worker = function(data: RowData[]): Insight[] {
  const insights: Insight[] = [];

  const { columnProps, columns } = rowDataToColumnFrame(data);

  const dataProps = columnProps.map((cp) => cp.fieldInfo);
  const filters = outliersFilters(dataProps as FieldInfo[]);

  for (let i = 0; i < columns.length; i++) {
    if (columnProps[i].isInterval) {
      for (let j = i + 1; j < columns.length; j++) {
        if (columnProps[j].isInterval) {
          let hasInsight = false;

          const subdata = columns[i].map((valueI, index) => {
            const newRow: any = {};

            newRow[columnProps[i].title] = valueI;
            const valueJ = columns[j][index];
            newRow[columnProps[j].title] = valueJ;

            newRow.isOutlier = filters[i](valueI) || filters[j](valueJ);
            if (newRow.isOutlier) {
              hasInsight = true;
            }

            return newRow;
          });

          if (hasInsight) {
            const insight: Insight = {
              type: 'CategoryOutliers',
              fields: [columnProps[i].title, columnProps[j].title],
              present: {
                data: subdata,
                fields: [columnProps[i].title, columnProps[j].title, 'isOutlier'],
                configs: {
                  colorField: 'isOutlier',
                },
              },
            };

            insights.push(insight);
          }
        }
      }
    }
  }

  return insights;
};
