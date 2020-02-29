import { CKBJson, addChart } from '../src/pack';
import { ChartKnowledge } from '../src/interface';
import { TransKnowledgeProps } from '../src/i18n/interface';
import { Language } from '../src/i18n';

test('PACK', () => {
  const ckb1 = CKBJson();
  const keys1 = Object.keys(ckb1);
  const values1 = Object.values(ckb1);
  expect(keys1.length).toBe(79);
  expect(keys1.includes('nested_pie_chart')).toBe(true);
  expect(values1.find((e) => e.name === '饼图')).toBe(undefined);

  const ckb2 = CKBJson(undefined, true);
  const keys2 = Object.keys(ckb2);
  expect(keys2.length).toBe(47);
  expect(keys2.includes('nested_pie_chart')).toBe(false);

  const ckb3 = CKBJson('zh-CN', true);
  const values3 = Object.values(ckb3);
  expect(values3.find((e) => e.name === '饼图') != undefined).toBe(true);

  const ckb4 = CKBJson('zh-CN');
  const values4 = Object.values(ckb4);
  expect(values4.find((e) => e.name === '水波图')).toBe(undefined);

  const liquid_diagram = {
    id: 'liquid_diagram',
    name: 'Liquid Diagram',
    alias: ['Liquid Chart'],
    family: ['Others'],
    def: 'A liquid diagram is a infographic for presenting progress.',
    purpose: ['Comparison'],
    coord: [],
    category: ['Diagram'],
    shape: ['Lines'],
    dataPres: [{ minQty: 1, maxQty: 1, fieldConditions: ['Interval'] }],
    channel: ['Position'],
  };

  const liquid_diagram_trans = {
    name: '水波图',
    alias: ['水波球', '进度球'],
    def: '水波图是一种用球形容器和其中的水平线位置来表示进度的示意图。',
  };

  addChart(
    liquid_diagram as ChartKnowledge,
    { 'zh-CN': liquid_diagram_trans } as Record<Language, TransKnowledgeProps>
  );

  const ckb5 = CKBJson('zh-CN');
  const values5 = Object.values(ckb5);
  expect(values5.find((e) => e.name === '水波图') != undefined).toBe(true);
});
