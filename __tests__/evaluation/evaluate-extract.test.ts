import chalk from 'chalk';
import _ from 'lodash';
import { Advisor } from '../../src/advisor';
import { loadDataset } from './loadDataset';

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
  const { data: sourceData, metas: sourceMetas, purpose: sourcePurpose, shape: sourceShape } = source;
  const { data: targetData, metas: targetMetas, purpose: targetPurpose, shape: targetShape } = target;

  if (sourceShape !== targetShape) {
    return false;
  }

  let isDataValid = false;

  if (targetShape === 'plain') {
    // 检查 data: source 必须包含所有 target 的条目
    isDataValid = targetData.every((item) => sourceData.some((srcItem) => _.isEqual(srcItem, item)));
  } else if (targetShape === 'relation') {
    isDataValid = _.isEqual(targetData.nodes, sourceData.nodes) && _.isEqual(targetData.edges, sourceData.edges);
  } else if (targetShape === 'hierarchy') {
    isDataValid = _.isEqual(targetData, sourceData);
  }

  // 检查 metas 必须完全一致
  const isMetasValid = _.isEqual(sourceMetas, targetMetas);

  // 检查 purpose 枚举值必须一致
  const isPurposeValid = sourcePurpose.purpose === targetPurpose.purpose;

  return isDataValid && isMetasValid && isPurposeValid;
};

describe('extract evaluation pass rate > 98%', () => {
  const advisor = new Advisor({
    llm: {
      authorization: process.env.TBOX_LLM_AUTH || '',
      appId: process.env.TBOX_LLM_APP_ID || '',
    },
  });

  // todo: add more cases
  const EVALUATE_CASES = loadDataset('line').slice(0, 1);

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

  it('test pass rate >= 98%', async () => {
    await evaluateCase(EVALUATE_CASES[0]);
    expect(pass / total).toBeGreaterThanOrEqual(0.98);
  });
});
