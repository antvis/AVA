import React from 'react';
import { prefixCls, getThumbnailURL } from '../utils';
import { intl, Language } from '../i18n';
import type { ChartID } from '@antv/knowledge';

const CHART_NAME_MAP = {
  line_chart: 'Line Chart',
  area_chart: 'Area Chart',
  bar_chart: 'Bar Chart',
  grouped_bar_chart: 'Grouped Bar Chart',
  stacked_bar_chart: 'Stacked Bar Chart',
  percent_stacked_bar_chart: 'Percent Stacked Bar Chart',
  column_chart: 'Column Chart',
  grouped_column_chart: 'Grouped Column Chart',
  stacked_column_chart: 'Stacked Column Chart',
  percent_stacked_column_chart: 'Percent Stacked Column Chart',
  stacked_area_chart: 'Stacked Area Chart',
  pie_chart: 'Pie Chart',
  donut_chart: 'Donut Chart',
  radar_chart: 'Radar Chart',
  scatter_plot: 'Scatter Plot',
  bubble_chart: 'Bubble Chart',
  histogram: 'Histogram',
  heatmap: 'Heatmap',
};

interface ChartContentProps {
  language: Language;
  chartType: string;
  onMockChartTypeChange: (key: string) => void;
};

export const ChartContent = (props: ChartContentProps) => {
  const { language, chartType } = props;

  return (
      <div className={`${prefixCls}mockchart-container`}>
        {Object.entries(CHART_NAME_MAP).map(([key]) => {
          return (
            <div key={key} className={`chart-item${chartType === key ? ' active' : ''}`}>
              <div className="chart">
                <img onClick={() => props.onMockChartTypeChange(key)} src={getThumbnailURL(key as ChartID)} alt={key} />
              </div>
              <div>{intl.get(CHART_NAME_MAP[key], language)}</div>
            </div>
          );
        })}
      </div>
  );
};

