import * as React from 'react';
import AutoChart from './auto-chart';
// import { DataSamples } from './data-samples';

export function AutoChartTest() {
  return (
    <>
      <AutoChart
        data={[
          { f1: '2019-01', f2: 100 },
          { f1: '2019-02', f2: 300 },
          { f1: '2019-03', f2: 340 },
          { f1: '2019-04', f2: 630 },
        ]}
        title="expect: Line"
      />

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

      {/* <AutoChart
        data={[
          { f1: 'a', f2: 70 },
          { f1: 'b', f2: 120 },
          { f1: 'c', f2: 900 },
          { f1: 'd', f2: 630 },
        ]}
        title="expect: Pie"
      /> */}

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
