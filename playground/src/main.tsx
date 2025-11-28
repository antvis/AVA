import React from 'react';

import ReactDOM from 'react-dom/client';

import axios from 'axios';

import App from './App';

import './index.css';

axios.interceptors.request.use(
  (config) => {
    if (config.url && config.url.includes('https://api.tbox.cn/api/completion')) {
      const originData = JSON.parse(config.data);
      config.headers['x-webgw-version'] = '2.0';
      config.headers['x-webgw-appid'] = '180020010001266875';
      config.headers['content-type'] = 'application/json';
      config.url = 'https://webgw-internet.alipay.com/antvservice/api/dsl';
      config.data = JSON.stringify({
        sceneName: 'tbox_agent',
        data: {
          appId: '202511APbBtP00568478',
          input: originData.inputs.input,
        },
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use((response) => {
  if (
    response.request.responseURL &&
    response.request.responseURL.includes('https://webgw-internet.alipay.com/antvservice/api/dsl')
  ) {
    response.data.data = {
      result: [
        {
          chunk: response.data.data,
        },
      ],
    };
  }
  return response;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
