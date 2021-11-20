/* eslint-disable import/no-unresolved */
/**
 * Note the way of mounting dependencies
 * See: https://github.com/antvis/gatsby-theme-antv/issues/80
 */

import 'antd/dist/antd.less';

window.react = require('react');
window.reactDom = require('react-dom');
window.antd = require('antd');
window.icons = require('@ant-design/icons');
window.reactJsonView = require('react-json-view');
window.classnames = require('classnames');
window.pica = require('pica');
window.qrcode = require('qrcode');
window.dataWizard = require('../../packages/data-wizard/src');
window.autoChart = require('../../packages/auto-chart/src');
window.reactVega = require('react-vega');
window.reactColor = require('react-color');
window.ckb = require('../../packages/ckb/src');
window.thumbnails = require('@antv/thumbnails');
window.thumbnailsComponent = require('@antv/thumbnails-component');
window.s2 = require('@antv/s2');
window.g2plot = require('@antv/g2plot');
window.antvSpec = require('@antv/antv-spec');
window.liteInsight = require('../../packages/lite-insight/lib');
window.smartColor = require('@antv/smart-color');
window.chartAdvisor = require('../../packages/chart-advisor/src');
window.smartBoard = require('../../packages/smart-board/src');

window.demoUtils = require('./utils');
window.chartAdvisor = require('../../packages/chart-advisor/src');
window.g6 = require('@antv/g6');
window.antvSiteDemoRc = require('antv-site-demo-rc');
