/**
 * Note the way of mounting dependencies
 * See: https://github.com/antvis/gatsby-theme-antv/issues/80
 */

window.react = require('react');
window.reactDom = require('react-dom');
window.antd = require('antd');
window.icons = require('@ant-design/icons');
window.reactJsonView = require('react-json-view');
window.chartAdvisor = require('../chart-advisor/src/');
window.chartLinter = require('../chart-linter/src/');
window.dwAnalyzer = require('../datawizard/analyzer/src/');
window.reactVega = require('react-vega');
window.vega = require('@antv/thumbnails');
window.knowledge = require('../knowledge/src/');
window.thumbnails = require('@antv/thumbnails');

window.demoUtils = require('./utils/');
