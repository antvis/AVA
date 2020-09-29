module.exports = {
  runner: 'jest-electron/runner',
  testEnvironment: 'jest-electron/environment',
  setupFilesAfterEnv: ['jest-extended'],
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  browser: false,
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: false,
  collectCoverageFrom: ['packages/**/src/**/*.ts'],
  testRegex: '/__tests__/.*.test.ts?$',
};
