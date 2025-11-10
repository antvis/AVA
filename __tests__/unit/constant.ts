import { PURPOSE } from '../../src/constants';
import { COLUMN_TYPE, DATA_SHAPE } from '../../src/types';

export const OPENAI_LLM = { url: '', model: '', apiKey: '' };

export const COMPARISON_DATA = {
  shard: {
    shape: DATA_SHAPE.PLAIN,
    data: [
      { category: 'A', count: 10 },
      { category: 'B', count: 20 },
      { category: 'C', count: 15 },
    ],
    metas: [
      {
        id: 'category',
        name: 'category',
        dataType: COLUMN_TYPE.string,
      },
      {
        id: 'count',
        name: 'count',
        dataType: COLUMN_TYPE.number,
      },
    ],
    purpose: {
      name: 'count',
      key: 'count',
      purpose: PURPOSE.COMPARISON,
      purposeDesc: '比较不同类别的数量差异',
    },
  },
  spec: {
    data: [
      { category: 'A', value: 10 },
      { category: 'B', value: 20 },
      { category: 'C', value: 15 },
    ],
    group: true,
    stack: false,
    theme: 'default',
    style: {
      texture: 'default',
    },
    width: 600,
    height: 400,
    title: 'Category Distribution',
    axisXTitle: 'Category',
    axisYTitle: 'Count',
  },
};

export const TREND_DATA = {
  shard: {
    shape: DATA_SHAPE.PLAIN,
    data: [
      { date: '1999', value: 9 },
      { date: '2000', value: 2 },
      { date: '2001', value: 3 },
      { date: '2002', value: 5 },
      { date: '2003', value: 9 },
    ],
    metas: [
      {
        id: 'date',
        name: 'date',
        dataType: COLUMN_TYPE.string,
      },
      {
        id: 'value',
        name: 'value',
        dataType: COLUMN_TYPE.number,
      },
    ],
    purpose: {
      name: 'value',
      key: 'value',
      purpose: PURPOSE.TREND,
      purposeDesc: '展示value随时间变化的趋势',
    },
  },
  spec: {
    data: [
      { time: '1999', value: 9 },
      { time: '2000', value: 2 },
      { time: '2001', value: 3 },
      { time: '2002', value: 5 },
      { time: '2003', value: 9 },
    ],
    theme: 'default',
    style: {
      texture: 'default',
    },
    width: 600,
    height: 400,
    title: 'Value over Time',
    axisXTitle: 'Date',
    axisYTitle: 'Value',
  },
  advise: [],
};

export const SINGLE_DATA_SHARD = [TREND_DATA.shard];
export const MULTI_DATA_SHARDS = [TREND_DATA.shard, COMPARISON_DATA.shard];
