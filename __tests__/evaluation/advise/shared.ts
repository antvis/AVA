import winston from 'winston';
import fs from 'fs';
import { loadDataset } from '../utils/load-dataset';
import { AVA, Spec } from '../../../src';

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
  isPass: (spec: Spec, answer: TestData['answer']) => boolean,
  loggerPath?: {
    info?: string;
    error?: string;
  }
) => {
  jest.setTimeout(3600000);

  const errorLogPath = loggerPath?.error || '__tests__/evaluation/advise/error.jsonl';
  const infoLogPath = loggerPath?.info || '__tests__/evaluation/advise/info.jsonl';

  // remove old log file
  if (fs.existsSync(errorLogPath)) {
    fs.rmSync(errorLogPath);
  }
  if (fs.existsSync(infoLogPath)) {
    fs.rmSync(infoLogPath);
  }

  const logger = winston.createLogger({
    format: winston.format.json(),
    defaultMeta: { service: 'evaluate-service' },
    transports: [
      new winston.transports.File({ filename: errorLogPath, level: 'error' }),
      new winston.transports.File({ filename: infoLogPath, level: 'info' }),
    ],
  });

  const ava = new AVA({
    llm: {
      appId: process.env.TBOX_LLM_APP_ID!,
      authorization: process.env.TBOX_LLM_AUTH!,
    },
  });

  const evaluateChartAdvise = async (chartId: string) => {
    const dataset = loadDataset(chartId);

    const promises = dataset.map((data: TestData, i: number) => {
      return new Promise((resolve) => {
        it(`evaluate ${chartId} case ${i}`, async () => {
          console.log(`evaluate ${chartId} case ${i}`);
          const { answer } = data;
          const question = selectQuestion(data);
          let dataShards = [];
          try {
            dataShards = await ava.extract(question);
          } catch (e) {
            logger.error({
              msg: 'extract error',
              input: question,
            });
          }
          if (dataShards.length === 0) {
            logger.error({
              msg: 'extract empty',
              input: question,
            });
            resolve(null);
            return;
          }
          try {
            const advises = await ava.advise(dataShards);
            const { spec } = advises?.[0]?.charts?.[0] || {};
            logger.info({
              msg: 'advise success',
              input: question,
              dataShards,
              output: spec,
              source: answer,
            });
          } catch (e) {
            logger.error({
              msg: 'advise error',
              input: question,
            });
          }
          resolve(null);
        });
      });
    });

    await Promise.all(promises);

    it('evaluate pass rate should >= 0.95', () => {
      const data = fs.readFileSync(loggerPath?.info);
      const lines = data
        .toString()
        .split('\n')
        .filter((v) => !!v.length);
      const passCount = lines.filter((line) => {
        try {
          const log = JSON.parse(line);
          return isPass(log.spec, log.source);
        } catch (e) {
          return false;
        }
      }).length;
      console.log('pass rate: ', passCount / lines.length);
      expect(passCount / lines.length).toBeGreaterThanOrEqual(0.95);
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
