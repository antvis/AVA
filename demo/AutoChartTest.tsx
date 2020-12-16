import * as React from 'react';
import AutoChart from './auto-chart';
// import { DataSamples } from './data-samples';

const data = [
  {
    series: 'London',
    month: '2019-01',
    value: 975,
  },
  {
    series: 'London',
    month: '2019-02',
    value: 936,
  },
  {
    series: 'London',
    month: '2019-03',
    value: 901,
  },
  {
    series: 'London',
    month: '2019-04',
    value: 888,
  },
  {
    series: 'London',
    month: '2019-05',
    value: 843,
  },
  {
    series: 'London',
    month: '2019-06',
    value: 819,
  },
  {
    series: 'Paris',
    month: '2019-01',
    value: 660,
  },
  {
    series: 'Paris',
    month: '2019-02',
    value: 711,
  },
  {
    series: 'Paris',
    month: '2019-03',
    value: 745,
  },
  {
    series: 'Paris',
    month: '2019-04',
    value: 782,
  },
  {
    series: 'Paris',
    month: '2019-05',
    value: 806,
  },
  {
    series: 'Paris',
    month: '2019-06',
    value: 840,
  },
  {
    series: 'Venice',
    value: 626,
    month: '2019-01',
  },
  {
    series: 'Venice',
    value: 634,
    month: '2019-02',
  },
  {
    series: 'Venice',
    value: 605,
    month: '2019-03',
  },
  {
    series: 'Venice',
    value: 626,
    month: '2019-04',
  },
  {
    series: 'Venice',
    value: 647,
    month: '2019-05',
  },
  {
    series: 'Venice',
    value: 613,
    month: '2019-06',
  },
  {
    month: '2019-07',
    value: 817,
    series: 'London',
  },
  {
    month: '2019-07',
    value: 856,
    series: 'Paris',
  },
  {
    month: '2019-07',
    value: 594,
    series: 'Venice',
  },
  {
    month: '2019-08',
    value: 806,
    series: 'London',
  },
  {
    month: '2019-08',
    value: 878,
    series: 'Paris',
  },
  {
    month: '2019-08',
    value: 594,
    series: 'Venice',
  },
  {
    month: '2019-09',
    value: 806,
    series: 'London',
  },
  {
    month: '2019-09',
    value: 896,
    series: 'Paris',
  },
  {
    month: '2019-09',
    value: 613,
    series: 'Venice',
  },
  {
    month: '2019-10',
    value: 796,
    series: 'London',
  },
  {
    month: '2019-10',
    value: 915,
    series: 'Paris',
  },
  {
    month: '2019-10',
    value: 631,
    series: 'Venice',
  },
  {
    month: '2019-11',
    value: 792,
    series: 'London',
  },
  {
    month: '2019-11',
    value: 939,
    series: 'Paris',
  },
  {
    month: '2019-11',
    value: 618,
    series: 'Venice',
  },
  {
    month: '2019-12',
    value: 774,
    series: 'London',
  },
  {
    month: '2019-12',
    value: 941,
    series: 'Paris',
  },
  {
    month: '2019-12',
    value: 655,
    series: 'Venice',
  },
  {
    month: '2020-01',
    value: 743,
    series: 'London',
  },
  {
    month: '2020-01',
    value: 923,
    series: 'Paris',
  },
  {
    month: '2020-01',
    value: 660,
    series: 'Venice',
  },
  {
    month: '2020-02',
    value: 875,
    series: 'London',
  },
  {
    month: '2020-02',
    value: 934,
    series: 'Paris',
  },
  {
    month: '2020-02',
    value: 655,
    series: 'Venice',
  },
  {
    month: '2020-03',
    value: 920,
    series: 'London',
  },
  {
    month: '2020-03',
    value: 979,
    series: 'Paris',
  },
  {
    month: '2020-03',
    value: 652,
    series: 'Venice',
  },
  {
    month: '2020-04',
    value: 944,
    series: 'London',
  },
  {
    month: '2020-04',
    value: 976,
    series: 'Paris',
  },
  {
    month: '2020-04',
    value: 655,
    series: 'Venice',
  },
];

const pieData = [
  { type: '分类一', value: 27 },
  { type: '分类二', value: 25 },
  { type: '分类三', value: 18 },
  { type: '分类四', value: 15 },
  { type: '分类五', value: 10 },
  { type: '其他', value: 5 },
  { type: '分类六', value: 15 },
  { type: '分类七', value: 10 },
  { type: '分类八', value: 5 },
];

const data2 = [
  { city: 'a', gender: 'w', amount: 12 },
  { city: 'b', gender: 'w', amount: 14 },
  { city: 'b', gender: 'm', amount: 4 },
  { city: 'c', gender: 'w', amount: 18 },
];

const chartRuleConfigs = {
  'purpose-check': {
    weight: 0.5,
  },
  'nominal-enum-combinatorial': {
    off: true,
  },
  'series-qty-limit': {
    off: false,
    weight: 1,
    limit: 12,
  },
};
export function AutoChartTest() {
  return (
    <>
      <AutoChart data={data2} refine={false} title="custom" />
      <AutoChart data={pieData} chartRuleConfigs={chartRuleConfigs} refine={false} title="custom rule configs" />
      <AutoChart data={data} title="Design rule: 'x-axis-line-fading'" />
      {/* <AutoChart
        data={[
          {
            isOutlier: false,
            population: 391,
            revenue: 1164,
          },
          {
            isOutlier: true,
            population: 51,
            revenue: 250,
          },
        ]}
        purpose="Distribution"
      /> */}

      {/* <AutoChart
        data={[
          { f1: 'a', f2: 100 },
          { f1: 'b', f2: 300 },
          { f1: 'c', f2: 430 },
          { f1: 'd', f2: 630 },
        ]}
        title="expect: Column"
      /> */}

      <AutoChart
        data={[
          { f1: 'a', f2: 70 },
          { f1: 'b', f2: 120 },
          { f1: 'c', f2: 900 },
          { f1: 'd', f2: 630 },
        ]}
        title="expect: Pie"
      />

      {/* <AutoChart data={[]} title="测试" description="测试" /> */}

      {/* <AutoChart
        data={DataSamples.ForChartType('percent_stacked_bar_chart')}
        purpose="Proportion"
        title="expect: Percentage Stacked Bar"
      /> */}

      {/* <AutoChart data={DataSamples.ForChartType('line_chart')} title="expect: Line" />
      <AutoChart data={DataSamples.ForChartType('area_chart')} title="expect: Area" /> */}

      {/* <AutoChart data={DataSamples.ForChartType('area_chart')} title="expect: Area" config={{ type: 'StepLine' }} /> */}

      {/* <AutoChart
        data={[
          { f1: '2019-01', f2: 100 },
          { f1: '2019-02', f2: 300 },
          { f1: '2019-03', f2: 340 },
          { f1: '2019-04', f2: 630 },
        ]}
        title="try: Stacked Area"
        description="适合做 stacked area"
        config={{ configs: { xField: 'f1', yField: 'f2' }, type: 'StepLine' }}
      /> */}

      {/* <AutoChart data={DataSamples.ForChartType('pie_chart')} title="expect: Pie" />
      <AutoChart data={DataSamples.ForChartType('scatter_plot')} title="expect: Scatter" />
      <AutoChart data={DataSamples.ForChartType('bubble_chart')} title="expect: Bubble" /> */}

      {/* <AutoChart data={DataSamples.ForChartType('histogram')} title="expect: Histogram" /> */}
      {/* <AutoChart
        data={[
          { f1: 'a', f2: 100 },
          { f1: 'b', f2: 200 },
          { f1: 'c', f2: 300 },
          { f1: 'd', f2: 400 },
          { f1: 'e', f2: 630 },
        ]}
        title="expect: Rose"
        config={{ configs: { colorField: 'f1', categoryField: 'f1', radiusField: 'f2' }, type: 'Rose' }}
      /> */}
      {/* <AutoChart data={DataSamples.ForChartType('heatmap')} title="expect: Heatmap" />
      <AutoChart data={DataSamples.ForChartType('grouped_column_chart')} title="expect: Area" /> */}
    </>
  );
}
