const { pathsToModuleNameMapper } = require('ts-jest/utils');
const base = require('../../jest.config.base.js');

const { compilerOptions } = require('./tsconfig');
module.exports = {
  ...base,
  name: 'ava',
  displayName: 'ava',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),
};
