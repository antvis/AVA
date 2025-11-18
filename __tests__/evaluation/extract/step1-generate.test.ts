import _ from 'lodash';
import fs from 'fs';
import { Advisor } from '../../../src/advisor';
import { sleep } from '../utils';
import { loadAllData } from '../loadDataset';
import winston from 'winston';
import { GENRATE_ERROR_LOG_PATH, GENRATE_RESULT_LOG_PATH } from './constants';

const excludes = [
  'flow-diagram',
  'fishbone-diagram',
  'indented-tree',
  'mind-map',
  'network-graph',
  'organization-chart',
];

const logger = winston.createLogger({
  format: winston.format.json(),
  defaultMeta: { service: 'evaluate-service' },
  transports: [
    new winston.transports.File({ filename: GENRATE_ERROR_LOG_PATH, level: 'error' }),
    new winston.transports.File({ filename: GENRATE_RESULT_LOG_PATH, level: 'info' }),
  ],
});

// 通过 API 生成抽取结果
describe('generate extract result', () => {
  const advisor = new Advisor({
    llm: {
      authorization: process.env.TBOX_LLM_AUTH || '',
      appId: process.env.TBOX_LLM_APP_ID || '',
    },
  });

  // remove old log file
  if (fs.existsSync(GENRATE_ERROR_LOG_PATH)) {
    fs.rmSync(GENRATE_ERROR_LOG_PATH);
  }

  if (fs.existsSync(GENRATE_RESULT_LOG_PATH)) {
    fs.rmSync(GENRATE_RESULT_LOG_PATH);
  }

  const EVALUATE_CASES = loadAllData(excludes);
  const EVALUATE_CASES_PLAIN = EVALUATE_CASES.reduce((pre, cur) => {
    return [...pre, ...cur.data.map((v, index) => ({ ...v, key: cur.key, index }))];
  }, []);

  const total = EVALUATE_CASES_PLAIN.length;
  let success = 0;

  const generateCase = async (currentCase) => {
    const result = await advisor.extract(currentCase.question);
    if (!result || !result?.length) {
      logger.error({
        input: currentCase.question,
      });
    } else {
      success++;
      logger.info({
        generate: result,
        source: currentCase.dataShards,
        input: currentCase.question,
      });
    }
    await sleep(3000);
  };

  const generateAll = async (cases) => {
    it.each(cases)(
      `test $key-$index:$question`,
      async (currentCase) => {
        await generateCase(currentCase);
      },
      300000
    );
  };

  generateAll(EVALUATE_CASES_PLAIN);

  it('expect extract invoke success rate >= 95%', () => {
    expect(success / total).toBeGreaterThanOrEqual(0.95);
  });
});
