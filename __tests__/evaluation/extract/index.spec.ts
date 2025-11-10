import chalk from 'chalk';
import _ from 'lodash';
import { Advisor } from '../../../src/advisor';
import PLAIN_TEXT_EXTRACT_CASE from './plain-text-extract.json';

const EVALUATE_CASES = [PLAIN_TEXT_EXTRACT_CASE];

const sleep = (duration: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};

/**
 * 判定生成是否符合标准
 * @param source
 * @param target
 * data: source 的条目必须包含所有的 target 的条目，可以多但不能少
 * metas: 必须完全一致
 * purpose: purpose 枚举值必须一致
 */
const evalSimilarity = (source, target) => {
  const { data: sourceData, metas: sourceMetas, purpose: sourcePurpose } = source;
  const { data: targetData, metas: targetMetas, purpose: targetPurpose } = target;

  // 检查 data: source 必须包含所有 target 的条目
  const isDataValid = targetData.every((item) => sourceData.some((srcItem) => _.isEqual(srcItem, item)));

  // 检查 metas 必须完全一致
  const isMetasValid = _.isEqual(sourceMetas, targetMetas);

  // 检查 purpose 枚举值必须一致
  const isPurposeValid = sourcePurpose === targetPurpose;

  return isDataValid && isMetasValid && isPurposeValid;
};

describe('extract evaluation pass rate > 98%', async () => {
  const advisor = new Advisor({
    llm: {
      authorization: process.env.TBOX_LLM_AUTH || '',
      appId: process.env.TBOX_LLM_APP_ID || '',
    },
  });

  const total = EVALUATE_CASES.length;
  let pass = 0;

  let currentCase;

  const evaluateCase = async () => {
    if (!currentCase) return;
    const result = await advisor.extract({
      purpose: currentCase.input,
    });

    if (result.length !== currentCase.expect.length) {
      console.log(chalk.red(`result length dismatch: expect ${currentCase.expect.length} but got ${result.length}`));
      console.log(chalk.red(`${currentCase.name} not pass!`));
    } else {
      const isValid = result.every((res, i) => evalSimilarity(res, currentCase.expect[i]));
      if (isValid) {
        pass++;
        console.log(chalk.greenBright(`${currentCase.name} pass!`));
      } else {
        console.log(chalk.red(`${currentCase.name} not pass!`));
      }
    }
    console.log(chalk.yellow('wait 2000ms...'));
    await sleep(2000);
  };

  for (const testCase of EVALUATE_CASES) {
    currentCase = testCase;
    it(`test ${testCase.name}`, evaluateCase);
  }

  it('test pass rate >= 98%', () => {
    expect(pass / total).toBeGreaterThanOrEqual(0.98);
  });
});
