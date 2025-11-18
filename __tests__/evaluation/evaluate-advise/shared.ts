import { loadDataset } from '../utils/loadDataset';
import { Advisor, Spec } from '../../../src';

export type TestData = {
  type: string;
  question: string;
  questionWithoutChart: string;
  answer: {
    type: string;
    data: Object[];
    [key: string]: any;
  };
  dataShards: Object[];
};

/**
 * 评测 advise 方法
 * @param selectQuestion 从 TestData 中选择问题的函数
 * @param isPass 检查评测是否通过
 */
export const runAdviseEvaluation = (
  selectQuestion: (data: TestData) => string,
  isPass: (spec: Spec, answer: TestData['answer']) => boolean
) => {
  jest.setTimeout(3600000);

  const advisor = new Advisor({
    llm: {
      appId: process.env.TBOX_APP_ID!,
      authorization: process.env.TBOX_AUTHORIZATION!,
    },
  });

  const evaluateChartAdvise = (chartId: string) => {
    const dataset = loadDataset(chartId);

    dataset.forEach((data: TestData, i: number) => {
      it(`evaluate ${chartId} case ${i}`, async () => {
        console.log(`evaluate ${chartId} case ${i}`);
        const { answer } = data;
        const question = selectQuestion(data);
        const dataShards = await advisor.extract(question);
        const advises = await advisor.advise(dataShards);
        const { spec } = advises?.[0]?.charts?.[0] || {};
        const success = isPass(spec, answer);
        expect(success).toEqual(true);
      });
    });
  };

  const chartIds = [
    'area',
    'bar',
    'boxplot',
    'column',
    'dual-axes',
    'fishbone-diagram',
    'flow-diagram',
    'funnel',
    'histogram',
    'indented-tree',
    'line',
    'liquid',
    'mind-map',
    'network-graph',
    'organization-chart',
    'pie',
    'radar',
    'sankey',
    'scatter',
    'table',
    'treemap',
    'venn',
    'violin',
    'word-cloud',
  ];

  describe('evaluation advise', () => {
    chartIds.forEach(evaluateChartAdvise);
  });
};
