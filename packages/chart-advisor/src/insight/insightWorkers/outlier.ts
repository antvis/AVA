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
    for (let j = i + 1; j < columns.length; j++) {
      if (columnProps[i].isInterval || columnProps[j].isInterval) {
        let hasInsight = false;

        let dimensionTitle;
        let measureTitle;

        if (columnProps[i].isInterval) {
          dimensionTitle = columnProps[j].title;
          measureTitle = columnProps[i].title;
        } else {
          dimensionTitle = columnProps[i].title;
          measureTitle = columnProps[j].title;
        }

        const subdata = columns[i].map((valueI, index) => {
          const newRow: any = {};

          newRow[columnProps[i].title] = valueI;
          const valueJ = columns[j][index];
          newRow[columnProps[j].title] = valueJ;

          newRow.isOutlier =
            (columnProps[i].isInterval && filters[i](valueI)) || (columnProps[j].isInterval && filters[j](valueJ));

          if (newRow.isOutlier) {
            hasInsight = true;
          }

          return newRow;
        });

        if (hasInsight) {
          let dimension = '';
          let measure = '';

          if (columnProps[i].isInterval) {
            dimension = columnProps[j].title;
            measure = columnProps[i].title;
          } else {
            dimension = columnProps[i].title;
            measure = columnProps[j].title;
          }

          const outlierSeries = subdata.filter((row) => row.isOutlier).map((row) => row[dimension]);
          let outlierSeriesStr = '';
          if (outlierSeries.length === 1) {
            outlierSeriesStr = `'${outlierSeries[0]}'`;
          } else {
            for (let i = 0; i < outlierSeries.length; i++) {
              if (i === outlierSeries.length - 1) {
                outlierSeriesStr += ` and '${outlierSeries[i]}'`;
              } else if (i === 0) {
                outlierSeriesStr += `'${outlierSeries[i]}'`;
              } else {
                outlierSeriesStr += `, '${outlierSeries[i]}'`;
              }
            }
          }
          const description = `${outlierSeriesStr} ${outlierSeries.length === 1 ? 'is' : 'are'} noticeable ${
            outlierSeries.length === 1 ? 'outlier' : 'outliers'
          } for '${measure}'`;

          const chartType = columnProps[i].isInterval && columnProps[j].isInterval ? 'scatter_plot' : 'column_chart';

          const insight: Insight = {
            type: 'CategoryOutliers',
            description,
            fields: [columnProps[i].title, columnProps[j].title],
            present: {
              data: subdata.map((row) => {
                row.isOutlier = row.isOutlier ? 'Outlier' : 'Not';
                return row;
              }),
              fields: [columnProps[i].title, columnProps[j].title, 'isOutlier'],
              purpose: ['Distribution'],
              type: chartType,
              encoding: {
                x: dimensionTitle,
                y: measureTitle,
                color: 'isOutlier',
              },
              configs: {
                xAxis: { title: { visible: true } },
                yAxis: { title: { visible: true } },
                color: ['#5B8FF9', '#ff99c3'],
              },
            },
          };

          insights.push(insight);
        }
      }
    }
  }

  return insights;
};
