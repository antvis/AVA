import { loadDataset } from './loadDataset';
import { Advisor } from '../../src';

jest.setTimeout(30000000);

const advisor = new Advisor({
  llm: {
    appId: process.env.TBOX_APP_ID!,
    authorization: process.env.TBOX_AUTHORIZATION!,
  },
});

const evaluateDatasets = (chartId: string) => {
  const datasets = loadDataset(chartId);
  for (let i = 0; i < datasets.length; i++) {
    it(`evaluate ${chartId} case ${i}`, async () => {
      console.log(`evaluate ${chartId} case ${i}`);
      const data = datasets[i];
      const { question, answer } = data;
      const dataShards = await advisor.extract(question);
      const advises = await advisor.advise(dataShards);
      const spec = advises[0].charts[0].spec;
      // TODO: 添加更多的校验规则
      expect(spec).not.toEqual([]);
      expect(spec.type).toEqual(answer.type);
    });
  }
};

describe('evaluation advise', () => {
  evaluateDatasets('dual-axes');
  evaluateDatasets('line');
  evaluateDatasets('bar');
  evaluateDatasets('pie');
  evaluateDatasets('column');
});
