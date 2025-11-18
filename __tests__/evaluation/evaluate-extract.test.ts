import chalk from 'chalk';
import _ from 'lodash';
import { Advisor } from '../../src/advisor';
import { loadDataset } from './utils/loadDataset';

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

  const EVALUATE_CASES = loadDataset('line');

  const total = EVALUATE_CASES.length;
  let pass = 0;

  const evaluateCase = async (currentCase) => {
    const result = await advisor.extract(currentCase.question);
    if (result.length !== currentCase.dataShards.length) {
      console.log(
        chalk.red(`result length dismatch: expect ${currentCase.dataShards.length} but got ${result.length}`)
      );
      console.log(chalk.red(`${currentCase.name} not pass!`));
    } else {
      console.debug(result, currentCase.dataShards);
      const isValid = result.every((res, i) => evalSimilarity(res, currentCase.dataShards[i]));
      if (isValid) {
        pass++;
        console.log(chalk.greenBright(`${currentCase.question.slice(0, 10)} pass!`));
      } else {
        console.log(chalk.red(`${currentCase.question.slice(0, 10)} not pass!`));
        console.log('result', chalk.red(JSON.stringify(result)));
      }
    }
    console.log(chalk.yellow('wait 2000ms...'));
    await sleep(2000);
  };

  // evaluate for all case
  it('test pass rate >= 70%', async () => {
    for (const CASE of EVALUATE_CASES) {
      await evaluateCase(CASE);
    }
    expect(pass / total).toBeGreaterThanOrEqual(0.7);
  }, 30000000);
});
