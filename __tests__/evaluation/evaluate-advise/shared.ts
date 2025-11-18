import { loadDataset } from '../loadDataset';
import { AVA, Spec } from '../../../src';
import { validateObject } from '../../../src/utils/validator';
import { CHARTS } from '../../../src/ckb';

type TestData = {
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

export const runAdviseEvaluation = (selectQuestion: (data: TestData) => string) => {
  jest.setTimeout(3600000);

  const advisor = new AVA({
    llm: {
      appId: process.env.TBOX_APP_ID!,
      authorization: process.env.TBOX_AUTHORIZATION!,
    },
  });

  const evaluateDatasets = (chartId: string) => {
    const datasets = loadDataset(chartId);
    const chartResults = [];

    datasets.forEach((data: TestData, i: number) => {
      it(`evaluate ${chartId} case ${i}`, async () => {
        const startTime = Date.now();
        console.log(`evaluate ${chartId} case ${i}`);
        const { answer } = data;
        const question = selectQuestion(data);
        let spec: Spec;
        try {
          const advises = await advisor.advise([]);
          spec = advises[0].charts[0].spec;
        } catch (error) {
          const endTime = Date.now();
          const executionTime = endTime - startTime;
          chartResults.push({
            testName: `evaluate ${chartId} case ${i}`,
            question,
            expectedAnswer: answer,
            actualSpec: null,
            status: 'failed',
            executionTime,
          });
          throw error;
        }

        const endTime = Date.now();
        const executionTime = endTime - startTime;
        const assertionsPass = spec !== undefined && spec?.type === answer.type;
        chartResults.push({
          testName: `evaluate ${chartId} case ${i}`,
          question,
          expectedAnswer: answer,
          actualSpec: spec,
          status: assertionsPass ? 'success' : 'failed',
          executionTime,
        });

        const { type, ...finalSpec } = spec;
        expect(spec).not.toEqual([]);
        expect(type).toEqual(answer.type);
        expect(validateObject(CHARTS[type].zodSchema, finalSpec)).toBe(true);
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
    chartIds.forEach(evaluateDatasets);
  });
};
