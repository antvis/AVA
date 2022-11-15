/**
 * 增加自己的全局变量，用于 DEMO 中的依赖
 */

if (window) {
    (window as any).util = require('@antv/util');
    (window as any).G = require('@antv/g-canvas');
    (window as any).react = require('react');
    (window as any).reactDom = require('react-dom');
    (window as any).antd = require('antd');
    (window as any).chromaJs = require('chroma-js');
    (window as any).react = require('react');
    (window as any).icons = require('@ant-design/icons');
    (window as any).reactJsonView = require('react-json-view');
    (window as any).classnames = require('classnames');
    (window as any).pica = require('pica');
    (window as any).qrcode = require('qrcode');
    (window as any).reactVega = require('react-vega');
    (window as any).reactColor = require('react-color');
    (window as any).thumbnails = require('@antv/thumbnails');
    (window as any).thumbnailsComponent = require('@antv/thumbnails-component');
    (window as any).s2 = require('@antv/s2');
    (window as any).antvSpec = require('@antv/antv-spec');
    (window as any).smartColor = require('@antv/smart-color');
    (window as any).g6 = require('@antv/g6');
    (window as any).antvSiteDemoRc = require('antv-site-demo-rc');
    require('antd/lib/alert/style/index.css');
}