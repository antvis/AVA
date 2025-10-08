import { get } from 'lodash';
import axios from 'axios';

import { logError } from '@ava/utils';
import { sleep } from '@ava/utils/common';

/**
 * @desc Tbox 图表推荐非流式接口
 */
export const scoreChartConfigsWithLLM = async (params: { input: string; appId: string; authorization: string }) => {
  const { input, appId = '202508APgb7V00506760', authorization = 'TBox-c4ae8a71224e42baaafb1c01d15395a7' } = params;
  let retryCount = 0;
  const maxRetries = 3;
  const delay = 500;
  const data = JSON.stringify({
    appId,
    userId: '1',
    stream: false,
    inputs: {
      input,
    },
  });

  while (retryCount <= maxRetries) {
    try {
      const res = await axios.request({
        method: 'POST',
        maxBodyLength: Infinity,
        timeout: 10000,
        url: 'https://api.tbox.cn/api/completion',
        headers: {
          Authorization: authorization,
          'Content-Type': 'text/json',
          Accept: 'text/event-stream',
        },
        data,
      });
      return get(res, 'data.data.result[0].chunk', '');
    } catch (e) {
      logError(`请求tbox API失败，重试次数: ${retryCount}, ${e}`);
      if (retryCount >= maxRetries) {
        return '';
      }
      retryCount++;
      await sleep(delay);
    }
  }
  return '';
};
