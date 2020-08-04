import { RowData } from '@antv/dw-transform';
import { Insight } from '..';
import { Worker } from '.';
import { rowDataToColumnFrame, columnsToRowData } from './utils';

export const majorFactorsIW: Worker = function (data: RowData[]): Insight[] {
  const THRESHOLD = 0.6;
  const insights: Insight[] = [];

  const { columnProps, columns } = rowDataToColumnFrame(data);
  for (let i = 0; i < columns.length; i++) {
    const fieldInfo = columnProps[i].fieldInfo;
    if (fieldInfo) {
      const { valueMap, count: countSum } = fieldInfo;
      if (valueMap && countSum) {
        let maxCount = -1;
        const maxKeys: string[] = [];

        Object.keys(valueMap).forEach((key) => {
          const count = valueMap[key];
          if (count >= maxCount) {
            maxCount = count;
            maxKeys.push(key);
          }
        });

        maxKeys.forEach((key) => {
          const count = valueMap[key];
          if (count / countSum >= THRESHOLD) {
            const columnTitle = columnProps[i].title;
            const countTitle = `COUNT(${columnTitle})`;

            const presentData: RowData[] = columnsToRowData(
              [Object.keys(valueMap), Object.values(valueMap)],
              [columnTitle, countTitle]
            );

            const insight: Insight = {
              type: 'MajorFactors',
              description: `'${key}' occupies for the majority of '${columnTitle}' by ${(count / countSum) * 100}%`,
              fields: [columnTitle],
              present: {
                data: presentData,
                fields: [columnTitle, countTitle],
                purpose: ['Proportion'],
                type: 'pie_chart',
                encoding: {
                  color: columnTitle,
                  angle: countTitle,
                },
                configs: {
                  xAxis: { title: { visible: true } },
                  yAxis: { title: { visible: true } },
                },
              },
            };

            insights.push(insight);
          }
        });
      }
    }
  }

  return insights;
};
