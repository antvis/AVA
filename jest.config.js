module.exports = {
  testPathIgnorePatterns: ['/lib/', '/esm/'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverage: false,
  testRegex: '(/__tests__/unit/.*.(test|spec)).(js?|jsx?|tsx?|ts?)$',
  coveragePathIgnorePatterns: ['(tests/.*.mock).(jsx?|tsx?)$'],
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^@antv/ava': ['<rootDir>/src/index.ts'],
    '^@ava/(.*)$': '<rootDir>/src/$1',
  },
};
