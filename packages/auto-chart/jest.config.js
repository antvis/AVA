const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  name: 'auto-chart',
  displayName: 'auto-chart',
  runner: 'jest-electron/runner',
  testEnvironment: 'jest-electron/environment',
  transform: {
    ...base.transform,
    '^.+\\.(ts|tsx)?$': '<rootDir>/node_modules/babel-jest',
  },
};
