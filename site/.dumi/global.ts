if (window) {
  (window as any).react = require('react');
  (window as any).reactDom = require('react-dom');
  (window as any).reactDomClient = require('react-dom/client');
  (window as any).antd = require('antd');
  (window as any).gptVis = require('@antv/gpt-vis');
  (window as any).reactJsonViewLite = require('react-json-view-lite');
  const axios = require('axios');

  /** 代理百宝箱请求 */
  axios.interceptors.request.use(
    (config) => {
      // 检查请求URL是否匹配目标域名
      if (config.url && config.url.includes('https://api.tbox.cn/api/completion')) {
        const originData = JSON.parse(config.data);
        config.headers['x-webgw-version'] = '2.0';
        config.headers['x-webgw-appid'] = '180020010001266875';
        config.headers['content-type'] = 'application/json';
        config.url = 'https://webgw-internet.alipay.com/antvservice/api/dsl'
        config.data = JSON.stringify({
          'sceneName': 'tbox_agent',
          'data': {
            'appId': '202511APbBtP00568478',
            'input': originData.inputs.input,
          }
        });
      };
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use((response) => {
    if (response.request.responseURL && response.request.responseURL.includes('https://webgw-internet.alipay.com/antvservice/api/dsl')) {
      response.data.data = {
        result: [
          {
            chunk: response.data.data,
          }
        ]
      };
    };
    return response;
  });

  (window as any).ava = require('../../src');
  require('react-json-view-lite/dist/index.css');
}

if (
  location.host === 'ava.antv.vision' ||
  location.host === 'antv-ava.gitee.io'
) {
  (window as any).location.href = location.href.replace(
    location.origin,
    'https://ava.antv.antgroup.com',
  );
}
