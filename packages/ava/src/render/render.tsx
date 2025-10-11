import React from 'react';

import { Line, Area, Column, Bar } from '@antv/gpt-vis';

import { transMetasToMap } from '@ava/advisor/chartAdvise';
import { AdviseChart, Data, Meta, DataTypeMap, RenderParams } from '@ava/types';
import { CHART_NAME, ENCODE_TO_GPT_VIS_ENCODE } from '@ava/constants';

type RenderChartParams = { encode: AdviseChart['encode']; data: Data; metasMap: Record<string, Meta> };

const getTrendOrDistributionSpec = <T extends keyof DataTypeMap>(
  params: RenderChartParams & {
    category: T;
  }
) => {
  const { encode, data, metasMap, category } = params;
  const newEncode = ENCODE_TO_GPT_VIS_ENCODE[category];
  const xFieldKey = encode.x[0];
  const yFieldKey = encode.y[0];
  const sFieldKey = encode.s?.[0];
  const newXFieldKey = newEncode.x;
  const newYFieldKey = newEncode.y;
  const newSFieldKey = newEncode.s;
  const axisXTitle = metasMap[xFieldKey]?.name;
  const axisYTitle = metasMap[yFieldKey]?.name;
  const newData = data.map((item) => {
    return {
      [newXFieldKey]: item[xFieldKey],
      [newYFieldKey]: item[yFieldKey],
      ...(newSFieldKey && sFieldKey ? { [newSFieldKey]: item[sFieldKey] } : {}),
    };
  }) as DataTypeMap[T];

  return {
    data: newData,
    axisXTitle,
    axisYTitle,
  };
};

export const CHART_RENDER_MAP = {
  [CHART_NAME.line]: (params: RenderChartParams) => {
    const { data, axisXTitle, axisYTitle } = getTrendOrDistributionSpec<'TREND'>({ ...params, category: 'TREND' });
    return (
      <Line
        data={data}
        axisXTitle={axisXTitle}
        axisYTitle={axisYTitle}
        theme="default"
        containerStyle={{ height: 300 }}
        style={{
          lineWidth: 2,
          backgroundColor: '#fff',
        }}
      />
    );
  },
  [CHART_NAME.area]: (params: RenderChartParams) => {
    const { data, axisXTitle, axisYTitle } = getTrendOrDistributionSpec<'TREND'>({ ...params, category: 'TREND' });
    return (
      <Area
        data={data}
        axisXTitle={axisXTitle}
        axisYTitle={axisYTitle}
        theme="default"
        containerStyle={{ height: 300 }}
        style={{
          lineWidth: 2,
          backgroundColor: '#fff',
        }}
      />
    );
  },
  [CHART_NAME.column]: (params: RenderChartParams) => {
    const { data, axisXTitle, axisYTitle } = getTrendOrDistributionSpec<'DISTRIBUTION'>({
      ...params,
      category: 'DISTRIBUTION',
    });
    return (
      <Column
        data={data}
        stack={false}
        group
        axisXTitle={axisXTitle}
        axisYTitle={axisYTitle}
        theme="default"
        containerStyle={{ height: 300 }}
        style={{
          backgroundColor: '#fff',
        }}
      />
    );
  },
  [CHART_NAME.bar]: (params: RenderChartParams) => {
    const { data, axisXTitle, axisYTitle } = getTrendOrDistributionSpec<'DISTRIBUTION'>({
      ...params,
      category: 'DISTRIBUTION',
    });
    return (
      <Bar
        data={data}
        stack={false}
        group
        axisXTitle={axisXTitle}
        axisYTitle={axisYTitle}
        theme="default"
        containerStyle={{ height: 300 }}
        style={{
          backgroundColor: '#fff',
        }}
      />
    );
  },
};

export const renderChart = (params: RenderParams) => {
  const { chartConfig, data, metas } = params;
  const { type, encode } = chartConfig;
  const metasMap = transMetasToMap(metas);
  const render = CHART_RENDER_MAP[type];
  return render({
    encode,
    data,
    metasMap,
  });
};
