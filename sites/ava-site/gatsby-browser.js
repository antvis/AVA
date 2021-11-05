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
// window.chartAdvisor = require('../../packages/chart-advisor/src');
// window.chartLinter = require('../chart-linter/src/');
window.dataWizard = require('../../packages/data-wizard/src');
window.autoChart = require('../../packages/auto-chart/src');
window.reactVega = require('react-vega');
// window.vega = require('@antv/thumbnails');
window.knowledge = require('../../packages/ckb/src');
window.thumbnails = require('@antv/thumbnails');
window.s2 = require('@antv/s2');
window.antvSpec = require('@antv/antv-spec');
window.g2plot = require('@antv/g2plot');
window.chartAdvisor = require('../../packages/chart-advisor/src');
window.liteInsight = require('../../packages/lite-insight/lib');

window.demoUtils = require('./utils');
window.chartAdvisor = require('../../packages/chart-advisor/src');
window.g6 = require('@antv/g6');
