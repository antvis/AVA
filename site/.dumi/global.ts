if (window) {
  (window as any).react = require('react');
  (window as any).reactDom = require('react-dom');
  (window as any).reactDomClient = require('react-dom/client');
  (window as any).antd = require('antd');
  (window as any).gptVis = require('@antv/gpt-vis');
  (window as any).ava = require('../../src');

  try {
    console.debug(process.env);
  } catch(e) {
    console.error(e);
  }
  // require('antd/lib/alert/style/index.css');
  // require('katex/dist/katex.min.css');
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
