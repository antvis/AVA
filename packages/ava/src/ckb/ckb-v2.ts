import { StatisticsFeatureKey, ChartLibrary, Operator } from '@ava/types';

const LINE_MAX_SPLIT_COUNT = 40;
const BAR_MAX_SPLIT_COUNT = 100;
const PIE_MAX_SPLIT_COUNT = 50;
const FUNNEL_CHART_MAX_SPLIT_COUNT = 10;
const RADAR_CHART_MAX_SPLIT_COUNT = 10;
const SPREAD_SHEET_PRO_SPLIT_COUNT = 100;

export const CKB: ChartLibrary = {
  line: {
    chartName: '折线图',
    fields: {
      x: { min: 1, max: 1, dataType: ['date'], desc: 'x轴', optional: false },
      y: { min: 1, max: 8, dataType: ['number'], desc: 'y轴', optional: false },
      s: {
        min: 0,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '分组',
        optional: true,
      },
    },
    limits: {
      [StatisticsFeatureKey.distinctCount]: {
        number: LINE_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['s'],
          measure: ['y'],
        },
        reason: `维值拆分数量超出${LINE_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  column: {
    chartName: '柱形图',
    fields: {
      x: {
        min: 1,
        max: 1,
        dataType: ['string', 'date', 'geo'],
        desc: 'x轴',
        optional: false,
      },
      y: { min: 1, max: 8, dataType: ['number'], desc: 'y轴', optional: false },
      s: {
        min: 0,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '分组',
        optional: true,
      },
    },
    limits: {
      distinctCount: {
        number: BAR_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x', 's'],
          measure: ['y'],
        },
        reason: `维值拆分数量超出${BAR_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  pie: {
    chartName: '饼图',
    fields: {
      x: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '切片',
        optional: false,
      },
      y: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '数值',
        optional: false,
      },
    },
    limits: {
      distinctCount: {
        number: PIE_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x'],
        },
        reason: `切片数量超出${PIE_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  bar: {
    chartName: '条形图',
    fields: {
      x: {
        min: 1,
        max: 1,
        dataType: ['string', 'date', 'geo'],
        desc: 'x轴',
        optional: false,
      },
      y: { min: 1, max: 8, dataType: ['number'], desc: 'y轴', optional: false },
      s: {
        min: 0,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '分组',
        optional: true,
      },
    },
    limits: {
      distinctCount: {
        number: BAR_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x', 's'],
          measure: ['y'],
        },
        reason: `维值拆分数量超出${BAR_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  area: {
    chartName: '面积图',
    fields: {
      x: { min: 1, max: 1, dataType: ['date'], desc: 'x轴', optional: false },
      y: { min: 1, max: 8, dataType: ['number'], desc: 'y轴', optional: false },
      s: {
        min: 0,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '分组',
        optional: true,
      },
    },
    limits: {
      distinctCount: {
        number: LINE_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['s'],
          measure: ['y'],
        },
        reason: `维值拆分数量超出${LINE_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  scatter: {
    chartName: '散点图',
    fields: {
      y: { min: 1, max: 1, dataType: ['number'], desc: 'x轴', optional: false },
      y2: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: 'y轴',
        optional: false,
      },
      color: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '颜色',
        optional: false,
      },
      size: {
        min: 0,
        max: 1,
        dataType: ['string', 'number'],
        desc: '大小',
        optional: true,
      },
    },
  },
  multiple: {
    chartName: '双轴图',
    fields: {
      x: {
        min: 1,
        max: 1,
        dataType: ['date', 'string'],
        desc: 'x轴',
        optional: false,
      },
      y: {
        min: 1,
        max: 8,
        dataType: ['number'],
        desc: '左y轴',
        optional: false,
      },
      y2: {
        min: 1,
        max: 8,
        dataType: ['number'],
        desc: '右y轴',
        optional: false,
      },
    },
  },
  kpiChart: {
    chartName: '指标卡',
    fields: {
      y: {
        min: 1,
        max: 20,
        dataType: ['number'],
        desc: '指标',
        optional: false,
      },
    },
  },
  spreadsheetPro: {
    chartName: '交叉表',
    fields: {
      x: {
        min: 1,
        max: 8,
        dataType: ['string', 'date', 'geo'],
        desc: '行头',
        optional: false,
      },
      x2: {
        min: 0,
        max: 8,
        dataType: ['string', 'date', 'geo'],
        desc: '列头',
        optional: false,
      },
      y: {
        min: 1,
        max: 8,
        dataType: ['number'],
        desc: '数值',
        optional: false,
      },
    },
    limits: {
      distinctCount: {
        number: SPREAD_SHEET_PRO_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x2'],
          measure: ['y'],
        },
        reason: `单元格数量超出${SPREAD_SHEET_PRO_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  funnel: {
    chartName: '漏斗图',
    fields: {
      x: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '分段',
        optional: false,
      },
      y: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '指标',
        optional: false,
      },
    },
    limits: {
      distinctCount: {
        number: FUNNEL_CHART_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x'],
        },
        reason: `分段数量超出${FUNNEL_CHART_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  sankey: {
    chartName: '桑基图',
    fields: {
      source: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '来源',
        optional: false,
      },
      target: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '去向',
        optional: false,
      },
      value: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '数值',
        optional: false,
      },
    },
  },
  radar: {
    chartName: '雷达图',
    fields: {
      x: {
        min: 1,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '维度',
        optional: false,
      },
      y: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '指标',
        optional: false,
      },
      s: {
        min: 0,
        max: 1,
        dataType: ['string', 'geo'],
        desc: '拆分',
        optional: true,
      },
    },
    limits: {
      distinctCount: {
        number: RADAR_CHART_MAX_SPLIT_COUNT,
        operator: Operator.LessThan,
        params: {
          category: ['x'],
        },
        reason: `指标数量超出${RADAR_CHART_MAX_SPLIT_COUNT}，降低权重`,
      },
    },
  },
  progress: {
    chartName: '进度条',
    fields: {
      y: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '当前值',
        optional: false,
      },
      target: {
        min: 1,
        max: 1,
        dataType: ['number'],
        desc: '字段型目标值',
        optional: false,
      },
    },
  },
  table: {
    chartName: '普通表格',
    fields: {
      row: {
        min: 1,
        max: 100,
        dataType: ['string', 'geo', 'number', 'date'],
        desc: '列头',
        optional: false,
      },
    },
  },
};
