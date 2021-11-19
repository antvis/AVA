import { CKBJson, addChart } from '../src/pack';
import { ChartKnowledge } from '../src/interface';
import { TransKnowledgeProps } from '../src/i18n/interface';
import { Language } from '../src/i18n';

test('PACK', () => {
  const ckb1 = CKBJson();
  const keys1 = Object.keys(ckb1);
  const values1 = Object.values(ckb1);
  expect(keys1.length).toBe(80);
  expect(keys1.includes('nested_pie_chart')).toBe(true);
  expect(values1.find((e) => e.name === '饼图')).toBe(undefined);

  const ckb2 = CKBJson(undefined, true);
  const keys2 = Object.keys(ckb2);
  expect(keys2.length).toBe(52);
  expect(keys2.includes('nested_pie_chart')).toBe(false);

  const ckb3 = CKBJson('zh-CN', true);
  const values3 = Object.values(ckb3);
  expect(values3.find((e) => e.name === '饼图') !== undefined).toBe(true);

  const ckb4 = CKBJson('zh-CN');
  const values4 = Object.values(ckb4);
  expect(values4.find((e) => e.name === '步茗图')).toBe(undefined);

  const neoDiagram = {
    id: 'neo_diagram',
    name: 'Neo Diagram',
    alias: ['Neo Chart'],
    family: ['Others'],
    def: 'A magic chart invented by Neo.',
    purpose: ['Comparison'],
    coord: [],
    category: ['Diagram'],
    shape: ['Lines'],
    dataPres: [{ minQty: 1, maxQty: 1, fieldConditions: ['Interval'] }],
    channel: ['Position'],
    recRate: 'Not Recommend',
  };

  const neoDiagramTrans = {
    name: '步茗图',
    alias: ['Neo图'],
    def: '步茗发明的图。',
  };

  addChart(neoDiagram as ChartKnowledge, { 'zh-CN': neoDiagramTrans } as Record<Language, TransKnowledgeProps>);

  const ckb5 = CKBJson('zh-CN');
  const values5 = Object.values(ckb5);
  expect(values5.find((e) => e.name === '步茗图') !== undefined).toBe(true);
});
