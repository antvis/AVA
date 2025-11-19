import _ from 'lodash';
import fs from 'fs';
import winston from 'winston';
import { requestTboxLLM } from '../utils/common';
import { GENRATE_RESULT_LOG_PATH, EVALUATE_ERROR_LOG_PATH, EVALUATE_RESULT_LOG_PATH } from './constants';

const prompt = `
  # 角色: 你是一个数据评测专家;
  # 任务: 我会给出一份日志数据，请你根据我的任务描述来评测，输出通过和不通过，以及给出通过或者不通过理由;
  - 我会给出一条 json 的日志信息，其中的 message 字段包含了需要评测的内容；
  - message 字段包含了生成的数据以及数据元信息和预期的数据以及数据元信息；
  - 生成的数据以 genrate 为标识，预期的数据以 source 为标识；
  - 评测通过的条件为
    - 生成的结果需要包含预期结果的绝大部分信息内容，可能结构不一致，但是信息量需要尽量包含；
    - 部分数据字段为空或者 key 不一致，不影响通过性；
    - 长表数据和宽表数据的形状不同不影响通过性，因为数据形状不一致导致的元信息差异不影响通过性；
  # 输出格式，输出 json 字符串，不要包含 markdown 的 \`\`\`json 的代码块标识;
  - 输出格式如下，用 typescript 定义
  \`\`\`ts
  interface IResult {
    pass: boolean;
    reason: string;
  }
  \`\`\`
  我给的日志信息如下:
`;

export const evaluate = async () => {
  const content = fs.readFileSync(GENRATE_RESULT_LOG_PATH);
  const lines = content.toString().split('\n').filter(line => line.length > 0);

  console.log('data length:', lines.length);

  if (fs.existsSync(EVALUATE_RESULT_LOG_PATH)) {
    fs.rmSync(EVALUATE_RESULT_LOG_PATH);
  }

  if (fs.existsSync(EVALUATE_ERROR_LOG_PATH)) {
    fs.rmSync(EVALUATE_ERROR_LOG_PATH);
  }

  const logger = winston.createLogger({
    format: winston.format.json(),
    defaultMeta: { service: 'evaluate-service' },
    transports: [
      new winston.transports.File({ filename: EVALUATE_ERROR_LOG_PATH, level: 'error' }),
      new winston.transports.File({ filename: EVALUATE_RESULT_LOG_PATH, level: 'info' }),
    ],
  });

  let success = 0;

  for (const line of lines) {
    if (!line.length) continue;
    try {
      const data = JSON.parse(line);
      const { message } = data;
      try {
        const res = await requestTboxLLM(`${prompt}\n${line}`);
        const comment = JSON.parse(res);
        logger.info({
          pass: comment.pass,
          reason: comment.reason,
          input: message.input,
          generate: message.generate,
          source: message.source,
        });
        success++;
      } catch (e) {
        logger.error({
          error: e.message,
          input: message.input,
          generate: message.generate,
          source: message.source,
        });
      }
    } catch (e) {
      logger.error({
        error: 'parse error',
        data: line,
      });
      continue;
    }
  }

  return {
    success,
    total: lines.length,
  };
};
