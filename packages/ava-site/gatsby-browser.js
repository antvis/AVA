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
window.knowledge = require('../knowledge/src/');
window.thumbnails = require('@antv/thumbnails');

window.demoUtils = require('./utils/');
