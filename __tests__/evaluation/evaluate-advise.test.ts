import { loadDataset } from './loadDataset';
import { Advisor } from '../../src';

jest.setTimeout(3600000); // 超时时间1小时，保障所有评测能跑完

const advisor = new Advisor({
  llm: {
    appId: process.env.TBOX_APP_ID!,
    authorization: process.env.TBOX_AUTHORIZATION!,
  },
});

const evaluateDatasets = (chartId: string) => {
  const datasets = loadDataset(chartId);
  it.each(datasets.map((data, i) => ({ ...data, index: i, chartId })))(
    'evaluate $chartId case $index',
    async ({ question, answer }) => {
      const dataShards = await advisor.extract(question);
      const advises = await advisor.advise(dataShards);
      const spec = advises[0].charts[0].spec;
      // TODO: 添加更多的校验规则
      expect(spec).not.toEqual([]);
      expect(spec.type).toEqual(answer.type);
    }
  );
};

describe('evaluation advise', () => {
  // evaluateDatasets('dual-axes');
  // evaluateDatasets('line');
  // evaluateDatasets('bar');
  // evaluateDatasets('pie');
  // evaluateDatasets('column');
  it('ass', () => {
    expect(true).toBeTruthy();
  });
});
