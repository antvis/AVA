if (window) {
  (window as any).react = require('react');
  (window as any).reactDom = require('react-dom');
  (window as any).reactDomClient = require('react-dom/client');
  (window as any).antd = require('antd');
  (window as any).gptVis = require('@antv/gpt-vis');
  (window as any).reactJsonViewLite = require('react-json-view-lite');
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
