const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  name: 'smart-board',
  displayName: 'smart-board',
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.tsx$': 'ts-jest',
  },
};
