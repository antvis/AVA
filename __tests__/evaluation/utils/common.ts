import axios from 'axios';
import _ from 'lodash';

export const sleep = (duration: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};

export const requestTboxLLM = async (prompt: string): Promise<string> => {
  const appId = process.env.TBOX_LLM_APP_ID;
  const authorization = process.env.TBOX_LLM_AUTH;
  const maxRetryCount = 2;
  const timeout = 60000;
  let attempt = 0;
  const delay = 2000;
  const data = JSON.stringify({
    appId,
    userId: '1',
    stream: false,
    inputs: {
      input: prompt,
    },
  });

  while (attempt <= maxRetryCount) {
    try {
      const res = await axios.request({
        method: 'POST',
        maxBodyLength: Infinity,
        timeout,
        url: 'https://api.tbox.cn/api/completion',
        headers: {
          Authorization: authorization,
          'Content-Type': 'text/json',
          Accept: 'text/event-stream',
        },
        data,
      });
      return _.get(res, 'data.data.result[0].chunk', '');
    } catch (e) {
      if (attempt >= maxRetryCount) {
        return '';
      }
      attempt += 1;
      await sleep(delay);
    }
  }
  return '';
};
