const baseConfig = require('../../jest.config');

module.exports = {
  ...baseConfig,
  name: 'ava',
  displayName: 'ava',
  moduleNameMapper: {
    '^@antv/ava': ['<rootDir>/src/index.ts'],
    '^@ava/(.*)$': '<rootDir>/src/$1',
  },
};
