import React from 'react';

import { Line, Area, Column, Bar, Pie, DualAxes, Radar } from '@antv/gpt-vis';
import { CHART_NAME, CHART_PURPOSE, DEFAULT_UI_CONFIG, ENCODE_TO_GPT_VIS_ENCODE } from '@antv/ava';
import { logInDev } from '@ava/utils';

import { transMetasToMap } from './utils';

import type { DataTypeMap, RenderParams } from '@antv/ava';
import type { RenderChartParams } from './types';

const getCommonStyle = (uiConfig: RenderParams['uiConfig'] = {}) => {
  return {
    backgroundColor: uiConfig.backgroundColor || DEFAULT_UI_CONFIG.backgroundColor,
    ...(uiConfig.palette
      ? {
          palette: uiConfig.palette,
        }
      : {}),
  };
};

const getCommonConfig = <T extends keyof DataTypeMap>(
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
    uiConfig: params.uiConfig || {},
  };
};

export const CHART_RENDER_MAP = {
  [CHART_NAME.line]: (params: RenderChartParams) => {
    const { data, axisXTitle, axisYTitle, uiConfig } = getCommonConfig<CHART_PURPOSE.Trend>({
      ...params,
      category: CHART_PURPOSE.Trend,
    });
    return (
      <Line
        data={data}
        axisXTitle={axisXTitle}
        axisYTitle={axisYTitle}
        theme={uiConfig.theme || DEFAULT_UI_CONFIG.theme}
        containerStyle={{ height: 300 }}
        style={{
          lineWidth: uiConfig.lineWidth || DEFAULT_UI_CONFIG.lineWidth,
          ...getCommonStyle(uiConfig),
        }}
      />
    );
  },
  [CHART_NAME.area]: (params: RenderChartParams) => {
    const { data, axisXTitle, axisYTitle, uiConfig } = getCommonConfig<CHART_PURPOSE.Trend>({
      ...params,
      category: CHART_PURPOSE.Trend,
    });
    return (
      <Area
        data={data}
        axisXTitle={axisXTitle}
        axisYTitle={axisYTitle}
        theme={uiConfig.theme || DEFAULT_UI_CONFIG.theme}
        style={{
          lineWidth: uiConfig.lineWidth || DEFAULT_UI_CONFIG.lineWidth,
          ...getCommonStyle(uiConfig),
        }}
      />
    );
  },
  [CHART_NAME.column]: (params: RenderChartParams) => {
    const { data, axisXTitle, axisYTitle, uiConfig } = getCommonConfig<CHART_PURPOSE.Distribution>({
      ...params,
      category: CHART_PURPOSE.Distribution,
    });
    return (
      <Column
        data={data}
        stack={false}
        group
        axisXTitle={axisXTitle}
        axisYTitle={axisYTitle}
        theme={uiConfig.theme || DEFAULT_UI_CONFIG.theme}
        style={getCommonStyle(uiConfig)}
      />
    );
  },
  [CHART_NAME.bar]: (params: RenderChartParams) => {
    const { data, axisXTitle, axisYTitle, uiConfig } = getCommonConfig<CHART_PURPOSE.Distribution>({
      ...params,
      category: CHART_PURPOSE.Distribution,
    });
    return (
      <Bar
        data={data}
        stack={false}
        group
        axisXTitle={axisXTitle}
        axisYTitle={axisYTitle}
        theme={uiConfig.theme || DEFAULT_UI_CONFIG.theme}
        style={getCommonStyle(uiConfig)}
      />
    );
  },
  [CHART_NAME.pie]: (params: RenderChartParams) => {
    const { encode, data, uiConfig = {} } = params;
    const xFieldKey = encode.x[0];
    const yFieldKey = encode.y[0];
    const newXFieldKey = 'category';
    const newYFieldKey = 'value';
    const newData = data.map((item) => {
      return {
        [newXFieldKey]: item[xFieldKey],
        [newYFieldKey]: item[yFieldKey],
      };
    });

    return <Pie data={newData} theme={uiConfig.theme || DEFAULT_UI_CONFIG.theme} style={getCommonStyle(uiConfig)} />;
  },
  [CHART_NAME.dualAxes]: (params: RenderChartParams) => {
    const { encode, data, metasMap, uiConfig = {} } = params;
    const xFieldKey = encode.x[0];
    const y1FieldKey = encode.y[0];
    const y2FieldKey = encode.y2[0];
    const axisXTitle = metasMap[xFieldKey]?.name;
    const lineAxisYTitle = metasMap[y1FieldKey]?.name;
    const columnAxisYTitle = metasMap[y2FieldKey]?.name;
    const categories = [];
    const columnData = [];
    const lineData = [];
    data.forEach((item) => {
      categories.push(item[xFieldKey]);
      lineData.push(item[y1FieldKey] || 0);
      columnData.push(item[y2FieldKey] || 0);
    });

    return (
      <DualAxes
        categories={categories}
        series={[
          {
            type: 'line',
            data: lineData,
            axisYTitle: lineAxisYTitle,
          },
          {
            type: 'column',
            data: columnData,
            axisYTitle: columnAxisYTitle,
          },
        ]}
        axisXTitle={axisXTitle}
        theme={uiConfig.theme || DEFAULT_UI_CONFIG.theme}
        style={getCommonStyle(uiConfig)}
      />
    );
  },
  [CHART_NAME.radar]: (params: RenderChartParams) => {
    const { data, uiConfig } = getCommonConfig<CHART_PURPOSE.Comparison>({
      ...params,
      category: CHART_PURPOSE.Comparison,
    });
    return (
      <Radar
        data={data}
        theme={uiConfig.theme || DEFAULT_UI_CONFIG.theme}
        style={{
          lineWidth: uiConfig.lineWidth || DEFAULT_UI_CONFIG.lineWidth,
          ...getCommonStyle(uiConfig),
        }}
      />
    );
  },
  [CHART_NAME.spreadsheetPro]: (params: RenderChartParams) => {
    return <div>spreadsheetPro: unimplement: {JSON.stringify(params.metasMap)}</div>;
  },
  [CHART_NAME.treemap]: (_params: RenderChartParams) => {
    return <div>treemap</div>;
  },

  [CHART_NAME.graph]: (_params: RenderChartParams) => {
    return <div>graph</div>;
  },
};

export const renderChart = (params: RenderParams) => {
  const { chartConfig, data, metas, uiConfig = {} } = params;
  logInDev.debug('render chart: ', params);
  const { type, encode } = chartConfig;
  const metasMap = transMetasToMap(metas);
  const render = CHART_RENDER_MAP[type];
  if (render) {
    return render({
      encode,
      data,
      metasMap,
      uiConfig,
    });
  }

  return <div>无可渲染图表：{type}</div>;
};
