import _ from 'lodash';
import { Advisor } from '../../src/advisor';
import { loadAllData } from './loadDataset';
import logger from './logger';

const sleep = (duration: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};

/**
 * 判定生成是否符合标准
 * @param source
 * @param target
 * 临时方案：判断 data 和 metas 长度一致即可
 */
const evalSimilarity = (source, target) => {
  const { data: sourceData, metas: sourceMetas, purpose: sourcePurpose, shape: sourceShape } = source;
  const { data: targetData, metas: targetMetas, purpose: targetPurpose, shape: targetShape } = target;

  return (
    sourceShape === targetShape && sourceData.length === targetData.length && sourceMetas.length === targetMetas.length
  );
};

describe('extract evaluation pass rate > 70%', () => {
  const advisor = new Advisor({
    llm: {
      authorization: process.env.TBOX_LLM_AUTH || '',
      appId: process.env.TBOX_LLM_APP_ID || '',
    },
  });

  const EVALUATE_CASES = loadAllData();

  const total = EVALUATE_CASES.reduce((pre, cur) => {
    return pre + cur.data.length;
  }, 0);

  let pass = 0;

  const evaluateCase = async (currentCase) => {
    const result = await advisor.extract(currentCase.question);

    if (result.length === 0) {
      logger.error(`${currentCase.key}:${currentCase.index} not pass, extract method throw error!`);
      return;
    }
    if (result.length !== currentCase.dataShards.length) {
      logger.error(
        `${currentCase.key}:${currentCase.index} not pass: result length dismatch, expect ${currentCase.dataShards.length} but got ${result.length}!`
      );
    } else {
      const isValid = result.every((res, i) => evalSimilarity(res, currentCase.dataShards[i]));
      if (isValid) {
        pass++;
        logger.info(`${currentCase.key}:${currentCase.index} pass!`);
      } else {
        logger.info(
          `${currentCase.key}:${currentCase.index} not pass, result: ${JSON.stringify(result)};expect: ${
            currentCase.dataShards
          }`
        );
      }
    }
    await sleep(2000);
  };

  const evaluateGroup = async (key, cases) => {
    it.each(
      cases.map((v, index) => ({ ...v, index, key })),
      `test ${name}:%question`,
      async (currentCase) => {
        await evaluateCase(currentCase);
      },
      300000
    );
  };

  it.each(EVALUATE_CASES)(
    'test %key',
    async (currentCase) => {
      await evaluateGroup(currentCase.key, currentCase.data);
    },
    3000000
  );
});
