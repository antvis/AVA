/* eslint-disable import/no-unresolved */
/**
 * Note the way of mounting dependencies
 * See: https://github.com/antvis/gatsby-theme-antv/issues/80
 */

window.react = require('react');
window.reactDom = require('react-dom');
window.antd = require('antd');
window.icons = require('@ant-design/icons');
window.reactJsonView = require('react-json-view');
// window.chartAdvisor = require('../../packages/chart-advisor/src');
// window.chartLinter = require('../chart-linter/src/');
// window.dwAnalyzer = require('../data-wizard/analyzer/src/');
window.autoChart = require('../../packages/auto-chart/src');
window.reactVega = require('react-vega');
// window.vega = require('@antv/thumbnails');
window.knowledge = require('../../packages/ckb/src');
window.thumbnails = require('@antv/thumbnails');
window.antvSpec = require('@antv/antv-spec');
window.chartAdvisor = require('../../packages/chart-advisor/src');

window.demoUtils = require('./utils');
