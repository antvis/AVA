import { CHART_NAME, CHART_PURPOSE, DEFAULT_UI_CONFIG, ENCODE_TO_GPT_VIS_ENCODE } from '../constants';
import { AdviseChart, Data, DataTypeMap, Meta, UiConfig } from '../types';
import { metasToMap } from '../utils';

type Params = {
  encode: AdviseChart['encode'];
  data: Data;
  metasMap: Record<string, Meta>;
  uiConfig?: UiConfig;
};

const getChartStyle = (uiConfig: UiConfig = {}) => {
  return {
    backgroundColor: uiConfig.backgroundColor || DEFAULT_UI_CONFIG.backgroundColor,
    ...(uiConfig.palette
      ? {
          palette: uiConfig.palette,
        }
      : {}),
  };
};

const getChartSpec = <T extends keyof DataTypeMap>(
  params: Params & {
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

export const SPEC_GENERATOR_MAP = {
  [CHART_NAME.line]: (params: Params) => {
    const { data, axisXTitle, axisYTitle, uiConfig } = getChartSpec<CHART_PURPOSE.Trend>({
      ...params,
      category: CHART_PURPOSE.Trend,
    });
    return {
      data,
      axisXTitle,
      axisYTitle,
      theme: uiConfig.theme || DEFAULT_UI_CONFIG.theme,
      style: {
        lineWidth: uiConfig.lineWidth || DEFAULT_UI_CONFIG.lineWidth,
        ...getChartStyle(uiConfig),
      },
    };
  },
  [CHART_NAME.area]: (params: Params) => {
    const { data, axisXTitle, axisYTitle, uiConfig } = getChartSpec<CHART_PURPOSE.Trend>({
      ...params,
      category: CHART_PURPOSE.Trend,
    });
    return {
      data,
      axisXTitle,
      axisYTitle,
      theme: uiConfig.theme || DEFAULT_UI_CONFIG.theme,
      style: {
        lineWidth: uiConfig.lineWidth || DEFAULT_UI_CONFIG.lineWidth,
        ...getChartStyle(uiConfig),
      },
    };
  },
  [CHART_NAME.column]: (params: Params) => {
    const { data, axisXTitle, axisYTitle, uiConfig } = getChartSpec<CHART_PURPOSE.Distribution>({
      ...params,
      category: CHART_PURPOSE.Distribution,
    });
    return {
      data,
      stack: false,
      group: true,
      axisXTitle,
      axisYTitle,
      theme: uiConfig.theme || DEFAULT_UI_CONFIG.theme,
      style: getChartStyle(uiConfig),
    };
  },
  [CHART_NAME.bar]: (params: Params) => {
    const { data, axisXTitle, axisYTitle, uiConfig } = getChartSpec<CHART_PURPOSE.Distribution>({
      ...params,
      category: CHART_PURPOSE.Distribution,
    });
    return {
      data,
      stack: false,
      group: true,
      axisXTitle,
      axisYTitle,
      theme: uiConfig.theme || DEFAULT_UI_CONFIG.theme,
      style: getChartStyle(uiConfig),
    };
  },
  [CHART_NAME.pie]: (params: Params) => {
    const { encode, data, uiConfig = {} } = params;
    const sFieldKey = encode.s[0];
    const valueFieldKey = encode.value[0];
    const newXFieldKey = 'category';
    const newYFieldKey = 'value';
    const newData = data.map((item) => {
      return {
        [newXFieldKey]: item[sFieldKey],
        [newYFieldKey]: item[valueFieldKey],
      };
    });
    return {
      data: newData,
      theme: uiConfig.theme || DEFAULT_UI_CONFIG.theme,
      style: getChartStyle(uiConfig),
    };
  },
  [CHART_NAME.dualAxes]: (params: Params) => {
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
    return {
      categories,
      series: [
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
      ],
      axisXTitle,
      theme: uiConfig.theme || DEFAULT_UI_CONFIG.theme,
      style: getChartStyle(uiConfig),
    };
  },
  [CHART_NAME.radar]: (params: Params) => {
    const { data, uiConfig } = getChartSpec<CHART_PURPOSE.Comparison>({
      ...params,
      category: CHART_PURPOSE.Comparison,
    });
    return {
      data,
      theme: uiConfig.theme || DEFAULT_UI_CONFIG.theme,
      style: {
        lineWidth: uiConfig.lineWidth || DEFAULT_UI_CONFIG.lineWidth,
        ...getChartStyle(uiConfig),
      },
    };
  },
  [CHART_NAME.spreadsheetPro]: (_params: Params) => {
    return null;
  },
  [CHART_NAME.treemap]: (_params: Params) => {
    return null;
  },
  [CHART_NAME.graph]: (_params: Params) => {
    return null;
  },
};

export const metaToSpec = (params: {
  encode: AdviseChart['encode'];
  type: CHART_NAME;
  metas: Meta[];
  data: Data;
  uiConfig?: UiConfig;
}) => {
  const { encode, type, data, metas, uiConfig = {} } = params;
  const metasMap = metasToMap(metas);
  const specGenerator = SPEC_GENERATOR_MAP[type];
  return specGenerator({
    encode,
    data,
    metasMap,
    uiConfig,
  });
};
