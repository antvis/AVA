import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AutoChart from './auto-chart';
// import { DataSamples } from './data-samples';
class App extends React.Component {
  render() {
    const data = [
      {
        x: 901,
        y: 112,
        z: 999,
      },
      {
        x: 23,
        y: 16,
        z: 633,
      },
      {
        x: 403,
        y: 533,
        z: 202,
      },
      {
        x: 451,
        y: 492,
        z: 637,
      },
      {
        x: 714,
        y: 757,
        z: 536,
      },
      {
        x: 236,
        y: 478,
        z: 702,
      },
      {
        x: 102,
        y: 646,
        z: 546,
      },
      {
        x: 828,
        y: 436,
        z: 36,
      },
      {
        x: 13,
        y: 377,
        z: 304,
      },
      {
        x: 351,
        y: 155,
        z: 325,
      },
      {
        x: 269,
        y: 31,
        z: 550,
      },
      {
        x: 46,
        y: 640,
        z: 79,
      },
      {
        x: 211,
        y: 999,
        z: 463,
      },
      {
        x: 666,
        y: 864,
        z: 958,
      },
      {
        x: 503,
        y: 340,
        z: 214,
      },
      {
        x: 123,
        y: 66,
        z: 214,
      },
      {
        x: 328,
        y: 545,
        z: 83,
      },
      {
        x: 404,
        y: 329,
        z: 519,
      },
      {
        x: 975,
        y: 506,
        z: 679,
      },
      {
        x: 76,
        y: 789,
        z: 383,
      },
      {
        x: 263,
        y: 424,
        z: 928,
      },
      {
        x: 618,
        y: 663,
        z: 732,
      },
      {
        x: 386,
        y: 938,
        z: 77,
      },
      {
        x: 745,
        y: 452,
        z: 592,
      },
      {
        x: 970,
        y: 14,
        z: 819,
      },
      {
        x: 252,
        y: 158,
        z: 232,
      },
      {
        x: 515,
        y: 823,
        z: 684,
      },
      {
        x: 255,
        y: 79,
        z: 662,
      },
      {
        x: 109,
        y: 772,
        z: 423,
      },
      {
        x: 996,
        y: 910,
        z: 265,
      },
    ];
    const config = {
      type: 'Bubble',
      configs: {
        title: {
          text: '气泡图',
        },
        description: {
          text: '一个简单的气泡图',
        },
        xAxis: {
          visible: false,
        },
        yAxis: {
          visible: false,
        },
        pointSize: [8, 60],
        xField: 'x',
        yField: 'y',
        sizeField: 'z',
        color: ['#5B8FF9'],
      },
    };

    return (
      <>
        {/* <AutoChart
          data={[
            { f1: '2019-01', f2: 100 },
            { f1: '2019-02', f2: 300 },
            { f1: '2019-03', f2: 340 },
            { f1: '2019-04', f2: 630 },
          ]}
          config={{
            configs: {
              title: { text: 'expect: Line' },
              yAxis: { visible: false },
              smooth: true,
              lineSize: 5,
              xField: 'f1',
              yField: 'f2',
            },
            type: 'Line',
          }}
          title="expect: Line"
        /> */}

        {/* <AutoChart
          data={[
            { f1: 'a', f2: 100 },
            { f1: 'b', f2: 300 },
            { f1: 'c', f2: 340 },
            { f1: 'd', f2: 630 },
          ]}
          title="expect: Column"
        />

        <AutoChart
          data={[
            { f1: 'a', f2: 70 },
            { f1: 'b', f2: 120 },
            { f1: 'c', f2: 900 },
            { f1: 'd', f2: 630 },
          ]}
          title="expect: Pie"
        /> */}

        <AutoChart data={data} config={config} title="测试" description="测试" />

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
}

export default App;
