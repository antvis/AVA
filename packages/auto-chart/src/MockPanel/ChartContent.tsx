import React from 'react';
import { CKBJson } from '@antv/ckb';
import { Thumbnail } from '@antv/thumbnails-component';
import { prefixCls } from '../utils';
import { Language } from '../i18n';
import type { ThumbnailID } from '@antv/thumbnails';

const CHART_NAMES = [
  'line_chart',
  'area_chart',
  'bar_chart',
  'grouped_bar_chart',
  'stacked_bar_chart',
  'percent_stacked_bar_chart',
  'column_chart',
  'grouped_column_chart',
  'stacked_column_chart',
  'percent_stacked_column_chart',
  'stacked_area_chart',
  'pie_chart',
  'donut_chart',
  'radar_chart',
  'scatter_plot',
  'bubble_chart',
  'histogram',
  'heatmap',
];

interface ChartContentProps {
  language: Language;
  chartType: string;
  onMockChartTypeChange: (key: string) => void;
}

export const ChartContent = (props: ChartContentProps) => {
  const { language, chartType } = props;
  const ChartWiki = CKBJson(language, true);
  return (
    <div className={`${prefixCls}mockchart-container`}>
      {CHART_NAMES.map((key) => {
        return (
          <div key={key} className={`chart-item${chartType === key ? ' active' : ''}`}>
            <div className="chart">
              <Thumbnail chart={key as ThumbnailID} onClick={() => props.onMockChartTypeChange(key)} />
            </div>
            <div>{ChartWiki[key].name}</div>
          </div>
        );
      })}
    </div>
  );
};
